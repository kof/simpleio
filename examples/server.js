var express = require('express'),
    simpleio = require('..'),
    path = require('path'),
    fs = require('fs'),
    program = require('commander');

var sio,
    Adapter,
    enabledUsers = ['aaa', 'bbb', 'ccc', 'ddd'];

program
    .option('-a, --adapter <adapter>', 'adapter to use Memory|Mongo', String, 'Memory')
    .parse(process.argv);

Adapter = require('../lib/server/adapters/' + program.adapter);

sio = new simpleio.create({adapter: new Adapter})
    .on('error', console.error);

express()
    .use(express.query())
    .use(express.bodyParser())
    .use(express.cookieParser())
    .use(express.session({secret: '123456'}))
    .all('/simpleio', function(req, res, next) {
        var connection,
            userId = req.param('userId'),
            client = req.session.client || (req.session.client = simpleio.utils.id());

        if (enabledUsers.indexOf(userId) < 0 ) {
            return res.send('Not authorized.', 401);
        }

        connection = sio.open({
            recipient: userId,
            client: client,
            messages: req.param('messages'),
            delivered: req.param('delivered')
        });

        connection
            .once('close', function(data) {
                res.json(data);
            })
            .once('error', next)
            .on('error', console.error);

    })
    .use(express.static(__dirname + '/..'))
    .listen(3000);

console.log('Running on localhost:3000', ', using adapter', program.adapter);

(function prompt() {
    program.prompt('Type recipient id:', function(recipient) {
        recipient = recipient.trim();
        if (!recipient) {
            return prompt();
        }

        program.prompt('Message:', function(data) {
            data = data.trim();
            if (!data) {
                return prompt();
            }

            console.time('delivery time');

            sio.message()
                .recipient(recipient)
                .data(data)
                .send(function(err, delivered) {
                    if (err) return console.log('Error', err);

                    console.log('Delivered', delivered);
                    console.timeEnd('delivery time');
                    prompt();

                });
        });
    });
}());

