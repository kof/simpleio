var Adapter = require('../Adapter'),
    mubsub = require('mubsub'),
    util = require('util'),
    $ = require('../../shared/utils');

/**
 * Mongo adapter constructor.
 *
 * @param {String|Object} uri or Db instance from mongo driver.
 * @param {Object} opts will overwrite defaults, see `Mongo.options`
 * @api public
 */
function Mongo(uri, opts) {
    this.options = opts = $.extend({}, Mongo.options, opts);
    this._stringify = opts.stringify;
    this._parse = opts.parse;
    this._placeholder = this._getPlaceholder(opts.maxClients);

    this._client = mubsub(uri || opts.uri, opts.db)
        .on('error', this._error.bind(this));

    this._channel = this._client.channel(opts.name, opts.channel)
        .on('error', this._error.bind(this))
        .on('ready', this._ensureIndex.bind(this))
        .on('document', this._onDocument.bind(this));
}

util.inherits(Mongo, Adapter);
module.exports = Mongo;

/**
 * Mongo adapter defaults.
 *
 *   - `uri` mongo uri
 *   - `db` mongo options
 *   - `name` collection name, mubsub channel name
 *   - `channel` mubsub channel options
 *   - `maxClients` max amount of clients per recipient. Needed to reserve space
 *     in docs, because capped collections can't grow.
 *   - `stringify` function for data serialization, defaults to JSON.stringify
 *   - `parse` function for data deserialization, defaults to JSON.parse
 *
 * @type object
 * @api public
 */
Mongo.options = {
    uri: 'mongodb://localhost:27017/simpleio',
    db: {safe: true},
    name: 'simpleio',
    channel: null,
    maxClients: 40,
    stringify: JSON.stringify,
    parse: JSON.parse
};


/**
 * @see Adapter#dispatch
 * @api public
 */
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
        delivered: [],
        // Reserve space because docs in capped collection can't grow by update.
        deliveredPlaceholder: this._placeholder,
        data: data,
    };

    this._channel.publish(event, message, function(err, doc) {
        if (err) return callback(err);

        self._channel.collection.then(function(err, collection) {
            if (err) return callback(err);
            collection.update(
                {_id: doc._id},
                {$unset: {'message.deliveredPlaceholder': 1}},
                function(err) {
                    callback(err, doc._id.toString());
                }
            );
        });
    });

    return this;
};


/**
 * @see Adapter#open
 * @api public
 */
Mongo.prototype.open = function(sender, callback) {
    this._channel.publish('open', {sender: sender, date: new Date}, callback);

    return this;
};


/**
 * @see Adapter#connected
 * @api public
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
 * @see Adapter#get
 * @api public
 */
Mongo.prototype.get = function(recipient, since, callback) {
    var self = this;

    this._channel.collection.then(function(err, collection) {
        if (err) return callback(err);

        collection.find({
            'message.date': {$gte: since},
            'message.recipient': recipient,
            'message.deliverable': true
        }).toArray(function(err, docs) {
            if (err) return callback(err);
            callback(null, docs.map(self._toMessage.bind(self)));
        });
    });

    return this;
};

/**
 * @see Adapter#delivery
 * @api public
 */
Mongo.prototype.delivery = function(opts, callback) {
    var self = this,
        todo = 1,
        update = {};

    function done(err) {

        // Error code 10003 "MongoError: failing update: objects in a capped ns cannot grow"
        // We ignore it, as it is possible that amount of clients per recipient
        // is larger than reserved via `options.maxClients`.
        if (err && err.code != 10003) {
            return callback(err);
        }

        todo--;

        if (!todo) {
            callback();
        }
    }

    if (opts.deliverable != null) {
        update.$set = {'message.deliverable': opts.deliverable};
    } else if (opts.delivered) {
        update.$addToSet = {'message.delivered': opts.client};
    }

    if (opts.delivered && opts.publish) {
        todo++;
        this._channel.publish('delivered:' + opts.messageId, done);
    }

    this._channel.collection.then(function(err, collection) {
        if (err) return callback(err);
        collection.update(
            {_id: mubsub.mongodb.ObjectID(opts.messageId)},
            update,
            done
        );
    });

    return this;
};

/**
 * @see Adapter#destroy
 * @api public
 */
Mongo.prototype.destroy = function() {
    this._channel.removeListener('document', this._onDocument);
    this._client.close();
    this.removeAllListeners();

    return this;
};

/**
 * Extract message from the doc object.
 *
 * @param {Object} doc
 * @return {Mongo} this
 * @api private
 */
Mongo.prototype._toMessage = function(doc) {
    var message;

    if (doc.message) {
        message = doc.message;
        message.id = doc._id.toString();
        if (message.data) message.data = this._parse(message.data);
    }

    return message;
};

/**
 * Emit message event on every document.
 *
 * @param {Object} doc
 * @return {Mongo} this
 * @api private
 */
Mongo.prototype._onDocument = function(doc) {
    if (doc.event) {
        this.emit(doc.event, this._toMessage(doc));
    }
};

/**
 * Create a placeholder object for `amount` of client ids for delivery confirmations.
 * This is a workaround to enable docs in capped mongo collection to grow.
 *
 * @param {Number} amount
 * @return {Object}
 * @api private
 */
Mongo.prototype._getPlaceholder = function(amount) {
    var arr = [],
        i;

    for (i = 0; i < amount; i++) {
        arr.push($.uid());
    }

    return arr;
};

/**
 * Emit error event.
 *
 * @param {Error} err
 * @return {Mongo} this
 * @api private
 */
Mongo.prototype._error = function(err) {
    if (err) this.emit('error', err);

    return this;
};

/**
 * Ensure indexes.
 *
 * @return {Mongo} this
 * @api private
 */
Mongo.prototype._ensureIndex = function() {
    this._client.db.ensureIndex(this.options.name, {
        'message.date': 1,
        'message.recipient': 1,
        'message.deliverable': 1
    }, this._error.bind(this));

    return this;
};
