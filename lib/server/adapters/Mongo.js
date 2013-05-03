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
    this._dummyDelivered = this._getDummyDelivered(opts.maxClients);
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
    replicaset: null,
    maxClients: 10
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
        deliverable: true,
        delivered: {},
        // Reserve space because docs in capped collection can't grow by update.
        dummyDelivered: this._dummyDelivered,
        data: data,
        event: 'dispatch:' + recipient
    };

    this.channel.publish(message, function(err, docs) {
        if (err) return callback(err);

        self.channel.collection.then(function(err, collection) {
            if (err) return callback(err);
            collection.update(
                {_id: docs[0]._id},
                {$unset: {dummyDelivered: 1}},
                function(err) {
                    callback(err, docs[0]._id.toString());
                }
            );
        });
    });

    return this;
};

/**
 * Get all messages for the recipient, which are deliverable.
 */
Mongo.prototype.get = function(recipient, callback) {
    var self = this;

    this.channel.collection.then(function(err, collection) {
        if (err) return callback(err);
        collection.find({
            recipient: recipient,
            deliverable: true
        }).toArray(function(err, docs) {
            if (err) return callback(err);
            callback(null, docs.map(self._toMessage.bind(self)));
        });
    });

    return this;
};

Mongo.prototype.delivery = function(opts, callback) {
    var self = this,
        todo = 1,
        update = {};

    function done(err) {
        if (err) {
            return callback(err);
        }

        todo--;

        if (!todo) {
            callback();
        }
    }

    if (opts.deliverable != null) {
        update.deliverable = opts.deliverable;
    } else {
        update['delivered.' + opts.client] = opts.delivered;
    }

    this.channel.collection.then(function(err, collection) {
        if (err) return callback(err);
        collection.update(
            {_id: self.client.db.ObjectID(opts.messageId)},
            {$set: update},
            done
        );
    });

    if (opts.delivered && opts.publish) {
        todo++;
        this.channel.publish({event: 'delivered:' + opts.messageId}, done);
    }

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
    if (doc && doc.event) {
        this.emit(doc.event, this._toMessage(doc));
    }
};

Mongo.prototype._getDummyDelivered = function(amount) {
    var dummy = {},
        key = '111111111111111';

    for (var i = 0; i < amount; i++) {
        dummy[key + i] = true;
    }

    return dummy;
};
