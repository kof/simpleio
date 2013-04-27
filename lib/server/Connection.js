var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    Multiplexer = require('./Multiplexer');

function Connection(params, sio) {
    var self = this,
        multiplexer,
        subscription,
        err,
        query,
        store = sio.store;

    if (!params.recipient) {
        err = new Error('No recipient');
    }

    if (err) {
        process.nextTick(function() {
            self.emit('error', err);
        });
        return this;
    }

    multiplexer = new Multiplexer({delay: sio.options.multiplexDelay})
        .on('error', function(err) {
            subscription.unsubscribe();
            self.emit('error', err);
        })
        .on('messages', function(messages) {
            subscription.unsubscribe();
            self.emit('messages', messages);
        });

    query = {
        recipients: {$in: [params.recipient, null]},
        event: {$in: params.events},
        read: false
    };

    // Subscribe to new messages from now.
    subscription = store.subscribe(query, function(message) {
        multiplexer.add(message);
    });

    // Load messages user has probably missed during reconnect.
    store.get(query, function(err, messages) {
        if (err) return multiplexer.complete(err);

        multiplexer.add(messages);
    });

    // There are some messages to publish.
    if (params.messages && params.messages.length) {
        params.messages.forEach(function(message) {
            if (!message.recipient) {
                return self.emit('error', new Error('No recipient'));
            }

            store.publish(message, function(err, doc) {
                if (err) self.emit('error', err);
            });
        });
    }
}

util.inherits(Connection, EventEmitter);

module.exports = Connection;
