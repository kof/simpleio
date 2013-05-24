## Simple xhr-polling based communication.

- support for router/balancer without sticky sessions (f.e. Heroku)
- optimized for horizontal scaling
- reliable message delivery (built-in delivery confirmation)
- multiplexing on the server and client
- lightweight (appr. 2.5 kb minified and gzipped on the client)

## Todo

- tests
- documentation

## Install

    // Latest release
    npm i simpleio

    or master version (on your risk)

    git clone git@github.com:kof/simpleio.git
    make install
    make build

## Examples

See [examples](./examples)

## API

See [api](./api.md)

## Usage on the client

1. Include build/simpleio.min.js on your site.

        // If you you wrap the module into amd or if you are using some of require/define
        // implementations.
        var simpleio = require('simpleio');

        // Plain javascript
        var simpleio = window.simpleio;

1. Create a client, pass ajax implementation from jquery or similar:

        var client = simpleio.create({ajax: jQuery.ajax});

1. Start connection:

        client.connect();

1. Listen to any messages:

        client.on('message', function(message) {
            console.log('new message:', message);
        });

1. Or listen to specific events:

        client.on('myevent', function(data) {
            console.log('new data', data);
        });

1. Listen to error events:

        client.on('error', console.log);

1. Send a message to the server:

        client.send('My message', function() {
            console.log('Message sent');
        });

## Usage on the server

1. Create simpleio server:

        // Using default memory adapter as a storage.
        var simpleioServer = simpleio.create()
            .on('error', console.error);

        // Using mongodb as a storage
        var simpleioServer = simpleio.create({adapter: new simpleio.adapters.Mongo()})
            .on('error', console.error);

1. Accept GET/POST requests on the simpleio route using any web framework (/simpleio is default)

    Express example:

        express()
            .use(express.query())
            .use(express.bodyParser())
            .use(express.cookieParser())
            .use(express.session({secret: '123456'}))
            .all('/simpleio', function(req, res, next) {
                // Next steps here.
            });

1. Create incomming connection whithin simpleio:

        var connection = simpleioServer.open({
            user: userId,
            client: req.param('client'),
            delivered: req.param('delivered')
        });

1. Listen to events on connection instance:

        connection
            .once('close', function(data) {

                // Send data to the client.
                res.json(data);
            })
            .once('error', next)
            .on('error', console.error);

1. Read POST param "messages" to get messages client sends to the server:

        if (req.param('messages')) {
            console.log('Got messages', req.param('messages'));
        }

1. Send a message to a user:

        simpleioServer.message()
            .recipient(recipient)
            .data(data)
            .send(function(err, delivered) {
                console.log('Delivered', delivered, err);
            });

1. Send a message to multiple users:

        simpleioServer.message()
            .recipients(recipient1, recipient2 ...)
            .data(data)
            .send(function(err, delivered) {
                console.log('Delivered to all users', delivered, err);
            });

1. Broadcast a message - no delivery confirmation:

        simpleioServer.message()
            .recipients(recipient1, recipient2 ...)
            .data(data)
            .broadcast(function(err, broadcasted) {
                console.log('Broadcasted, broadcasted, err);
            });



## Run bench

Ensure running mongodb first.

    node bench/adapter
