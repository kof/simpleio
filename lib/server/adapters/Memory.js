var Adapter = require('../Adapter'),
    util = require('util'),
    $ = require('../../shared/utils');

function Memory(opts) {
    this.options = opts = $.extend({}, Memory.options, opts);
    this._messagesMap = {};
    this._recipientsMap = {};

    if (opts.cleanup) {
        this._cleanupIntervalId = setInterval(
            this._cleanup.bind(this),
            opts.cleanupInterval
        );
    }
}

util.inherits(Memory, Adapter);
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

/**
 * A client opened a connection. Put the document to determine later
 * if the client is connected.
 *
 * @param {String|Number} sender
 * @param {Function} callback
 * @return {Mongo} this
 */
Memory.prototype.open = function(sender, callback) {
    var id = $.uid();

    this._messagesMap[id] = {
        id: id,
        date: new Date,
        sender: sender
    };
    this.emit('open', this._messagesMap[id]);
    process.nextTick(callback);

    return this;
};

/**
 * Get users who opened a connection since x date.
 *
 * @param {Date} since the date since user has send messages
 * @param {Function} callback
 * @return {Mongo} this
 */
Memory.prototype.connected = function(since, callback) {
    var ids = {};

    $.each(this._messagesMap, function(message, id) {
        if (message.sender && message.date > since) {
            ids[message.sender] = true;
        }
    });

    process.nextTick(function() {
        callback(null, Object.keys(ids));
    });

    return this;
};

Memory.prototype._add = function(recipient, obj) {
    obj.id = $.uid();
    obj.date = new Date;
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
                if (messages[id].data) {
                    messagesArr.push(messages[id]);
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
        if (message.date.getTime() + this.options.maxAge < now) {
            if (message.recipient) {
                delete this._recipientsMap[message.recipient][id];
            }
            delete this._messagesMap[id];
        }
    }

    return this;
};
