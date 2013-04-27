var EventEmitter = require('events').EventEmitter;

function Multiplexer(opts) {
    var self = this,
        // Amount of ms to wait to multiplex messages.
        delay = opts.delay || 1000;

    this._messages = [];
    this._closed = false;
    this._timeoutId = setTimeout(function() {
        self.close();
    }, delay);
}

util.inherits(Multiplexer, EventEmitter);
module.exports = Multiplexer;

Multiplexer.prototype.add = function(messages) {
    if (this._closed) {
        this.emit('error', new Error('Cannot add a message after .close'));
        return this;
    }

    if (Array.isArray(messages)) {
        this._messages.push.apply(this._messages, messages);
    } else {
        this._messages.push(message);
    }

    return this;
};

Multiplexer.prototype.close = function(err) {
    clearTimeout(this._timeoutId);
    if (err) this.emit('error', err);
    this.emit('messages', this._messages);
    this._closed = true;

    return this;
};
