var Emitter = require('emitter'),
    sio = require('./index'),
    Multiplexer = require('../shared/Multiplexer'),
    $ = require('../shared/utils');

function Client(opts) {
    var self = this;

    opts || (opts = {});
    this.id = opts.id || $.id();
    this.url = opts.url || '/simpleio';
    this.ajax = opts.ajax;

    this._multiplexer = new Multiplexer({duration: opts.multiplexDuration})
        .on('error', function(err) {
            self.emit('error', err);
        })
        .on('reset', function() {
            self.request(true);
        });

    this._connections = 0;
    this._delivered = [];
}

Emitter(Client.prototype);

module.exports = Client;

Client.prototype.connect = function(data) {
    this._polling = true;
    this._baseData = data || {};
    this._baseData.client = this.id;

    this.request(true);

    return this;
};

Client.prototype.disconnect = function() {
    this._polling = false;
    if (this._xhr) {
        this._xhr.abort();
    }

    return this;
};

Client.prototype.send = function(recipient, message, callback) {
    message.recipients = recipient;
    this._multiplexer.add(message);

    return this;
};

Client.prototype.broadcast = function(recipients, message, callback) {
    message.recipients = recipients;
    this._multiplexer.add(message);

    return this;
};

Client.prototype.request = function(force) {
    var self = this,
        data = $.extend({}, this._baseData),
        messages;

    if (!this._polling) {
        return this;
    }

    if (!force && this._connections > 0) {
        return this;
    }

    messages = this._multiplexer.get();
    if (messages.length) {
        data.messages = messages;
        this._multiplexer.reset();
    }

    if (this._delivered.length) {
        data.delivered = this._delivered;
        this._delivered = [];
    }

    this._connections++;

    this._xhr = this.ajax({
        url: this.url,
        type: data.messages || data.delivered ? 'post' : 'get',
        data: data,
        cache: false,
        dataType: 'json',
        success: function(res) {
            self._connections--;

            if (res.messages.length) {
                $.each(res.messages, function(message) {
                    if (message.data.confirmation) self._delivered.push(message.id);
                    if (message.data.event) {
                        self.emit(message.data.event, message.data.data);
                    }
                    self.emit('message', message);
                });
            }
            self.request(self._delivered.length);
        },
        error: function() {
            self._connections--;

            // Roll back "messages" and "delivered" to pick up them again by
            // next try to connect.
            if (data.delivered) {
                self._delivered.push.apply(self._delivered, data.delivered);
            }
            if (data.messages) {
                self._multiplexer.add(data.messages);
            }

            // TODO increase exponentially, start small
            setTimeout(function() {
                self.request();
            }, 10000);
        }
    });

    return this;
};
