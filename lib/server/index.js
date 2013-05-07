exports.Server = require('./Server');

exports.create = function(opts) {
    return new exports.Server(opts);
};

exports.utils = require('../shared/utils');
