exports.Client = require('./Client');

/**
 * Create client.
 * @see Client
 * @return {Client}
 * @api public
 */
exports.create = function(opts) {
    return new exports.Client(opts);
};
