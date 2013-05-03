var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    $ = require('../shared/utils'),
    MemoryAdapter = require('./adapters/Memory'),
    Connection = require('./Connection');

function Server(opts) {
    var self = this;

    opts = this.options = $.extend({}, Server.options, opts);
    this.adapter = opts.adapter || new MemoryAdapter();
    this.adapter.on('error', function(err) {
        self.emit('error', err);
    });
    this._connections = {};
}

Server.options = {
    deliveryTimeout: 15000,
    keepAlive: 60000
};

util.inherits(Server, EventEmitter);

module.exports = Server;

Server.prototype.open = function(params) {
    var self = this,
        connection;

    if (this._destroyed) {
        throw new Error('Got connection after .destroy');
    }

    // We have already a connection to this client.
    // Close it and send collected messages.
    connection = this._connections[params.client];
    if (connection) {
        connection.close('new connection');
    }

    connection = this._connections[params.client] = new Connection(params, this);
    connection.open();

    return connection;
};

Server.prototype.close = function(client) {
    if (client) {
        delete this._connections[client];
    } else {
        $.each(this._connections, function(connection) {
            connection.close();
        });
        this._connections = {};
    }

    return this;
};

Server.prototype.destroy = function() {
    this.close();
    this.adapter.destroy();
    this.removeAllListeners();
    this._destroyed = true;

    return this;
};

/**
 * Send a message to the recipient. If at least one client receives the
 * message and sends delivery confirmation, delivered parameter will is true.
 */
Server.prototype.send = function(recipient, data, callback) {
    var self = this,
        err;

    if (!recipient) {
        err = new Error('Recipient required.');
    }

    if (err) {
        process.nextTick(function() {
            callback(err);
        });
        return this;
    }

    this.adapter.dispatch(recipient, data, function(err, messageId) {
        var timeoutId,
            event;

        if (err) return callback(err);

        event = 'delivered:' + messageId;

        function delivered() {
            clearTimeout(timeoutId);
            self.adapter.removeListener(event, delivered);
            callback(null, true);
        }

        self.adapter.on(event, delivered);

        timeoutId = setTimeout(function() {
            self.adapter.removeListener(event, delivered);
            self.adapter.delivery({
                messageId: messageId,
                deliverable: false,
                publish: false
            }, callback);
        }, self.options.deliveryTimeout);
    });

    return this;
};

/**
 * Send a message to more than 1 recipient. No delivery confirmation.
 *
 */
Server.prototype.broadcast = function(recipients, message, callback) {

};
