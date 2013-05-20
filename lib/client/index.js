/**
 * Client constructor.
 *
 * @see Client
 * @api public
 */
exports.Client = require('./Client');

/**
 * Create client.
 *
 * @param {Object} [options]
 * @return {Client}
 * @see Client
 * @api public
 */
exports.create = function(options) {
    return new exports.Client(options);
};
