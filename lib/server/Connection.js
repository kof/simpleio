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
            self._off();
            self.respond();
        });

    function add(message) {
        self._multiplexer.add(message);
    }

    // Subscribe to new messages from now.
    this.adapter.on('dispatch:' + params.recipient, add);

    this._off = function() {
        self.adapter.removeListener('dispatch:' + params.recipient, add);
    };

    // Load messages user has probably missed during reconnect.
    this.adapter.get(params.recipient, function(err, messages) {
        if (err) return self._error(err);
        if (messages && params.delivered) {
            messageages = messages.filter(function(message) {
                return params.delivered.indexOf(message.id) < 0;
            });
        }

        self._multiplexer.add(messages);
    });

    this._pollingTimeoutId = setTimeout(function() {
        self.respond('polling timeout');
    }, this._keepAlive);
}

util.inherits(Connection, EventEmitter);
module.exports = Connection;

Connection.prototype.respond = function(status) {
    this.emit('response', {
        messages: this._multiplexer.get(),
        status: status || 'new messages'
    });
    this.close();

    return this;
};

Connection.prototype.close = function() {
    if (this._closed) {
        return this;
    }
    this._closed = true;
    if (this._off) this._off();
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
        self.adapter.delivery(id, true, true, done);
    });

    return this;
};

Connection.prototype._error = function(err) {
    this.emit('error', err);
    this.close();

    return this;
};
