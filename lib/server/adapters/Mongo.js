var mubsub = require('mubsub'),
    EventEmitter = require('events').EventEmitter,
    util = require('util'),
    $ = require('../../shared/utils');

function Mongo(uri, opts) {
    this.options = opts = $.extend({}, Mongo.options, opts);
    this._stringify = opts.stringify || JSON.stringify;
    this._parse = opts.parse || JSON.parse;
    this._placeholder = this._getPlaceholder(opts.maxClients);

    this._client = mubsub(uri || opts.uri, opts.db)
        .on('error', this._error.bind(this));

    this._channel = this._client.channel(opts.name, opts.channel)
        .on('error', this._error.bind(this))
        .on('ready', this._ensureIndex.bind(this))
        .on('document', this._onDocument.bind(this));
}

util.inherits(Mongo, EventEmitter);
module.exports = Mongo;

Mongo.options = {
    uri: 'mongodb://localhost:27017/simpleio',
    db: {safe: true},
    name: 'simpleio',
    channel: null,

    // Max amount of clients per recipient. Needed to reserve space in docs.
    maxClients: 10
};

Mongo.prototype.dispatch = function(recipient, data, callback) {
    var self = this,
        message,
        event = 'dispatch:' + recipient;

    try {
         data = this._stringify(data);
    } catch(err) {
         process.nextTick(callback.bind(this, err));
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

    this._channel.publish(event, message, function(err, docs) {
        if (err) return callback(err);

        self._channel.collection.then(function(err, collection) {
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
 * A client opened a connection. Put the document to determine later
 * if the client is connected.
 *
 * @param {String|Number|ObjectId} sender
 * @param {Function} callback
 * @return {Mongo} this
 */
Mongo.prototype.open = function(sender, callback) {
    this._channel.publish('open', {sender: sender, date: new Date}, callback);

    return this;
};

/**
 * Get users who opened a connection since x date.
 *
 * @param {Date} since the date since user has send messages
 * @param {Function} callback
 * @return {Mongo} this
 */
Mongo.prototype.connected = function(since, callback) {
    this._channel.collection.then(function(err, collection) {
        if (err) return callback(err);

        collection.aggregate([
            {$match: {
                'message.date': {$gt: since}
            }},
            {$group: {
                _id: '$message.sender'
            }}
        ], function(err, docs) {
            if (err) return callback(err);

            callback(null, docs.map(function(doc) {
                return doc._id.toString();
            }));
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

    this._channel.collection.then(function(err, collection) {
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

    this._channel.collection.then(function(err, collection) {
        if (err) return callback(err);
        collection.update(
            {_id: mubsub.mongodb.ObjectID(opts.messageId)},
            {$set: update},
            done
        );
    });

    if (opts.delivered && opts.publish) {
        todo++;
        this._channel.publish('delivered:' + opts.messageId, done);
    }

    return this;
};

Mongo.prototype.destroy = function() {
    this._channel.removeListener('document', this._onDocument);
    this._client.close();
    this.removeAllListeners();

    return this;
};

Mongo.prototype._toMessage = function(doc) {
    var message;

    if (doc.message) {
        message = doc.message;
        message.id = doc._id.toString();
        if (message.data) message.data = this._parse(message.data);
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
Mongo.prototype._ensureIndex = function() {
    this._client.db.ensureIndex(this.options.name, {
        'message.recipient': 1,
        'message.deliverable': 1
    }, this._error.bind(this));

    this._client.db.ensureIndex(
        this.options.name,
        {'message.date': 1},
        this._error.bind(this)
    );

    return this;
};
