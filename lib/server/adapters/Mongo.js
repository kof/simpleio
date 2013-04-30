var mubsub = require('mubsub'),
    EventEmitter = require('events').EventEmitter,
    util = require('util'),
    $ = require('../../shared/utils');

function Mongo(opts) {
    var self = this;

    opts = this.options = $.extend({}, Mongo.options, opts);
    this.stringify = opts.stringify || JSON.stringify;
    this.parse = opts.parse || JSON.parse;
    this.client = mubsub(opts.uri, opts.db, opts.replicaset);
    this.channel = this.client.channel(opts.channel.name, opts.channel)
        .on('error', function(err) {
            self.emit('error', err);
        });
}

util.inherits(Mongo, EventEmitter);
module.exports = Mongo;

Mongo.options = {
    uri: 'mongodb://localhost:27017/simpleio',
    channel: {name: 'simpleio'},
    db: null,
    replicaset: null
};

Mongo.prototype.add = function(recipient, data, callback) {
    var self = this,
        message;

    try {
        data = this.stringify(data);
    } catch(err) {
        process.nextTick(function() {
            callback(err);
        });
        return this;
    }

    message = {
        date: Date.now(),
        recipient: recipient,
        // Reserve space because docs in capped collection can't grow by update.
        delivered: null,
        data: data,
        event: 'add:' + recipient
    };

    this.channel.publish(message, function(err, docs) {
        if (err) return callback(err);

        message.id = docs[0]._id.toString();

        // For the case somebody is listening locally.
        self.emit('add:' + recipient, message);

        callback(err, message.id);
    });

    return this;
};

Mongo.prototype.subscribe = function(event, callback) {
    var self = this,
        subscription;

    callback.__unsubscribe = function() {
        self.removeListener(event, trigger);
        subscription.unsubscribe();
    };

    function trigger(message) {
        callback(message);
        callback.__unsubscribe();
    }

    // For the case its triggered locally.
    this.on(event, trigger);

    subscription = self.channel.subscribe({event: event}, function(doc) {
        trigger(self._docToMessage(doc));
    });

    return this;
};

Mongo.prototype.unsubscribe = function(event, callback) {
    callback.__unsubscribe();

    return this;
};

Mongo.prototype.get = function(recipient, callback) {
    var self = this;

    this.channel.collection.then(function(err, collection) {
        if (err) return callback(err);

        collection.find({
            recipient: recipient,
            delivered: null
        }).toArray(function(err, docs) {
            if (err) return callback(err);

            callback(null, docs.map(self._docToMessage.bind(self)));
        });
    });

    return this;
};

Mongo.prototype.delivered = function(id, value, publish, callback) {
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

    this.channel.collection.then(function(err, collection) {
        if (err) return callback(err);

        collection.update(
            {_id: self.client.db.ObjectID(id)},
            {$set: {delivered: value}},
            done
        );

        self.emit('delivered:' + id);

        // Not all delivery confirmation listeners are on this server.
        if (publish && value) {
            todo++;
            collection.insert({event: 'delivered:' + id}, done);
        }
    });

    return this;
};

Mongo.prototype.destroy = function() {
    this.client.close();
    this.removeAllListeners();

    return this;
};

Mongo.prototype._docToMessage = function(doc) {
    doc.id = doc._id.toString();
    delete doc._id;
    if (doc.data) {
        doc.data = this.parse(doc.data);
    }

    return doc;
};
