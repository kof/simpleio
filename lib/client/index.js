exports.Client = require('./Client');

exports.request;

exports.create = function(opts) {
    return new exports.Client(opts);
};
