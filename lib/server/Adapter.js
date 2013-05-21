var util = require('util'),
    EventEmitter = require('events').EventEmitter;

/**
 * Adapter interface.
 */
function Adapter() {}

module.exports = Adapter;
util.inherits(Adapter, EventEmitter);

['dispatch', 'open', 'connected', 'get', 'delivery', 'destroy'].forEach(function(name) {
    Adapter.prototype[name] = function() {
        throw new Error('Not implemented method "' + name + '"');
    };
});

