var Emitter,
    $ = require('./utils');

try {
    Emitter = require('emitter-component');
} catch(err) {
    Emitter = require('emitter');
}

function Multiplexer(opts) {
    var self = this,
        // Amount of ms for multiplexing messages before emitting.
        duration = opts.duration || 1000;

    this._messages = [];
    this._stopped = false;
    this._timeoutId = setInterval(function() {
        if (self._messages.length) {
            self.reset();
        }
    }, duration);
}

Emitter(Multiplexer.prototype);
module.exports = Multiplexer;

Multiplexer.prototype.add = function(messages) {
    if (this._stopped) {
        this.emit('error', new Error('Cannot add a message after .close'));
        return this;
    }

    if ($.isArray(messages)) {
        this._messages.push.apply(this._messages, messages);
    } else {
        this._messages.push(messages);
    }

    return this;
};

Multiplexer.prototype.reset = function() {
    this.emit('reset');
    this._messages = [];
};

Multiplexer.prototype.get = function() {
    return this._messages;
};

Multiplexer.prototype.stop = function() {
    clearInterval(this._timeoutId);
    this._stopped = true;
    this.removeAllListeners();

    return this;
};
