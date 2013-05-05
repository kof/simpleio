## Features

- optimized for horizontal scalability
- support for router without sticky sessions (f.e. Heroku)
- secure message delivery (built-in delivery confirmation)
- multiplexing on the server and client

## Todo
- ensure index
- broadcast
- client to server
- retry by errors with exponential timeout

## Install

    npm i simpleio

    or

    git clone ...
    make install


## Message format

### Simpleio#send

### Simpleio#open




## Run bench

    npm i bench
    node-bench bench/adapter
