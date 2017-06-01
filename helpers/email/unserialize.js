'use strict';

module.exports = function(msg) {
    msg.content = JSON.parse(msg.content);
    return msg;
};
