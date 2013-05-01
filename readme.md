## Features

- optimized for horizontal scalability
- support for router without sticky sessions (f.e. Heroku)
- secure message delivery (built-in delivery confirmation)
- multiplexing on the server and client

## Todo
- ensure index
- broadcast
- close connection if request closed
- bundle mubsub if safe:true is not fixed
- connect -> open etc.
- send(clientId)

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



## Run bench

    npm i bench
    node-bench bench/adapter
