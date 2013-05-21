var $ = require('../shared/utils');

/**
 * Message constructor.
 */
function Message(server) {
    this._server = server;
    this._recipients = [];
    this._data = {};
}

module.exports = Message;

/**
 * Define recipients.
 *
 * @param {Array|String|Number} recipients you can pass multiple recipients using
 *   an array or just as separate arguments
 * @return {Message} this
 * @api public
 */
Message.prototype.recipients = Message.prototype.recipient = function(recipients) {
    var args = $.isArray(recipients) ? recipients : arguments;
    this._recipients.push.apply(this._recipients, args);

    return this;
};

/**
 * Define an event name. If no event defined, the message can be subscribed
 * on the client using "message" event.
 *
 * @param {String} event
 * @return {Message} this
 * @api public
 */
Message.prototype.event = function(name) {
    this._data.event = name;

    return this;
};

/**
 * Define data.
 *
 * @param {Mixed} data
 */
Message.prototype.data = function(data) {
    this._data.data = data;

    return this;
};

/**
 * Send the message. Message is sent successful if every recipient has confirmed
 * the delivery. Callback is called with "true" as second parameter if succeeded.
 *
 * @param {Function} callback
 * @return {Message} this
 */
Message.prototype.send = function(callback) {
    this._data.confirmation = true;
    this._server.send(this._recipients, this._data, callback);

    return this;
};

/**
 * Broadcast a message. There is no delivery confirmation. Callback is called
 * after the message is stored.
 *
 * @param {Function} callback
 * @return {Message} this
 */
Message.prototype.broadcast = function(callback) {
    this._data.confirmation = false;
    this._server.send(this._recipients, this._data, callback);

    return this;
};
