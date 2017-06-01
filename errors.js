var create = require('ut-error').define;
module.exports = [
    {
        name: 'alert',
        defaultMessage: 'ut-alert error',
        level: 'error'
    },
    {
        name: 'alert.push',
        defaultMessage: 'Push notifications error',
        level: 'error'
    },
    {
        name: 'alert.push.providerNotImplemented',
        defaultMessage: 'Push notifications: Provider is not yet implemented',
        level: 'error'
    },
    {
        name: 'alert.push.ambiguousResultForActorDevice',
        defaultMessage: 'Zero or more than one device returned for an actorId & installationId!',
        level: 'warn'
    },
    {
        name: 'alert.messageNotExists',
        defaultMessage: 'Message does not exists',
        level: 'error'
    },
    {
        name: 'alert.messageInvalidStatus',
        defaultMessage: 'Invalid message status',
        level: 'error'
    },
    {
        name: 'alert.missingCreatorId',
        defaultMessage: 'Missing credentials',
        level: 'error'
    },
    {
        name: 'alert.templateNotFound',
        defaultMessage: 'Unable to find template matching parameters',
        level: 'error'
    },
    {
        name: 'alert.fieldValueInvalid',
        defaultMessage: 'ut-alert invalid field error',
        level: 'error'
    },
    {
        name: 'alert.fieldMissing',
        defaultMessage: 'ut-alert missing field',
        level: 'error'
    }
].reduce(function(prev, next) {
    var spec = next.name.split('.');
    var Ctor = create(spec.pop(), spec.join('.'), next.defaultMessage, next);
    prev[next.name] = function(params) {
        return new Ctor({params: params});
    };
    return prev;
}, {});
