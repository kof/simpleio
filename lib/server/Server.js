var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    MongoStore = require('./MongoStore'),
    Connection = require('./Connection');

function Server(opts) {
    var self = this;

    this.options = opts || (opts = {});
    this._deliveryTimeout = opts.deliveryTimeout || 10000;

    this.store = opts.store || new MongoStore(opts.storeOptions);
    this.store.on('error', function(err) {
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
        err = new Error('Missing clientId.');
    }

    if (err) {
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
    this.store.destroy();
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

    this.store.publish(message, function(err, doc) {
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

        subscription = self.store.subscribe({delivered: doc._id}, confirm);

        // For the case delivery confirmation lands on the same server where
        // the message was sent from.
        self.once('delivered:' + doc._id, confirm);

        timeoutId = setTimeout(function() {
            off();
            self.store.delivered(doc._id, false, false, function(err) {
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

    this.store.delivered(messageIds, true, publish, callback);

    return this;
};
