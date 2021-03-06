var simpleio = require('..'),
    program = require('commander');

var sio,
    Adapter,
    enabledUsers = ['aaa', 'bbb', 'ccc', 'ddd'];

function json(str) {
    try {
        str = JSON.parse(str)
    } catch(err) {}

    return str;
}

program
    .option('-a, --adapter <adapter>', 'adapter to use Memory|Mongo', String, 'Memory')
    .option('-d, --data <data>', 'data to send', json, 'test data')
    .option('-r, --recipient <recipient>', 'recipient defined in client', String)
    .option('-e, --event <event>', 'event the client listens to', String)
    .option('-A, --amount <amount>', 'amount of time to send the same event to test multiplexing', Number, 1)
    .parse(process.argv);

Adapter = require('../lib/server/adapters/' + program.adapter);

sio = new simpleio.create({adapter: new Adapter})
    .on('error', console.error);

function sendOne(callback) {
    sio.message()
        .recipient(program.recipient)
        .data(program.data)
        .event(program.event)
        .send(callback);
}

var sent = 0;

function send(i) {
    sendOne(function(err, delivered) {
        if (err) return console.log(err.stack);
        console.log('Delivered', delivered);
        sent++;
        if (sent == program.amount) process.exit();
    });
}

for (var i = 0; i < program.amount; i++) {
    send(i);
}


