const errors = require('../../errors');

// PRIVATE

/**
 * Creates a common alert.message.send msg.
 * @param {String} operatingSystem - the OS of the device
 * @param {Object} notification
 * @param {Object} osToProviderMap - map between device OS and provider
 */
const buildCommonAlertMessageSendMsg = function(operatingSystem, notification, osToProviderMap) {
    return {
        port: osToProviderMap[operatingSystem],
        channel: 'push',
        languageCode: 1,
        priority: 1,
        template: 'push.common',
        payload: notification.payload,
        recipient: []
    };
};

// EXPORTED

/**
 * Insert JSON-stringified data, notification and extra to the payload.
 * Delete the fields form the notification object.
 * @param {Object} notification
 */
const preparePayload = function(notification) {
    notification.payload = {
        data: JSON.stringify(notification.data),
        notification: JSON.stringify(notification.notification),
        extra: JSON.stringify(notification.extra)
    };
    delete notification.data;
    delete notification.notification;
    delete notification.extra;
};

/**
 * Fills recipients array for each provider.
 * @param {Object} notification
 */
const distributeRecipients = function(notification, osToProviderMap) {
    var providerAlertMessageSends = {};
    if (notification.devices.length) {
        notification.devices.forEach(device => {
            const deviceOS = device.deviceOS;
            if (!providerAlertMessageSends[deviceOS]) {
                providerAlertMessageSends[deviceOS] = buildCommonAlertMessageSendMsg(deviceOS, notification, osToProviderMap);
            }
            var providerAlertMessageSendMsg = providerAlertMessageSends[deviceOS];
            const recipient = JSON.stringify({
                actorId: device.actorId,
                installationId: device.installationId
            });
            providerAlertMessageSendMsg.recipient.push(recipient);
        });
    }
    var providerKeys = Object.keys(providerAlertMessageSends);
    providerKeys.forEach(providerKey => {
        notification.providerAlertMessageSends.push(providerAlertMessageSends[providerKey]);
    });
};

/**
 * Handles immediate sending of push notifications.
 * Flow:
 * 1. Checks for messages, that are inserted with manually set status "PROCESSING"
 * 2. Finds the pushNotificationToken for the message's recipient
 * 3. Prepares a simple message, that will be used by provider ports (currently only ut-port-firebase)
 * 4. Dispatches that message, and handles success/failure.
 *
 * @param {Array} response - array of providers, containing results of alert.message.send
 * @param {Object} context - the Port (bus, config...)
 */
const handleImmediatePushNotificationSend = function(response, context) {
    var insertedRowsForImmediateProcessing = [];
    response.forEach(providerResponse => {
        const inserted = providerResponse.inserted; // inserted - this is the result of alert.message.send
        inserted.length && inserted.forEach(insertedRow => {
            if (insertedRow.status === 'PROCESSING') {
                insertedRowsForImmediateProcessing.push(insertedRow);
            }
        });
    });
    // If there are no inserted rows with status "PROCESSING",
    // There is no need to handle immediate send. Just return the original response.
    if (!insertedRowsForImmediateProcessing.length) {
        return response;
    }
    // Initialize an array, that will containe send promises.
    var getRecipientPushNotificationToken = (insertedRow) => {
        var recipient = JSON.parse(insertedRow.recipient);
        return context.bus.importMethod('user.device.get')({
            actorId: recipient.actorId,
            installationId: recipient.installationId
        }).then(userDeviceResult => {
            if (!userDeviceResult.device.length || userDeviceResult.device.length > 1) {
                throw errors['alert.push.ambiguousResultForActorDevice']();
            }
            return userDeviceResult.device[0].pushNotificationToken;
        });
    };
    var preparePushMessage = (insertedRow) => (pushNotificationToken) => {
        return {
            id: insertedRow.id,
            content: insertedRow.content,
            pushNotificationToken
        };
    };
    var handleSuccess = (message) => (sendResponse) => {
        message.status = 'DELIVERED';
        return context.config['alert.push.notification.handleSuccess']({ message, sendResponse });
    };
    var handleFailure = (message) => (errorResponse) => {
        message.status = 'FAILED';
        return context.config['alert.push.notification.handleFailure']({ message, errorResponse });
    };
    // Define similar function for each provider.
    var dispatchToFirebase = (fcmMessage) => context.bus.importMethod('firebase.fcm.send')(fcmMessage);
    if (insertedRowsForImmediateProcessing.length) {
        var sendNotificationPromises = [];
        var dispatchToProvderPort = () => Promise.reject(errors['alert.push.providerNotImplemented']()); // Default - reject with no support.
        insertedRowsForImmediateProcessing.forEach(insertedRow => {
            if (insertedRow.port === 'firebase') {
                dispatchToProvderPort = dispatchToFirebase;
            }
            var promise = getRecipientPushNotificationToken(insertedRow)
                .then(preparePushMessage(insertedRow))
                .then(dispatchToProvderPort)
                .then(handleSuccess(insertedRow))
                .catch(handleFailure(insertedRow));
            sendNotificationPromises.push(promise);
        });
        return Promise.all(sendNotificationPromises).then(() => response);
    } else {
        return response;
    }
};

module.exports = {
    preparePayload,
    distributeRecipients,
    handleImmediatePushNotificationSend
};
