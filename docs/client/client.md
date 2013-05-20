

<!-- Start ./lib/client/Client.js -->

## Client(options)

Client constructor.

### Params: 

* **Object** *options* 

## options

Default options, will be overwritten by options passed to the constructor.

  - `ajax` required jQuery ajax api
  - `url` connection url
  - `reconnectionDelay` ms amount to wait before to reconnect in case of error,
     will be increased on every further error until maxReconnectionDelay
  - `maxReconnectionDelay` max ms amount to wait before to reconnect in case of error
  - `multiplexDuration` ms amount for multiplexing messages before emitting

## connect([data])

Start polling.

### Params: 

* **Object** *[data]* data to send with the first request.

### Return:

* **Client** this

## disconnect()

Stop polling.

### Return:

* **Client** this

## send(message, [callback])

Send message to the server.

### Params: 

* **Mixed** *message* message to send.

* **Function** *[callback]* is called when message was send to the server without error.

### Return:

* **Client** this

<!-- End ./lib/client/Client.js -->

