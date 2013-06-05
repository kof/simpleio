var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    Multiplexer = require('../shared/Multiplexer');

/**
 * Incomming connection.
 *
 * @param {Object} params
 * @param {Server} server
 * @param {Adapter} adapter
 * @api private
 */
function Connection(params, server, adapter) {
    this._server = server;
    this._adapter = adapter;
    this._client = Number(params.client);
    this._user = params.user;
    this._delivered = params.delivered;
    this._keepAlive = server.options.keepAlive;
    this._deliveryTimeout = server.options.deliveryTimeout;
}

util.inherits(Connection, EventEmitter);
module.exports = Connection;

/**
 * Open a connection.
 *
 * @return {Connection} this
 * @api private
 */
Connection.prototype.open = function() {
    var self = this,
        since = new Date(Date.now() - this._deliveryTimeout);

    this._multiplexer = new Multiplexer({duration: this._server.options.multiplexDuration})
        .on('error', this._error.bind(this))
        .on('reset', function() {
            self._multiplexer.stop();
            self._off();
            self.close();
        });

    function add(message) {
        self._multiplexer.add({
            id: message.id,
            date: message.date,
            data: message.data
        });
    }

    // Subscribe to new messages from now.
    this._adapter.on('dispatch:' + this._user, add);

    this._off = function() {
        self._adapter.removeListener('dispatch:' + self._user, add);
    };

    // Load messages user has probably missed during reconnect.
    this._adapter.get(this._user, since, function(err, messages) {
        if (err) return self._error(err);

        if (messages && messages.length) {
            messages = messages.filter(function(message) {

                // Filter messages, which are in delivered array already.
                // It happens when delivery confirmation arrives, but the messages which
                // has been already delivered are still not marked as delivered in adapter.
                if (self._delivered &&
                    self._delivered.length &&
                    self._delivered.indexOf(message.id) >= 0) {
                    return false;
                }

                // Filter messages which has been already saved as delivered for this
                // client previously
                if (message.delivered.indexOf(self._client) >= 0) {
                    return false;
                }

                return true;
            });

            // Avoid sending unneeded information to the client.
            messages = messages.map(function(message) {
                return {
                    id: message.id,
                    date: message.date,
                    data: message.data
                };
            });
        }

        self._multiplexer.add(messages);
    });

    this._saveDelivered();

    this._adapter.open(this._user, this._error.bind(this));

    this._pollingTimeoutId = setTimeout(function() {
        self.close('polling timeout');
    }, this._keepAlive);
};

/**
 * Close a connection.
 *
 * @param {String} [status] message
 * @return {Connection} this
 * @api private
 */
Connection.prototype.close = function(status) {
    if (this._closed) {
        return this;
    }
    this.emit('close', {
        messages: this._multiplexer.get(),
        status: status || 'new messages'
    });
    this._closed = true;
    clearTimeout(this._pollingTimeoutId);
    if (this._off) this._off();
    if (this._multiplexer) this._multiplexer.stop();
    this._server.close(this._client);
    this.removeAllListeners();

    return this;
};

/**
 * Mark messages as delivered.
 *
 * @return {Connection} this
 * @api private
 */
Connection.prototype._saveDelivered = function() {
    var self = this,
        ids = this._delivered;

    if (!ids || !ids.length) {
        return this;
    }

    if (!Array.isArray(ids)) {
        ids = [ids];
    }

    function done(err) {
        if (err) self.emit('error', err);
    }

    ids.forEach(function(id) {
        self._adapter.delivery({
            publish: true,
            delivered: true,
            messageId: id,
            client: self._client
        }, done);
    });

    return this;
};

/**
 * Emit "error" event and close connection if error passed.
 *
 * @param {Error} [err]
 * @return {Connection} this
 * @api private
 */
Connection.prototype._error = function(err) {
    if (!err) return this;
    this.emit('error', err);
    this.close();

    return this;
};
