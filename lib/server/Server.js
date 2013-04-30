var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    MemoryAdapter = require('./adapters/Memory'),
    Connection = require('./Connection');

function Server(opts) {
    var self = this;

    this.options = opts || (opts = {});
    this._deliveryTimeout = opts.deliveryTimeout || 10000;

    this.adapter = opts.adapter || new MemoryAdapter();
    this.adapter.on('error', function(err) {
        self.emit('error', err);
    });
    this._connections = {};
}

util.inherits(Server, EventEmitter);

module.exports = Server;

Server.prototype.connect = function(params) {
    var self = this,
        err,
        connection;

    if (this._destroyed) {
        err = new Error('Got connection after .destroy');
    }

    if (!params.client) {
        err = new Error('No client.');
    }

    if (err) {
        // We don't need a Connection instance just for errors.
        connection = new EventEmitter();
        process.nextTick(function() {
            connection.emit('error', err);
        });
        return connection;
    }

    connection = this._connections[params.client];

    // We have already a connection to this client.
    // Close it and send collected messages.
    if (connection) {
        connection.respond('new connection');
    }

    connection = this._connections[params.client] = new Connection(params, this);

    connection.delivered(params.delivered);

    return connection;
};

Server.prototype.disconnect = function(client) {
    if (client) {
        delete this._connections[client];
    } else {
        $.each(connections, function(connection) {
            connection.close();
        });
        this._connections = {};
    }

    return this;
};

Server.prototype.destroy = function() {
    this.disconnect();
    this.adapter.destroy();
    this.removeAllListeners();
    this._destroyed = true;

    return this;
};

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

    this.adapter.add(recipient, data, function(err, id) {
        var timeoutId,
            event = 'delivered:' + id;

        if (err) return callback(err);

        function confirm() {
            clearTimeout(timeoutId);
            self.adapter.unsubscribe(event, confirm);
            callback(null, true);
        }

        self.adapter.subscribe(event, confirm);

        timeoutId = setTimeout(function() {
            self.adapter.unsubscribe(event, confirm);
            self.adapter.delivered(id, false, false, function(err) {
                callback(err, false);
            });
        }, self._deliveryTimeout);
    });

    return this;
};

/**
 * Send a message to more than 1 recipient. No delivery confirmation.
 *
 */
Server.prototype.broadcast = function(recipients, message, callback) {

};
