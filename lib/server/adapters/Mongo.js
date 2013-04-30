var mubsub = require('mubsub'),
    EventEmitter = require('events').EventEmitter,
    util = require('util');

function Mongo(opts) {
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

util.inherits(Mongo, EventEmitter);

module.exports = Mongo;

Mongo.prototype.publish = function(message, callback) {
    var self = this;

    if (message.data) {
        try {
            message.data = this.stringify(message.data);
        } catch(err) {
            return callback(err);
        }
    }

    this.channel.publish(message, function(err, docs) {
        callback(err, docs[0]);
    });

    return this;
};

Mongo.prototype.subscribe = function(query, callback) {
    var self = this;

    return self.channel.subscribe(query, function(message) {
        message.data = self.parse(message.data);
        callback(message);
    });
};

Mongo.prototype.get = function(query, callback) {
    this.channel.collection.then(function(err, collection) {
        if (err) return callback(err);

        collection.find(query).toArray(callback);
    });

    return this;
};

Mongo.prototype.set = function(query, value, callback) {
    this.channel.collection.then(function(err, collection) {
        if (err) return callback(err);

        collection.update(
            query,
            {$set: value},
            {upsert: true, multi: true},
            callback
        );
    });

    return this;
};

Mongo.prototype.toObjectId = function(ids) {
    var ObjectId = this.client.db.ObjectID;

    function convert(id) {
        return typeof id == 'string' ? ObjectId(id) : id;
    }

    if (Array.isArray(ids)) {
        return ids.map(convert);
    }

    return convert(ids);
};

Mongo.prototype.delivered = function(ids, value, publish, callback) {
    var self = this,
        todo = 1;

    function done(err) {
        if (err) {
            return callback(err);
        }

        todo--;

        if (!todo) {
            callback();
        }
    }

    ids = this.toObjectId(ids);

    this.channel.collection.then(function(err, collection) {
        if (err) return callback(err);

        collection.update(
            {_id: {$in: ids}},
            {$set: {delivered: value}},
            {multi: true},
            done
        );

        // Not all delivery confirmation listeners are on this server.
        if (publish && value) {
            todo++;
            self.publish({delivered: ids}, done);
        }
    });

    return this;
};

Mongo.prototype.close = function() {
    this.client.close();
    this.removeAllListeners();

    return this;
};
