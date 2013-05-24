var Emitter = require('emitter'),
    sio = require('./index'),
    Multiplexer = require('../shared/Multiplexer'),
    $ = require('../shared/utils');

/**
 * Client constructor.
 *
 * @param {Object} options
 * @api public
 */
function Client(options) {
    var self = this;

    this.options = $.extend({}, Client.options, options);
    this.ajax = this.options.ajax;
    this._multiplexer = new Multiplexer({duration: this.options.multiplexDuration})
        .on('reset', function() {
            self._open(true);
        });

    this._connections = 0;
    this._delivered = [];
    this._reconnectionAttempts = 1;
    this._id = $.uid();
}

/**
 * Default options, will be overwritten by options passed to the constructor.
 *
 *   - `ajax` required jQuery ajax api
 *   - `url` connection url, default is '/simpleio'
 *   - `reconnectionDelay` ms amount to wait before to reconnect in case of error,
 *      will be increased on every further error until maxReconnectionDelay
 *   - `maxReconnectionDelay` max ms amount to wait before to reconnect in case of error
 *   - `multiplexDuration` ms amount for multiplexing messages before emitting
 *
 * @type {Object}
 * @api public
 */
Client.options = {
    url: '/simpleio',
    ajax: null,
    reconnectionDelay: 1000,
    maxReconnectionDelay: 10000,
    multiplexDuration: 500
};

Emitter(Client.prototype);
module.exports = Client;

/**
 * Start polling.
 *
 * @param {Object} [data] data to send with the first request.
 * @return {Client} this
 * @api public
 */
Client.prototype.connect = function(data) {
    if (!this._polling) {
        this._polling = true;
        this._open(true, data);
    }

    return this;
};

/**
 * Stop polling.
 *
 * @return {Client} this
 * @api public
 */
Client.prototype.disconnect = function() {
    this._polling = false;
    if (this._xhr) {
        this._xhr.abort();
    }

    return this;
};

/**
 * Send message to the server.
 *
 * @param {Mixed} message message to send.
 * @param {Function} [callback] is called when message was send to the server without error.
 * @return {Client} this
 * @api public
 */
Client.prototype.send = function(message, callback) {
    this._multiplexer.add(message);
    if (callback) this.once('success', callback);

    return this;
};

/**
 * Open connection.
 *
 * @param {Boolean} [immediately] create request immediately.
 * @param {Object} [data] additional data to be send.
 * @return {Client} this
 * @api private
 */
Client.prototype._open = function(immediately, data) {
    var self = this;

    data || (data = {});
    data.client = this._id;

    if (!this._polling) {
        return this;
    }

    // There is already open connection which will be closed at some point
    // and then multiplexed messages will be sent if immediately is not true.
    if (!immediately && this._connections > 0) {
        return this;
    }

    if (this._multiplexer.get().length) {
        data.messages = this._multiplexer.get();
        this._multiplexer.reset();
    }

    if (this._delivered.length) {
        data.delivered = this._delivered;
        this._delivered = [];
    }

    this._connections++;

    this._xhr = this.ajax({
        url: this.options.url,
        type: data.messages || data.delivered ? 'post' : 'get',
        data: data,
        cache: false,
        dataType: 'json',
        async: true,

        // Server will close request if needed, ensure here
        // not using settings from global setup.
        timeout: 1000 * 60 * 2,
        success: function(data) {
            self._onSuccess(data);
        },
        error: function() {
            self._onError(data);
        }
    });

    return this;
};

/**
 * Reconnect with incrementally delay.
 *
 * @return {Client} this
 * @api private
 */
Client.prototype._reopen = function() {
    var self = this,
        delay;

    this._reconnectionAttempts++;
    delay = this._reconnectionAttempts * this.options.reconnectionDelay;
    delay = Math.min(delay, this.options.maxReconnectionDelay);

    setTimeout(function() {
        self._open();
    }, delay);

    return this;
};

/**
 * Handle xhr error. Roll back "messages" and "delivered" to send them again by
 * next reconnect.
 *
 * @param {Object} data data which was not delivered.
 * @return {Client} this
 * @api private
 */
Client.prototype._onError = function(data) {
    this._connections--;

    if (data.delivered) {
        this._delivered.push.apply(this._delivered, data.delivered);
    }
    if (data.messages) {
        this._multiplexer.add(data.messages);
    }

    this._reopen();
};

/**
 * Handle xhr success. Emit events, send delivery confirmation.
 *
 * @param {Object} data data which was not delivered.
 * @return {Client} this
 * @api private
 */
Client.prototype._onSuccess = function(data) {
    var self = this;

    this.emit('success');
    this._connections--;
    this._reconnectionAttempts = 1;

    if (data.messages.length) {
        $.each(data.messages, function(message) {
            if (message.data.confirmation) self._delivered.push(message.id);
            if (message.data.event) {
                self.emit(message.data.event, message.data.data);
            }
            self.emit('message', message);
        });
    }

    // Send delivery confirmation immediately.
    this._open(Boolean(this._delivered.length));
};
