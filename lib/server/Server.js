var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    MongoAdapter = require('./adapters/Mongo'),
    Connection = require('./Connection');

function Server(opts) {
    var self = this;

    this.options = opts || (opts = {});
    this._deliveryTimeout = opts.deliveryTimeout || 10000;

    this.adapter = opts.adapter || new MongoAdapter(opts.adapterOptions);
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

    if (!params.clientId) {
        err = new Error('No clientId.');
    }

    if (err) {
        // We don't need a Connection instance just for errors.
        connection = new EventEmitter();
        process.nextTick(function() {
            connection.emit('error', err);
        });
        return connection;
    }

    connection = this._connections[params.clientId];

    // We have already a connection to this client.
    // Close it and send collected messages.
    if (connection) {
        connection.respond('new connection');
    }

    connection = this._connections[params.clientId] = new Connection(params, this);

    this.delivered(params.delivered, function(err) {
        if (err) connection.emit('error', err);
    });

    return connection;
};

Server.prototype.disconnect = function(clientId) {
    delete this._connections[clientId];

    return this;
};

Server.prototype.destroy = function() {
    this.adapter.destroy();
    this.removeAllListeners();
    this._destroyed = true;

    return this;
};

Server.prototype.send = function(recipient, message, callback) {
    var self = this,
        err;

    if (!recipient) {
        err = new Error('Recipient required.');
    }

    if (typeof message.event != 'string') {
        err = new Error('Bad event.');
    }

    if (err) {
        process.nextTick(function() {
            callback(err);
        });
        return this;
    }

    message.recipients = recipient;

    // Reserve space because docs in capped collection can't grow by update.
    message.delivered = null;

    this.adapter.publish(message, function(err, doc) {
        var subscription,
            timeoutId;

        if (err) return callback(err);

        function off() {
            self.removeListener('delivered:' + doc._id, confirm);
            subscription.unsubscribe();
        }

        function confirm() {
            clearTimeout(timeoutId);
            off();
            callback(null, true);
        }

        subscription = self.adapter.subscribe({delivered: doc._id}, confirm);

        // For the case delivery confirmation lands on the same server where
        // the message was sent from.
        self.on('delivered:' + doc._id, confirm);

        timeoutId = setTimeout(function() {
            off();
            self.adapter.delivered(doc._id, false, false, function(err) {
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

// Mark messages as delivered.
Server.prototype.delivered = function(messageIds, callback) {
    var self = this,
        publish;

    if (!messageIds || !messageIds.length) {
        return this;
    }

    if (!Array.isArray(messageIds)) {
        messageIds = [messageIds];
    }

    messageIds.forEach(function(id, i) {
        var event = 'delivered:' + id;

        if (self.listeners(event).length) {
            self.emit(event);
        } else {
            publish = true;
        }
    });

    this.adapter.delivered(messageIds, true, publish, callback);

    return this;
};
