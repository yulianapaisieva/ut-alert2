'use strict';
var Main = require('ut-error').define('alert');

var ConfigurationError = require('ut-error').define('ConfigurationError', Main);
var ChannelNotFound = require('ut-error').define('channelNotFound', ConfigurationError);

module.exports = function(port) {
    if (!this.bus.config.alert || !this.bus.config.alert.ports) {
        let err = ConfigurationError('configuration missing key');
        err.path = ['alert', 'ports'];
        throw err;
    }
    if (!this.bus.config.alert.ports[port]) {
        throw ChannelNotFound('channel for port not found');
    }

    var portOptions = this.bus.config.alert.ports[port];

    if (!portOptions.channel) {
        let err = ConfigurationError('configuration missing key');
        err.path = ['alert', 'ports', {type: 'key', any: true}, 'channel'];
        throw err;
    }

    return portOptions.channel;
};
