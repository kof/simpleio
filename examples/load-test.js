var simpleio = require('..'),
    Adapter = require('../lib/server/adapters/Mongo');

for (var i = 0; i < 10; i++) {
    new simpleio.Server({adapter: new Adapter({name: 'channel.' + i})})
        .on('error', console.error);
}
