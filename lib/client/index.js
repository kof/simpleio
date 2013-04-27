var Client = require('./Client');

exports.createClient = function(opts) {
    return new Client(opts || {});
};
