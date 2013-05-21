/**
 * Expose Server constructor.
 *
 * @api public
 */
exports.Server = require('./Server');

/**
 * Expose Message constructor.
 *
 * @api public
 */
exports.Message = require('./Message');

/**
 * Expose Connection constructor.
 *
 * @api public
 */
exports.Connection = require('./Connection');

/**
 * Expose Multiplexer constructor.
 *
 * @api public
 */
exports.Multiplexer = require('../shared/Multiplexer');

/**
 * Expose utils.
 *
 * @api public
 */
exports.utils = require('../shared/utils');

/**
 * Expose adapters.
 *
 * @api public
 */
exports.adapters = {
    Memory: require('./adapters/Memory'),
    Mongo: require('./adapters/Mongo')
};

/**
 * Create a Server instance.
 *
 * @param {Object} [opts]
 * @return {Server}
 * @see exports.Server
 * @api public
 */
exports.create = function(opts) {
    return new exports.Server(opts);
};
