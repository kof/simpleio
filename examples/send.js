var simpleio = require('..'),
    program = require('commander');

var sio,
    Adapter,
    enabledUsers = ['aaa', 'bbb', 'ccc', 'ddd'];

program
    .option('-a, --adapter <adapter>', 'adapter to use Memory|Mongo', String, 'Memory')
    .option('-d, --data <data>', 'data to send', String, 'test data')
    .option('-r, --recipient <recipient>', 'recipient defined in client', String)
    .option('-e, --event <event>', 'event the client listens to', String)
    .parse(process.argv);



Adapter = require('../lib/server/adapters/' + program.adapter);

sio = new simpleio.create({adapter: new Adapter})
    .on('error', console.error);

sio.message()
    .recipient(program.recipient)
    .data(program.data)
    .event(program.event)
    .send(function(err, delivered) {
        if (err) return console.log(err.stack);
        console.log('Delivered', delivered);
        process.exit();
    });
