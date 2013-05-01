var sio = require('..'),
    Mongo = require('../lib/server/adapters/Mongo');

var compare = exports.compare = {},
    id = 0,
    data = 'test data';

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

    setTimeout(function() {
        server1.send(opts.recipient, data, function(err, delivered) {
            if (err) return console.error(err);
            if (!delivered) return console.error('Undelivered ' + adapter, opts);
            done();
        });
    }, 200);
}

compare['send and receive using memory adapter'] = function(done) {
    var server = new sio.Server({multiplexDuration: 1});

    sendAndConfirm('memory', server, server, done);
};

compare['send and receive using mongo adapter'] = function(done) {
    var server1 = new sio.Server({multiplexDuration: 1, adapter: new Mongo}),
        server2 = new sio.Server({multiplexDuration: 1, adapter: new Mongo});

    sendAndConfirm('mongo', server1, server2, done);
};
