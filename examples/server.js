var express = require('express'),
    simpleio = require('..'),
    path = require('path'),
    fs = require('fs'),
    program = require('commander');

var simpleioServer,
    enabledUsers = ['aaa', 'bbb', 'ccc', 'ddd'];

program
    .option('-a, --adapter <adapter>', 'adapter to use Memory|Mongo', String, 'Memory')
    .parse(process.argv);

simpleioServer = simpleio.create({adapter: new simpleio.adapters[program.adapter]})
    .on('error', console.error);

express()
    .use(express.query())
    .use(express.bodyParser())
    .use(express.cookieParser())
    .use(express.session({secret: '123456'}))
    .all('/simpleio', function(req, res, next) {
        var connection,
            userId = req.session.userId,
            save;

        if (!userId) {
            userId = req.session.userId = req.param('userId');
            save = true;
        }


        if (enabledUsers.indexOf(userId) < 0 ) {
            return res.send('Not authorized.', 401);
        }

        // Save the session manually because connect will do this only after
        // request is closed, but this one will remain for some seconds.
        if (save) {
            req.session.save();
        }

        connection = simpleioServer.open({
            user: userId,
            client: req.param('client'),
            delivered: req.param('delivered')
        });

        connection
            .once('close', function(data) {
                res.json(data);
            })
            .once('error', next)
            .on('error', console.error);

        if (req.param('messages')) {
            console.log('Got messages', req.param('messages'));
        }
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

            simpleioServer.message()
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

