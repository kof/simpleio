var Adapter = require('../Adapter'),
    util = require('util'),
    $ = require('../../shared/utils');

/**
 * Memory adapter constructor.
 *
 * @param {Object} opts will overwrite default options, see `Memory.options`
 * @api public
 */
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

/**
 * Default options.
 *
 *   - `maxAge` message lifetime
 *   - `cleanupInterval` interval when to cleanup the cache
 *   - `cleanup` true if cache should be periodically cleaned up
 *
 * @type Object
 */
Memory.options = {
    maxAge: 1000 * 60 * 60,
    cleanupInterval: 1000 * 60 * 3,
    cleanup: true
};

/**
 * @see Adapter#dispatch
 * @api public
 */
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
 * @see Adapter#open
 * @api public
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
 * @see Adapter#connected
 * @api public
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

/**
 * Add a message to the cache, add default props to it.
 *
 * @param {String|Number} recipient
 * @param {Object} message
 * @return {Object} message
 * @api private
 */
Memory.prototype._add = function(recipient, message) {
    message.id = $.uid();
    message.date = new Date;
    message.recipient = recipient;
    message.deliverable = true;
    message.delivered = [];
    this._messagesMap[message.id] = message;

    if (!this._recipientsMap[recipient]) {
        this._recipientsMap[recipient] = {};
    }
    this._recipientsMap[recipient][message.id] = message;

    return message;
};


/**
 * @see Adapter#get
 * @api public
 */
Memory.prototype.get = function(recipient, since, callback) {
    var messagesArr = [],
        messages = this._recipientsMap[recipient],
        id;

    if (messages) {
        for (id in messages) {
            if (messages[id].deliverable &&
                messages[id].data &&
                messages[id].date >= since) {

                messagesArr.push(messages[id]);
            }
        }
    }

    process.nextTick(function() {
        callback(null, messagesArr);
    });

    return this;
};

/**
 * @see Adapter#delivery
 * @api public
 */
Memory.prototype.delivery = function(opts, callback) {
    if (this._messagesMap[opts.messageId]) {
        if (opts.deliverable != null) {
            this._messagesMap[opts.messageId].deliverable = opts.deliverable;
        } else if (opts.delivered) {
            this._messagesMap[opts.messageId].delivered.push(opts.client);
        }
    }

    if (opts.publish && opts.delivered) {
        this.emit('delivered:' + opts.messageId);
    }

    process.nextTick(callback);

    return this;
};

/**
 * @see Adapter#destroy
 * @api public
 */
Memory.prototype.destroy = function() {
    clearInterval(this._cleanupIntervalId);
    this.removeAllListeners();
    this._messagesMap = {};
    this._recipientsMap = {};

    return this;
};

/**
 * Cleanup the cache.
 *
 * @api private
 * @return {Memory} this
 */
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
