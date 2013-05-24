var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    $ = require('../shared/utils'),
    MemoryAdapter = require('./adapters/Memory'),
    Connection = require('./Connection'),
    Message = require('./Message');

var noop = function() {};


/**
 * Server constructor.
 *
 * @param {Object} [options]
 * @api public
 */
function Server(options) {
    this.options = $.extend({}, Server.options, options);
    this._connections = {};
    this._adapter = this.options.adapter || new MemoryAdapter();
    this._adapter
        .on('open', this._onOpen.bind(this))
        .on('error', this._error.bind(this));
}

/**
 * Default options, will be overwritten by options passed to the Server.
 *
 *  - `deliveryTimeout` Message is not delivered if confirmation was not received during this time
 *  - `keepAlive` amount of ms to keep connection open. (Heroku requires this value to be less than 30s.)
 *  - `disconnectedAfter` amount of ms after which client counts as disconnected
 *  - `multiplexDuration` amount of ms messages will be collected before send
 *
 * @type {Object}
 * @api public
 */
Server.options = {
    deliveryTimeout: 40000,
    keepAlive: 25000,
    disconnectedAfter: 40000,
    multiplexDuration: 500
};

util.inherits(Server, EventEmitter);
module.exports = Server;

/**
 * Client has opened a connection.
 *
 * Params object:
 *
 *  - `user` user id
 *  - `client` client id of the user (one user can have multiple clients)
 *  - `delivered` optional delivered messages ids array
 *
 * @param {Object} params
 * @return {Connection}
 * @api public
 */
Server.prototype.open = function(params) {
    var err,
        connection;

    if (this._destroyed) {
        err = new Error('Got connection after .destroy');
    }

    if (!params.user) {
        err = new Error('No user.');
    }

    if (!params.client) {
        err = new Error('No client.');
    }

    if (err) {
        process.nextTick(this._error.bind(this, err));
        return this;
    }


    // We have already a connection to this client.
    // Close it and send collected messages.
    connection = this._connections[params.client];
    if (connection) {
        connection.close('new connection');
    }

    connection = new Connection(params, this, this._adapter);
    this._connections[params.client] = connection;
    connection.open();

    return connection;
};

/**
 * Close connection to one/all clients.
 *
 * @param {String|Number} client id
 * @return {Server} this
 * @api public
 */
Server.prototype.close = function(client) {
    if (client) {
        if (this._connections[client]) {
            this._connections[client].close();
            delete this._connections[client];
        }
    } else {
        $.each(this._connections, function(connection) {
            connection.close();
        });
        this._connections = {};
    }

    return this;
};

/**
 * Destroy the server.
 *
 * @return {Server} this
 * @api public
 */
Server.prototype.destroy = function() {
    this.close();
    this.removeAllListeners();
    this._adapter.destroy();
    this._destroyed = true;

    return this;
};

/**
 * Create a message.
 *
 * @return {Message}
 * @api public
 */
Server.prototype.message = function() {
    return new Message(this);
};

/**
 * Get connected users.
 *
 * @param {Function} callback
 * @return {Server} this
 */
Server.prototype.connected = function(callback) {
    this._adapter.connected(
        new Date(Date.now() - this.options.disconnectedAfter),
        callback
    );

    return this;
};

/**
 * Send a message to recipient(s). If all recipients receive and confirm the
 * message, second callback parameter will be true.
 *
 * Recommended to use a Server#message which is a higher level to send a message.
 *
 * @param {String|Number|Array} recipients one or multiple recipients
 * @param {Object} data to send
 * @param {Function} [callback]
 * @return {Server} this
 * @api public
 */
Server.prototype.send = function(recipients, data, callback) {
    var self = this,
        err,
        todo,
        calledback;

    if (!recipients || !recipients.length) {
        err = new Error('Recipients required.');
    }

    if (!data) {
        err = new Error('Data required.');
    }

    callback || (callback = noop);

    if (err) {
        process.nextTick(function() {
            callback(err);
        });
        return this;
    }

    if (!$.isArray(recipients)) {
        recipients = [recipients];
    }

    todo = recipients.length;

    // If at least one message is not delivered, we call back and
    // ignore any further calls.
    function done(err, delivered) {
        if (calledback) return;

        if (err || !delivered) {
            calledback = true;
            return callback(err, false);
        }

        todo--;

        if (!todo) {
            calledback = true;
            callback(null, true);
        }
    }

    recipients.forEach(function(recipient) {
        self._sendOne(recipient, data, done);
    });

    return this;
};

/**
 * Send a message one recipient. If at least one client receive and confirm the
 * message, second callback parameter will be true.
 *
 * @param {String|Number} recipient id
 * @param {Object} data to send
 * @param {Function} callback
 * @return {Server} this
 * @api private
 */
Server.prototype._sendOne = function(recipient, data, callback) {
    var self = this;

    this._adapter.dispatch(recipient, data, function(err, messageId) {
        var timeoutId,
            event;

        if (err) return callback(err);

        // Assume we have delivered, because we don't need to wait for confirmation.
        if (!data.confirmation) return callback(null, true);

        event = 'delivered:' + messageId;

        function delivered() {
            clearTimeout(timeoutId);
            self._adapter.removeListener(event, delivered);
            callback(null, true);
        }

        self._adapter.on(event, delivered);

        timeoutId = setTimeout(function() {
            self._adapter.removeListener(event, delivered);
            self._adapter.delivery({
                messageId: messageId,
                deliverable: false,
                publish: false
            }, callback);
        }, self.options.deliveryTimeout);
    });

    return this;
};

/**
 * Emit "error" event if passed error.
 *
 * @param {Error} [err]
 * @return {Server} this
 * @api private
 */
Server.prototype._error = function(err) {
    if (err) {
        this.emit('error', err);
    }

    return this;
};

/**
 * Emit "open" event.
 *
 * @param {Object} message
 * @api private
 */
Server.prototype._onOpen = function(message) {
    this.emit('open', message.sender);
};
