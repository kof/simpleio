var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    $ = require('../../shared/utils');

function Memory(opts) {
    opts = this.options = $.extend({}, Memory.options, opts);
    this._messagesMap = {};
    this._recipientsMap = {};

    if (opts.cleanup) {
        this._cleanupIntervalId = setInterval(
            this._cleanup.bind(this),
            opts.cleanupInterval
        );
    }
}

util.inherits(Memory, EventEmitter);
module.exports = Memory;

Memory.options = {
    maxAge: 1000 * 60 * 60,
    cleanupInterval: 1000 * 60 * 3,
    cleanup: true
};

Memory.prototype.dispatch = function(recipient, data, callback) {
    var message;

    message = this._add(recipient, {
        data: data,
        event: 'dispatch:' + recipient
    });

    this.emit(message.event, message);

    process.nextTick(function() {
        callback(null, message.id);
    });

    return this;
};

Memory.prototype._add = function(recipient, obj) {
    obj.id = $.id();
    obj.date = Date.now();
    obj.recipient = recipient;
    obj.deliverable = true;
    obj.delivered = {};
    this._messagesMap[obj.id] = obj;

    if (!this._recipientsMap[recipient]) {
        this._recipientsMap[recipient] = {};
    }
    this._recipientsMap[recipient][obj.id] = obj;

    return obj;
};

/**
 * Get all messages for the recipient, which are deliverable.
 */
Memory.prototype.get = function(recipient, callback) {
    var messagesArr = [],
        messages = this._recipientsMap[recipient],
        id;

    if (messages) {
        for (id in messages) {
            if (messages[id].deliverable) {
                if (messages[id].message) {
                    messagesArr.push(messages[id].message);
                }
            }
        }
    }

    process.nextTick(function() {
        callback(null, messagesArr);
    });

    return this;
};

Memory.prototype.delivery = function(opts, callback) {
    if (this._messagesMap[opts.messageId]) {
        if (opts.deliverable != null) {
            this._messagesMap[opts.messageId].deliverable = opts.deliverable;
        } else {
            this._messagesMap[opts.messageId].delivered[opts.client] = opts.delivered;
        }
    }

    if (opts.publish && opts.delivered) {
        this.emit('delivered:' + opts.messageId);
    }

    process.nextTick(callback);

    return this;
};

Memory.prototype.destroy = function() {
    clearInterval(this._cleanupIntervalId);
    this.removeAllListeners();
    this._messagesMap = {};
    this._recipientsMap = {};

    return this;
};

Memory.prototype._cleanup = function() {
    var now = Date.now(),
        id, message;

    for (id in this._messagesMap) {
        message = this._messagesMap[id];
        if (message.date + this.options.maxAge < now) {
            delete this._recipientsMap[message.recipient][id];
            delete this._messagesMap[id];
        }
    }

    return this;
};
