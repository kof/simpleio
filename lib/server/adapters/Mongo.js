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

    this._subscription = this.channel.subscribe(this._onMessage.bind(this));
}

util.inherits(Mongo, EventEmitter);
module.exports = Mongo;

Mongo.options = {
    uri: 'mongodb://localhost:27017/simpleio?poolSize=5&auto_reconnect=true',
    channel: {
        name: 'simpleio',
        max: 100000,
        size: 1024 * 1024 * 500
    },
    db: {safe: true},
    replicaset: null
};

Mongo.prototype.dispatch = function(recipient, data, callback) {
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
        date: new Date,
        recipient: recipient,
        // Reserve space because docs in capped collection can't grow by update.
        delivered: 0,
        data: data,
        event: 'dispatch:' + recipient
    };

    this.channel.publish(message, function(err, docs) {
        if (err) return callback(err);

        callback(err, docs[0]._id.toString());
    });

    return this;
};

Mongo.prototype.get = function(recipient, callback) {
    var self = this;

    this.channel.collection.then(function(err, collection) {
        if (err) return callback(err);

        collection.find({
            recipient: recipient,
            delivered: 0
        }).toArray(function(err, docs) {
            if (err) return callback(err);

            callback(null, docs.map(self._toMessage.bind(self)));
        });
    });

    return this;
};

Mongo.prototype.delivery = function(id, delivered, publish, callback) {
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
            {$set: {delivered: delivered ? 1 : -1}},
            done
        );

        if (delivered && publish) {
            todo++;
            self.channel.publish({event: 'delivered:' + id}, done);
        }
    });

    return this;
};

Mongo.prototype.destroy = function() {
    this._subscription.unsubscribe();
    this.client.close();
    this.removeAllListeners();

    return this;
};

Mongo.prototype._toMessage = function(doc) {
    doc.id = doc._id.toString();
    delete doc._id;
    if (doc.data) {
        doc.data = this.parse(doc.data);
    }

    return doc;
};

Mongo.prototype._onMessage = function(doc) {
    if (doc.event) {
        this.emit(doc.event, this._toMessage(doc));
    }
};
