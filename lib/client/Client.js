var Emitter = require('emitter'),
    sio = require('./index');

function Client(opts) {
    this.id = opts.id || this._getId();
    this.url = opts.url || '/simpleio';

    // Interval for sending a new request.
    this.pollInterval = opts.pollInterval || 30000;

    // Time to keep a request alive. It can be closed by server at any time.
    this.duration = this.pollInterval - 5000;

    // Messages to send.
    this.messages = [];
}

Emitter(Client.prototype);

module.exports = Client;

Client.prototype.connect = function() {
    var self = this;

    this.request();
    clearInterval(this._connectIntervalId);
    this._connectIntervalId = setInterval(function() {
        self.request();
    }, this.pollInterval);

    return this;
};

Client.prototype.disconnect = function() {
    clearInterval(this._connectIntervalId);

    return this;
};

Client.prototype.send = function(data, callback) {

};

Client.prototype.request = function() {
    var self = this,
        messages = this.messages.slice();

    this.messages = [];

    sio.request({
        url: this.url,
        type: messages.length ? 'post' : 'get',
        data: {
            clientId: this.id,
            messages: messages
        },
        success: function(res) {
            console.log('success', arguments);
            self.emit('message')
            self.request();
        },
        error: function() {
            console.log('error', arguments);
        }
    });

    return this;
};

Client.prototype._getId = function() {
    return Math.round(Math.random() * 1000000));
};
