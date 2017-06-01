'use strict';

var errors = require('../errors');

module.exports = {
    send: function(msg) {
        if (typeof msg.content !== 'object') {
            throw errors['alert.fieldValueInvalid']({field: 'content', value: msg.content});
        }
        if (typeof msg.content.subject !== 'string' || msg.content.subject.length <= 0) {
            throw errors['alert.fieldValueInvalid']({field: 'content.subject', value: msg.content.subject});
        }
        let hasHtml = false;
        let hasText = false;
        let content = {
            subject: msg.content.subject
        };
        if (msg.content.html) {
            if (typeof msg.content.html !== 'string' || msg.content.html.length <= 0) {
                throw errors['alert.fieldValueInvalid']({field: 'content.html', value: msg.content.subject});
            }
            hasHtml = true;
            content.html = msg.content.html;
        }
        if (msg.content.text) {
            if (typeof msg.content.text !== 'string' || msg.content.text.length <= 0) {
                throw errors['alert.fieldValueInvalid']({field: 'content.html', value: msg.content.subject});
            }
            hasText = true;
            content.text = msg.content.text;
        }
        if (!hasHtml && !hasText) {
            throw errors['alert.fieldMissing']({field: ['content.html', 'content.text'], requiredCount: 1});
        }

        msg.content = JSON.stringify(content);
        return msg;
    },
    receive: function(msg) {
        msg.content = JSON.parse(msg.content);
        return msg;
    }
};
