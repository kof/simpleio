var Emitter,
    $ = require('./utils');

try {
    Emitter = require('emitter-component');
} catch(err) {
    Emitter = require('emitter');
}

function Multiplexer(opts) {
    var self = this;
    this._messages = [];
    this._timeoutId = setInterval(function() {
        self.reset(true);
    }, opts.duration);
}

Emitter(Multiplexer.prototype);
module.exports = Multiplexer;

Multiplexer.prototype.add = function(messages) {
    if ($.isArray(messages)) {
        this._messages.push.apply(this._messages, messages);
    } else if (messages) {
        this._messages.push(messages);
    }

    return this;
};

Multiplexer.prototype.reset = function(emit) {
    if (this._messages.length) {
        if (emit) this.emit('reset');
        this._messages = [];
    }

    return this;
};

Multiplexer.prototype.get = function() {
    return this._messages;
};

Multiplexer.prototype.stop = function() {
    clearInterval(this._timeoutId);
    this.removeAllListeners();

    return this;
};
