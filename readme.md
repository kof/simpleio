## Features

- optimized for horizontal scalability
- support for router without sticky sessions (f.e. Heroku)
- secure message delivery (built-in delivery confirmation)
- multiplexing on the server and client

## Todo
- ensure index
- broadcast
- abstract away json api of mongo, listen to events locally too
- make Multiplexer shared, use component-emitter

## Message format

### Simpleio#send

    {
        recipients: [ObjectId|Array],
        event: String
    }

### Simpleio#connect

    {
        recipient: ObjectId,
        delivered: [ObjectId],

    }



