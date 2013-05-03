var sio = require('..'),
    Mongo = require('../lib/server/adapters/Mongo'),
    bench = require('bench');

var compare = exports.compare = {},
    id = 0,
    data = 'test data',
    stats = {memory: 0, mongo: 0};

function sendAndConfirm(adapter, server1, server2, done) {
    var opts;

    id++;
    opts = {
        client: id,
        recipient: id
    };

    server1
        .open(opts)
        .on('close', function(data) {
            opts.delivered = data.messages.map(function(message) {
                return message.id;
            });

            process.nextTick(function() {
                server2
                    .open(opts)
                    .on('error', console.error);
            });
        })
        .on('error', console.error);

    process.nextTick(function() {
        stats[adapter]++;
        server1.send(opts.recipient, data, function(err, delivered) {
            if (err) return console.error(err);
            if (!delivered) return console.error('Undelivered ' + adapter, opts);
            done();
        });
    });
}

compare.memory = function(done) {
    var server = new sio.Server({multiplexDuration: 1});

    sendAndConfirm('memory', server, server, done);
};

var mongoServer1 = new sio.Server({multiplexDuration: 1, adapter: new Mongo}),
    mongoServer2 = new sio.Server({multiplexDuration: 1, adapter: new Mongo});

compare.mongo = function(done) {
    sendAndConfirm('mongo', mongoServer1, mongoServer2, done);
};

exports.done = function(data) {
    bench.show(data);
    console.log(stats);
};

// Wait for connection
setTimeout(bench.runMain, 500);
