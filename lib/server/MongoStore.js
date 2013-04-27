var mubsub = require('mubsub'),
    EventEmitter = require('events').EventEmitter,
    util = require('util');

function MongoStore(opts) {
    var self = this;

    opts || (opts = {});
    opts.channel || (opts.channel = {});

    this.stringify = opts.stringify || JSON.stringify;
    this.parse = opts.parse || JSON.parse;
    this.client = mubsub(opts.uri || 'mongodb://localhost:27017/simpleio', opts.db, opts.replicaset);
    this.channel = this.client.channel(opts.channel.name || 'simpleio', opts.channel)
        .on('error', function(err) {
            self.emit('error', err);
        });
}

util.inherits(MongoStore, EventEmitter);

module.exports = MongoStore;

MongoStore.prototype.publish = function(message, callback) {
    var self = this;

    if (message.data) {
        message.data = this.stringify(message.data);
    }

    this._channel.publish(message, callback);

    return this;
};

MongoStore.prototype.subscribe = function(query, callback) {
    var self = this;

    return self._channel.subscribe(query, function(message) {
        callback(self.parse(message));
    });
};

MongoStore.prototype.subscribeOnce = function(query, callback) {
    var subscription;

    subscription = this.subscribe(query, function(message) {
        subscription.unsubscribe();
        callback(message);
    });

    return this;
};

Client.prototype.get = function(query, callback) {
    this.channel.collection.then(function(err, collection) {
        if (err) return callback(err);

        collection.findOne(query, callback);
    });

    return this;
};

MongoStore.prototype.set = function(query, value, callback) {
    this.channel.collection.then(function(err, collection) {
        if (err) return callback(err);

        collection.update(
            query,
            {$set: value},
            {upsert: true},
            callback
        );
    });

    return this;
};

MongoStore.prototype.close = function() {
    this.client.close();
    this.removeAllListeners();

    return this;
};
