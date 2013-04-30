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

Memory.prototype.add = function(recipient, data, callback) {
    var id = $.id(),
        message;

    message = this._messagesMap[id] = {
        id: id,
        data: data,
        date: Date.now(),
        recipient: recipient,
        delivered: null
    };

    if (!this._recipientsMap[recipient]) {
        this._recipientsMap[recipient] = {};
    }

    this._recipientsMap[recipient][id] = message;

    this.emit('add:' + recipient, message);

    process.nextTick(function() {
        callback(null, id);
    });

    return this;
};

Memory.prototype.subscribe = function(event, callback) {
    this.on(event, callback);

    return this;
};

Memory.prototype.unsubscribe = function(event, callback) {
    this.removeListener(event, callback);

    return this;
};

/**
 * Get all messages for the recipient, which delivery status is not defined.
 */
Memory.prototype.get = function(recipient, callback) {
    var messagesArr = [],
        messages = this._recipientsMap[recipient],
        id;

    if (messages) {
        for (id in messages) {
            if (messages[id].delivered == null) {
                messagesArr.push(messages[id].message);
            }
        }
    }

    process.nextTick(function() {
        callback(null, messagesArr);
    });

    return this;
};

Memory.prototype.delivered = function(id, value, publish, callback) {
    if (this._messagesMap[id]) {
        this._messagesMap[id].delivered = value;
    }

    if (publish && value) {
        this.emit('delivered:' + id);
    }

    process.nextTick(function() {
        callback();
    });

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
