var express = require('express'),
    Simpleio = require('..');

var simpleio,
    app;

simpleio = new Simpleio()
    .on('error', console.error);

app = express()
    .use(express.query())
    .use(express.bodyParser())
    .all('/simpleio', function(req, res, next) {
        console.log('simpleio incomming', req.params);

        simpleio.connect(req.params)
            .on('messages', function(messages) {
                res.json(messages);
            })
            .once('error', next)
            .on('error', console.error);

    })
    .use(function(err, req, res, next) {
        next(err);
    })
    .listen(3000);

console.log('Running on localhost:3000');

