var mubsub = require('mubsub'),
    EventEmitter = require('events').EventEmitter,
    util = require('util'),
    $ = require('../../shared/utils');

function Mongo(uri, opts) {
    var self = this;

    opts = this.options = $.extend({}, Mongo.options, opts);
    this.stringify = opts.stringify || JSON.stringify;
    this.parse = opts.parse || JSON.parse;
    this.client = mubsub(opts.uri, opts.db)
        .on('error', this._error.bind(this))
        .on('connect', this._ensureIndex.bind(this));
    this.channel = this.client.channel(opts.name, opts.channel)
        .on('error', this._error.bind(this));
    this._placeholder = this._getPlaceholder(opts.maxClients);
    this.channel.on('document', this._onDocument.bind(this));
}

util.inherits(Mongo, EventEmitter);
module.exports = Mongo;

Mongo.options = {
    uri: 'mongodb://localhost:27017/simpleio?poolSize=5&auto_reconnect=true',
    db: {safe: true},
    name: 'simpleio',
    channel: {
        max: 100000,
        size: 1024 * 1024 * 500,
        retryInterval: 300
    },
    maxClients: 10
};

Mongo.prototype.dispatch = function(recipient, data, callback) {
    var self = this,
        message,
        event = 'dispatch:' + recipient;

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
        dummyDelivered: this._placeholder,
        data: data,
    };

    this.channel.publish(event, message, function(err, docs) {
        if (err) return callback(err);

        self.channel.collection.then(function(err, collection) {
            if (err) return callback(err);
            collection.update(
                {_id: docs[0]._id},
                {$unset: {'message.dummyDelivered': 1}},
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
 *
 * @param {String} recipient
 * @param {Function} callback
 * @param {Mongo} this
 */
Mongo.prototype.get = function(recipient, callback) {
    var self = this;

    this.channel.collection.then(function(err, collection) {
        if (err) return callback(err);

        collection.find({
            'message.recipient': recipient,
            'message.deliverable': true
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
        update['message.deliverable'] = opts.deliverable;
    } else {
        update['message.delivered.' + opts.client] = opts.delivered;
    }

    this.channel.collection.then(function(err, collection) {
        if (err) return callback(err);
        collection.update(
            {_id: mubsub.mongodb.ObjectID(opts.messageId)},
            {$set: update},
            done
        );
    });

    if (opts.delivered && opts.publish) {
        todo++;
        this.channel.publish('delivered:' + opts.messageId, done);
    }

    return this;
};

Mongo.prototype.destroy = function() {
    this.channel.removeListener('document', this._onDocument);
    this.client.close();
    this.removeAllListeners();

    return this;
};

Mongo.prototype._toMessage = function(doc) {
    var message;

    if (doc.message) {
        message = doc.message;
        message.id = doc._id.toString();
        if (message.data) message.data = this.parse(message.data);
    }

    return message;
};

Mongo.prototype._onDocument = function(doc) {
    if (doc.event) {
        this.emit(doc.event, this._toMessage(doc));
    }
};

/**
 * Create a placeholder object for `amount` of delivery confirmations.
 * This is a workaround to enable docs in mongo grow.
 *
 * @param {Number} amount
 * @return {Object}
 */
Mongo.prototype._getPlaceholder = function(amount) {
    var obj = {},
        key = '111111111111111';

    for (var i = 0; i < amount; i++) {
        obj[key + i] = true;
    }

    return obj;
};

Mongo.prototype._error = function(err) {
    if (err) this.emit('error', err);

    return this;
};

/**
 * Ensure indexes.
 */
Mongo.prototype._ensureIndex = function(db) {
    db.ensureIndex(this.options.name, {
        'message.recipient': 1,
        'message.deliverable': 1
    }, this._error.bind(this));

    return this;
};
