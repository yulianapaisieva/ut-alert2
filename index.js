var path = require('path');
var lodashTemplate = require('lodash.template');
var errors = require('./errors');
var findChannel = require('./helpers/findChannel');
var pushHelpers = require('./helpers/push');

module.exports = {
    schema: [{path: path.join(__dirname, '/schema'), linkSP: true}],
    'queueOut.push.request.send': require('./hooks/queueOut.push').send,
    'queueOut.push.response.receive': require('./hooks/queueOut.push').receive,
    'queueOut.pop.request.send': require('./hooks/queueOut.pop').send,
    'queueOut.pop.response.receive': require('./hooks/queueOut.pop').receive,
    'queueIn.pop.request.send': require('./hooks/queueIn.pop').send,
    'queueIn.pop.response.receive': require('./hooks/queueIn.pop').receive,
    /**
     * Internal methods for handling success and failure of sending a push notification.
     * These are called either by the [alert.push.notification.send] or by a cron in the implementations
     * after the sending has finished and a response has been received by the provider.
     */
    'push.notification.handleSuccess': function(msg, $meta) {
        var { message, sendResponse } = msg; // message is the inserted row of alert.queueOut.push
        var { actorId, installationId } = JSON.parse(message.recipient);
        var updatePushNotificationToken = (updatedPushNotificationToken, actorId, installationId) => this.bus.importMethod('user.device.update')({
            actorDevice: {
                actorId,
                installationId,
                pushNotificationToken: updatedPushNotificationToken
            }
        });
        var notifySuccess = () => this.bus.importMethod('alert.queueOut.notifySuccess')({
            messageId: message.id,
            refId: sendResponse.refId
        });
        if (sendResponse.updatedPushNotificationToken) {
            return updatePushNotificationToken(sendResponse.updatedPushNotificationToken, actorId, installationId)
                .then(notifySuccess);
        } else {
            return notifySuccess();
        }
    },
    'push.notification.handleFailure': function(msg, $meta) {
        var { message, errorResponse } = msg; // message is the inserted row of alert.queueOut.push
        var { actorId, installationId } = JSON.parse(message.recipient);
        var removePushNotificationToken = (actorId, installationId) => this.bus.importMethod('user.device.update')({
            actorDevice: {
                actorId,
                installationId,
                pushNotificationToken: null
            }
        });
        var notifyFailure = () => this.bus.importMethod('alert.queueOut.notifyFailure')({
            messageId: message.id,
            errorMessage: (errorResponse && errorResponse.error && errorResponse.error.message) || 'Failed to send push notification.',
            errorCode: (errorResponse && errorResponse.error && errorResponse.error.code) || 'pushNotificationFailure'
        });
        if (errorResponse.removePushNotificationToken) {
            return removePushNotificationToken(actorId, installationId)
                .then(notifyFailure);
        } else {
            return notifyFailure();
        }
    },
    /**
     * Sends a push notification. Currently only Google Firebase is supported.
     * Data in "notification" can be filtered or remapped to another place in the actual call
     * to the provider, according to provider's documentation.
     *
     * msg: {
     *   immediate: boolean, (defaults to false)
     *   notification: {
     *     title: "You have a new Message!",
     *     body: "Sample description of the notification"
     *     ...
     *   },
     *   data: {
     *     foo: 'foo',
     *     bar: 'bar', ...
     *   },
     *   extra: {
     *     collapse_key: "collapse_key",
     *     mutable_content: true,
     *     priority: "normal" | "high",
     *     time_to_live: 3600
     *   }
     * }
     */
    'push.notification.send': function(msg, $meta) {
        var context = this;
        var config = this.bus.config.alert;
        var userDeviceGetParams = {
            actorId: msg.actorId,
            installationId: msg.installationId ? msg.installationId : null
        };
        var notification = {
            notification: msg.notification ? msg.notification : {},
            data: msg.data ? msg.data : {},
            extra: msg.extra ? msg.extra : {},
            // System info
            immediate: msg.immediate ? msg.immediate : false,
            providerAlertMessageSends: [] // "alert.message.send" msg objects for each supported provider
        };
        // When the user.device.get procedure returns - append the devices array to the notification object.
        var getDevices = (notification) => this.bus.importMethod('user.device.get')(userDeviceGetParams).then(response => {
            notification.devices = response.device.filter(device => {
                return device.pushNotificationToken !== null;
            });
            return notification;
        });
        var prepareAlertMessageSends = (notification) => {
            pushHelpers.preparePayload(notification);
            pushHelpers.distributeRecipients(notification, config.push.deviceOSToProvider);
            delete notification.devices;
            return notification;
        };
        var prepareAlertMessageSendPromises = (notification) => {
            var alertMessageSendPromises = [];
            notification.providerAlertMessageSends.forEach(alertMessageSend => {
                if (notification.immediate) {
                    alertMessageSend.statusName = 'PROCESSING';
                }
                delete alertMessageSend.immediate;
                $meta.method = 'alert.message.send';
                alertMessageSendPromises.push(context.config[$meta.method](alertMessageSend, $meta));
            });
            return Promise.all(alertMessageSendPromises);
        };
        var handleAlertMessageSendResponse = (response) => {
            // This is the "default" behavior, the messages are queued and awaiting to be processed.
            if (!response.length) {
                return response;
            }
            return pushHelpers.handleImmediatePushNotificationSend(response, context);
        };
        return getDevices(notification)
            .then(prepareAlertMessageSends)
            .then(prepareAlertMessageSendPromises)
            .then(handleAlertMessageSendResponse);
    },
    'message.send': function(msg, $meta) {
        var bus = this.bus;
        var languageCode = msg.languageCode;
        if (!languageCode) {
            languageCode = ($meta.language && $meta.language.iso2Code) || null;
            if (!languageCode) {
                languageCode = bus.config.defaultLanguage;
                if (!languageCode) {
                    throw errors['alert.templateNotFound']({helperMessage: 'Language code is not specified'});
                }
            }
        }
        var channel = findChannel.call(this, msg.port);
        return bus.importMethod('alert.template.fetch')({
            channel: channel,
            name: msg.template,
            languageCode: languageCode
        }).then(function(response) {
            return getTemplates(bus, response, channel, languageCode, msg.template);
        }).then(function(templates) {
            msg.content = getContent(templates, channel, msg.template, msg.data, msg.payload);
            delete msg.template;
            delete msg.data;
            delete msg.payload;
            $meta.method = 'alert.queueOut.push';
            return bus.importMethod($meta.method)(msg, $meta);
        });
    }
};

