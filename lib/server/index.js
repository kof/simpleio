exports.Server = require('./Server');

exports.Message = require('./Message');

exports.Connection = require('./Connection');

exports.Multiplexer = require('../shared/Multiplexer');

exports.utils = require('../shared/utils');

exports.adapters = {};

exports.adapters.Memory = require('./adapters/Memory');

exports.adapters.Mongo = require('./adapters/Mongo');

exports.create = function(opts) {
    return new exports.Server(opts);
};

