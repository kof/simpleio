var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    Multiplexer = require('../shared/Multiplexer');

function Connection(params, server) {
    var self = this,
        err;

    this.server = server;
    this.adapter = server.adapter;
    this._client = params.client;
    this._keepAlive = server.options.keepAlive || 60000;

    if (!params.recipient) {
        err = new Error('No recipient.');
    }

    if (err) {
        process.nextTick(function() {
            self._error(err);
        });
        return this;
    }

    this._multiplexer = new Multiplexer({duration: server.options.multiplexDuration})
        .on('error', this._error.bind(this))
        .on('reset', function() {
            self._multiplexer.stop();
            self.respond();
            self._unsubscribe();
        });

    function add(message) {
        self._multiplexer.add(message);
    }

    // Subscribe to new messages from now.
    this.adapter.subscribe('add:' + params.recipient, add);

    this._unsubscribe = function() {
        self.adapter.unsubscribe('add:' + params.recipient, add);
    };

    // Load messages user has probably missed during reconnect.
    this.adapter.get(params.recipient, function(err, messages) {
        if (err) return self._error(err);

        self._multiplexer.add(messages);
    });

    this._pollingTimeoutId = setTimeout(function() {
        self.respond('polling timeout');
    }, this._keepAlive);
}

util.inherits(Connection, EventEmitter);
module.exports = Connection;

Connection.prototype.respond = function(status) {
    var self = this,
        messages = this._multiplexer.get(),
        todo = messages.length;

    function done(err) {
        if (err) {
            return self.emit('error', err);
        }

        todo--;

        if (!todo) {
            self.emit('response', {
                messages: messages,
                status: status || 'new messages'
            });
            self.close();
        }
    }

    // We mark them as delivered however its not sure at this moment in order
    // to not get them twice.
    // They will be marked as not delivered again if no delivery event happens.
    messages.forEach(function(message) {
        self.adapter.delivered(message.id, true, false, done);
    });

    return this;
};

Connection.prototype.close = function() {
    if (this._closed) {
        return this;
    }
    this._closed = true;
    if (this._unsubscribe) this._unsubscribe();
    if (this._multiplexer) this._multiplexer.stop();
    this.server.disconnect(this._client);
    clearTimeout(this._pollingTimeoutId);
    this.removeAllListeners();

    return this;
};

// Mark messages as delivered.
Connection.prototype.delivered = function(ids) {
    var self = this;

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
        var publish = self.adapter.listeners('delivered:' + id).length > 0;
        self.adapter.delivered(id, true, publish, done);
    });

    return this;
};

Connection.prototype._error = function(err) {
    this.emit('error', err);
    this.close();

    return this;
};
