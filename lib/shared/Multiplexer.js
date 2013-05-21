/*!
 * Dependencies.
 */
 var Emitter,
    $ = require('./utils');

try {
    Emitter = require('emitter-component');
} catch(err) {
    Emitter = require('emitter');
}

/**
 * Multiplexer constructor.
 *
 * @param {Object} opts
 *   - `duration` amount of time in ms to wait until emiting "reset" event if
 *     messages are collected.
 * @api public
 */
function Multiplexer(opts) {
    var self = this;
    this._messages = [];
    this._timeoutId = setInterval(function() {
        self.reset(true);
    }, opts.duration);
}

Emitter(Multiplexer.prototype);
module.exports = Multiplexer;

/**
 * Add message(s).
 *
 * @param {Mixed} messages
 * @return {Multiplexer} this
 * @api public
 */
Multiplexer.prototype.add = function(messages) {
    if ($.isArray(messages)) {
        this._messages.push.apply(this._messages, messages);
    } else if (messages) {
        this._messages.push(messages);
    }

    return this;
};

/**
 * Reset multiplexer, emit "reset" if there are messages.
 *
 * @param {Boolean} [emit] only emit "reset" if true.
 * @return {Multiplexer} this
 * @api public
 */
Multiplexer.prototype.reset = function(emit) {
    if (this._messages.length) {
        if (emit) this.emit('reset');
        this._messages = [];
    }

    return this;
};

/**
 * Get messages.
 *
 * @return {Array}
 * @api public
 */
Multiplexer.prototype.get = function() {
    return this._messages;
};

/**
 * Stop multiplexer
 *
 * @return {Multiplexer} this
 * @api public
 */
Multiplexer.prototype.stop = function() {
    clearInterval(this._timeoutId);
    this.removeAllListeners();

    return this;
};
