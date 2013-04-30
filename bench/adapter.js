var sio = require('..'),
    Mongo = require('../lib/server/adapters/Mongo');

var compare = exports.compare = {},
    id = Date.now(),
    data = 'test data';

function sendAndConfirm(server, done) {
    var opts;

    opts = {
        client: ++id,
        recipient: ++id
    };

    server
        .connect(opts)
        .on('response', function(data) {
            opts.delivered = data.messages.map(function(message) {
                return message.id;
            });

            process.nextTick(function() {
                server
                    .connect(opts)
                    .on('error', console.error);
            });
        })
        .on('error', console.error);

    server.send(opts.recipient, data, function(err, delivered) {
        if (err) return console.error(err);
        if (!delivered) return console.error('Undelivered', opts);
        done();
    });
}

compare['send and receive using memory adapter'] = function(done) {
    var server = new sio.Server({multiplexDuration: 1});

    sendAndConfirm(server, done);
};

compare['send and receive using mongo adapter'] = function(done) {
    var adapter = new Mongo,
        server;

    // Override local event emitting, because otherwise we are not
    // comparing pure mongodb performance, but node.
    adapter.emit = function(event, fn) {
        if (event == 'error') {
            return Mongo.prototype.emit.apply(this, arguments);
        }

        return this;
    };

    server = new sio.Server({multiplexDuration: 1, adapter: adapter}),

    sendAndConfirm(server, function() {
        done();
    });
};
