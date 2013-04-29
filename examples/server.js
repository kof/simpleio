var express = require('express'),
    simpleio = require('..'),
    path = require('path'),
    fs = require('fs'),
    program = require('commander');

var sio;

sio = new simpleio.Server()
    .on('error', console.error);

express()
    .use(express.query())
    .use(express.bodyParser())
    .all('/simpleio', function(req, res, next) {
        var connection;

        connection = sio.connect({
            clientId: req.param('clientId'),
            messages: req.param('messages'),
            delivered: req.param('delivered'),
            events: req.param('events'),
            // You might want to get recipient id from your session.
            recipient: req.param('userId')
        });

        connection
            .once('response', function(data) {
                res.json(data);
            })
            .once('error', next)
            .on('error', console.error);

    })
    .use(express.static(__dirname + '/..'))
    .listen(3000);

console.log('Running on localhost:3000');

program.prompt('Type recipient id:', function(recipient) {

    program.prompt('Message:', function(body) {
        sio.send(recipient, {
            event: 'myevent',
            data: body
        }, function(err, delivered) {
            if (err) return console.log('Error', err);

            console.log('Delivered', delivered);
        });
    });
});

