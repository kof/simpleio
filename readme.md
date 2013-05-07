## Features

- optimized for horizontal scaling
- support for router/balancer without sticky sessions (f.e. Heroku)
- reliable message delivery (built-in delivery confirmation)
- multiplexing on the server and client

## Todo
- retry by errors with exponential timeout
- client to server messaging
- tests
- documentation

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
