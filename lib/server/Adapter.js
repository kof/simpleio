var util = require('util'),
    EventEmitter = require('events').EventEmitter;

/**
 * Adapter interface.
 * All adapters should inherit from this class.
 *
 * @api public
 */
function Adapter() {}

module.exports = Adapter;
util.inherits(Adapter, EventEmitter);

/**
 * Dispatch a message.
 *
 * @param {String} recipient
 * @param {Mixed} data
 * @param {Function} callback
 * @return {Adapter} this
 * @api public
 */
Adapter.prototype.dispatch = function(recipient, data, callback) {
    throw new Error('Not implemented method "dispatch"');
};

/**
 * A client opened a connection. Save it to determine later if the client is connected.
 *
 * @param {String|Number} sender
 * @param {Function} callback
 * @return {Adapter} this
 * @api public
 */
Adapter.prototype.open = function(sender, callback) {
    throw new Error('Not implemented method "open"');
};

/**
 * Get users who opened a connection since x date.
 *
 * @param {Date} since the date since user has send messages
 * @param {Function} callback
 * @return {Adapter} this
 * @api public
 */
Adapter.prototype.connected = function(since, callback) {
    throw new Error('Not implemented method "connected"');
};

/**
 * Get all messages for the recipient, which are deliverable.
 *
 * @param {String} recipient id
 * @param {Date} since which date to consider messages, the oldest message would
 *   match the `since` date
 * @param {Function} callback
 * @return {Adapter} this
 * @api public
 */
Adapter.prototype.get = function(since, callback) {
    throw new Error('Not implemented method "get"');
};

/**
 * Mark message status as deliverable, save clients who has got the message.
 *
 * Options
 *   - `deliverable` boolean, message is undeliverable if false
 *   - `delivered` boolean, true if some client got a message
 *   - `client` client id which got a message
 *   - `public` boolean, true if delivered event needs to be published on the storage
 *
 * @param {Object} opts
 * @param {Function} callback
 * @return {Adapter} this
 * @api public
 */
Adapter.prototype.delivery = function(options, callback) {
    throw new Error('Not implemented method "delivery"');
};

/**
 * Destroy the adapter.
 * Remove all event listeners, close connections to the storage etc.
 *
 * @return {Adapter} this
 * @api public
 */
Adapter.prototype.destroy = function() {
    throw new Error('Not implemented method "destroy"');
};