const getTemplates = (bus, response, channel, languageCode, msgTemplate) => {
    if (Array.isArray(response.templates) && response.templates.length > 0) {
        return response.templates;
    }
    if (bus.config.defaultLanguage && languageCode !== bus.config.defaultLanguage) {
        return bus.importMethod('alert.template.fetch')({
            channel: channel,
            name: msgTemplate,
            languageCode: bus.config.defaultLanguage
        }).then(function(response) {
            if (Array.isArray(response.templates) && response.templates.length > 0) {
                return response.templates;
            }
            throw errors['alert.templateNotFound']({
                helperMessage: 'No template found in database',
                matching: {
                    channel: channel,
                    name: msgTemplate,
                    languageCode: languageCode
                }
            });
        });
    }
    throw errors['alert.templateNotFound']({
        helperMessage: 'No template found in database',
        matching: {
            channel: channel,
            name: msgTemplate,
            languageCode: languageCode
        }
    });
};

const getContent = (templates, channel, msgTemplate, msgData, msgPayload) => {
    var templateMap = {};
    var content;
    templates.forEach(function(template) {
        templateMap[template.type] = template;
    });
    // TODO: Find a better way to generate a content without iteration by channels.
    // TODO: SMS channel content is just a string.
    // TODO: Email channel content is an object containing properties "subject" and at least one of "text" or "html".
    // TODO: Perhaps automate the properties generation with special "root" (for SMS channel) and then validate properties through alert.queueOut.push.
    // TODO: e.g. email: /subject = emailSubjectTemplate; email: /html = emailHtmlTemplate; sms: / = smsTemplate
    if (channel === 'sms') {
        if (!templateMap.hasOwnProperty('smsTemplate')) {
            throw errors['alert.templateNotFound'](
                {helperMessage: `Unable to find entry to itemName corresponding to itemType "smsTemplate" for template "${msgTemplate}"`}
            );
        }
        content = lodashTemplate(templateMap.smsTemplate.content)(msgData || {});
    } else if (channel === 'email') {
        if (!templateMap.hasOwnProperty('emailSubjectTemplate')) {
            throw errors['alert.templateNotFound'](
                {helperMessage: `Unable to find entry to itemName corresponding to itemType "emailSubjectTemplate" for template "${msgTemplate}"`}
            );
        }
        if (!templateMap.hasOwnProperty('emailTextTemplate') && !templateMap.hasOwnProperty('emailHtmlTemplate')) {
            throw errors['alert.templateNotFound'](
                {helperMessage: `Unable to find entry to itemName corresponding to itemType "emailTextTemplate" or "emailHtmlTemplate" for template "${msgTemplate}"`}
            );
        }
        content = {
            subject: lodashTemplate(templateMap.emailSubjectTemplate.content)(msgData || {})
        };
        if (templateMap.hasOwnProperty('emailTextTemplate')) {
            content.text = lodashTemplate(templateMap.emailTextTemplate.content)(msgData || {});
        }
        if (templateMap.hasOwnProperty('emailHtmlTemplate')) {
            content.html = lodashTemplate(templateMap.emailHtmlTemplate.content)(msgData || {});
        }
    } else if (channel === 'push') {
        if (!templateMap.hasOwnProperty('pushNotificationTemplate')) {
            throw errors['alert.templateNotFound'](
                {helperMessage: `Unable to find entry to itemName corresponding to itemType "pushNotificationTemplate" for template "${msgTemplate}"`}
            );
        }
        content = lodashTemplate(templateMap.pushNotificationTemplate.content)(msgPayload || {});
    } else {
        throw errors['alert.templateNotFound']({helperMessage: `Channel "${channel}" is not supported, yet`});
    }
    return content;
};
