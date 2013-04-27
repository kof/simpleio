var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    MongoStore = require('./MongoStore'),
    Connection = require('./Connection');

function Simpleio(opts) {
    var self;

    this.options = opts || (opts = {});
    this.store = opts.store || new MongoStore(opts.storeOptions);
    this.store.on('error', function(err) {
        self.emit('error', err);
    });
}

util.inherits(Simpleio, EventEmitter);

module.exports = Simpleio;

Simpleio.prototype.connect = function(params) {
    if (this._closed) {
        this.emit(new Error('Got connection after .close'));
        return this;
    }

    return new Connection(params, this);
};

Simpleio.prototype.close = function() {
    this.store.destroy();
    this._closed = true;
    this.removeAllListeners();

    return this;
};

Simpleio.prototype.send = function(message, callback) {
    var self = this;

    if (typeof message.event != 'string') {
        process.nextTick(function() {
            callback(new Error('Bad event name.'));
        });
        return this;
    }

    this.store.publish(message, function(err, doc) {
        if (err) return callback(err);

        if (message.delivered) {
            callback(null, true);
        } else {
            self.store.subscribeOnce({delivered: doc._id}, function(message) {
                callback(null, true);
            });
        }
    });


    return this;
};

// Mark message as read.
Simpleio.prototype.read = function(messages) {
    var self = this;

    if (!Array.isArray(messages)) {
        messages = [messages];
    }

    messages.forEach(function(message) {
        self.store.set({_id: message._id}, {read: true}, function(err) {
            err.message = message;
            if (err) self.emit('error', err);
        });
    });

    return this;
};
