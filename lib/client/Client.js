var Emitter = require('emitter'),
    sio = require('./index'),
    Multiplexer = require('../shared/Multiplexer'),
    $ = require('../shared/utils');

function Client(opts) {
    var self = this;

    this.options = opts = $.extend({}, Client.options, opts);
    this.ajax = opts.ajax;
    this._multiplexer = new Multiplexer({duration: opts.multiplexDuration})
        .on('error', function(err) {
            self.emit('error', err);
        })
        .on('reset', function() {
            self._open(true);
        });

    this._connections = 0;
    this._delivered = [];
    this._reconnectionAttempts = 1;
}

Client.options = {
    url: '/simpleio',
    ajax: null,
    reconnectionDelay: 1000,
    maxReconnectionDelay: 10000,
    multiplexDuration: null
};

Emitter(Client.prototype);
module.exports = Client;

Client.prototype.connect = function(data) {
    if (!this._polling) {
        this._polling = true;
        this._open(true, data);
    }

    return this;
};

Client.prototype.disconnect = function() {
    this._polling = false;
    if (this._xhr) {
        this._xhr.abort();
    }

    return this;
};

Client.prototype.send = function(message, callback) {
    this._multiplexer.add(message);
    if (callback) this.once('success', callback);

    return this;
};

Client.prototype._open = function(immediately, data) {
    var self = this;

    data || (data = {});

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
        success: function(res) {
            self._onSuccess(res);
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

Client.prototype._onError = function(data) {
    this._connections--;

    // Roll back "messages" and "delivered" to pick up them again by
    // next try to connect.
    if (data.delivered) {
        this._delivered.push.apply(this._delivered, data.delivered);
    }
    if (data.messages) {
        this._multiplexer.add(data.messages);
    }

    this._reopen();
};

Client.prototype._onSuccess = function(res) {
    var self = this;

    this.emit('success');

    this._connections--;
    this._reconnectionAttempts = 1;

    if (res.messages.length) {
        $.each(res.messages, function(message) {
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
