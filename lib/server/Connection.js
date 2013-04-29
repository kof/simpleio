var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    Multiplexer = require('../shared/Multiplexer');

function Connection(params, server) {
    var self = this,
        err,
        query;

    this._server = server;
    this._store = server.store;
    this._clientId = params.clientId;
    this._keepAlive = server.options.keepAlive || 10000;

    if (!params.recipient) {
        err = new Error('No recipient.');
    }

    if (err) {
        process.nextTick(function() {
            self._error(err);
        });
        return this;
    }

    this.multiplexer = new Multiplexer({duration: server.options.multiplexDuration})
        .on('error', this._error.bind(this))
        .on('reset', function() {
            self._subscription.unsubscribe();
            self.respond();
            self.multiplexer.stop();
        });

    query = {
        recipients: {$in: [params.recipient, null]},
        delivered: null
    };

    // Subscribe to new messages from now.
    this._subscription = this._store.subscribe(query, function(message) {
        self.multiplexer.add(message);
    });

    // Load messages user has probably missed during reconnect.
    this._store.get(query, function(err, messages) {
        if (err) return self._error(err);

        if (messages && messages.length) {
            self.multiplexer.add(messages);
        }
    });

    this._pollingTimeoutId = setTimeout(function() {
        self.respond('polling timeout');
    }, this._keepAlive);
}

util.inherits(Connection, EventEmitter);
module.exports = Connection;

Connection.prototype.respond = function(reason) {
    var self = this,
        messages = this.multiplexer.get(),
        ids;

    ids = messages.map(function(message) {
        return message._id;
    });

    // We mark them as delivered however its not sure at this moment in order
    // to not get them twice.
    // They will be marked as not delivered again if no delivery event accours.
    this._store.delivered(ids, true, false, function(err) {
        if (err) return self.emit('error', err);

        self.emit('response', {
            messages: messages,
            reason: reason || 'new messages'
        });
        self.close();
    });

    return this;
};

Connection.prototype.close = function() {
    if (this._closed) {
        return this;
    }
    this._closed = true;
    if (this._subscription) this._subscription.unsubscribe();
    if (this.multiplexer) this.multiplexer.stop();
    this._server.disconnect(this._clientId);
    clearTimeout(this._pollingTimeoutId);
    this.removeAllListeners();

    return this;
};

Connection.prototype._error = function(err) {
    this.close();
    this.emit('error', err);

    return this;
};
