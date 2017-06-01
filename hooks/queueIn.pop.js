'use strict';

var findChannel = require('../helpers/findChannel');
var emailUnserialize = require('../helpers/email/unserialize');

module.exports = {
    send: function(msg) {
        msg.channel = findChannel.call(this, msg.port);
        return msg;
    },
    receive: function(msg, $meta) {
        if (msg.channel === 'email') {
            msg.content = emailUnserialize.call(this, msg.content);
        }
        return msg;
    }
};
