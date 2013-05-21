

# client/Client.js

## Client(options)

Client constructor.

### Params:

* **Object** *options* 

## options

Default options, will be overwritten by options passed to the constructor.

  - `ajax` required jQuery ajax api
  - `url` connection url, default is '/simpleio'
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



# client/index.js

## Client

Client constructor.

See: Client

## create([options])

Create client.

See: Client

### Params:

* **Object** *[options]* 

### Return:

* **Client** 



# server/Connection.js

## EventEmitter



# server/index.js

## Server



# server/Message.js

## Message()

Message constructor.

## recipients

Define recipients.

### Params:

* **Array|String|Number** *recipients* you can pass multiple recipients using

### Return:

* **Message** this

## event(event)

Define an event name. If no event defined, the message can be subscribed
on the client using &quot;message&quot; event.

### Params:

* **String** *event* 

### Return:

* **Message** this

## data(data)

Define data.

### Params:

* **Mixed** *data* 

## send(callback)

Send the message. Message is sent successful if every recipient has confirmed
the delivery. Callback is called with &quot;true&quot; as second parameter if succeeded.

### Params:

* **Function** *callback* 

### Return:

* **Message** this

## broadcast(callback)

Broadcast a message. There is no delivery confirmation. Callback is called
after the message is stored.

### Params:

* **Function** *callback* 

### Return:

* **Message** this



# server/Server.js

## Server([options])

Server constructor.

### Params:

* **Object** *[options]* 

## connected(callback)

Get connected recipients.

### Params:

* **Function** *callback* 

### Return:

* **Server** this

## send()

Send a message to the recipient. If all clients receive and confirm the
message, delivered parameter will be true.

------



# shared/Multiplexer.js

## Multiplexer(opts)

Multiplexer constructor.

### Params:

* **Object** *opts* 

## add(messages)

Add message(s).

### Params:

* **Mixed** *messages* 

### Return:

* **Multiplexer** this

## reset([emit])

Reset multiplexer, emit &quot;reset&quot; if there are messages.

### Params:

* **Boolean** *[emit]* only emit &quot;reset&quot; if true.

### Return:

* **Multiplexer** this

## get()

Get messages.

### Return:

* **Array** 

## stop()

Stop multiplexer

### Return:

* **Multiplexer** this



# shared/utils.js

## toString



# server/adapters/Memory.js

## open(sender, callback)

A client opened a connection. Put the document to determine later
if the client is connected.

### Params:

* **String|Number** *sender* 

* **Function** *callback* 

### Return:

* **Mongo** this

## connected(since, callback)

Get users who opened a connection since x date.

### Params:

* **Date** *since* the date since user has send messages

* **Function** *callback* 

### Return:

* **Mongo** this

## get()

Get all messages for the recipient, which are deliverable.



# server/adapters/Mongo.js

## open(sender, callback)

A client opened a connection. Put the document to determine later
if the client is connected.

### Params:

* **String|Number** *sender* 

* **Function** *callback* 

### Return:

* **Mongo** this

## connected(since, callback)

Get users who opened a connection since x date.

### Params:

* **Date** *since* the date since user has send messages

* **Function** *callback* 

### Return:

* **Mongo** this

## get(recipient, callback, this)

Get all messages for the recipient, which are deliverable.

### Params:

* **String** *recipient* 

* **Function** *callback* 

* **Mongo** *this* 

## _getPlaceholder(amount)

Create a placeholder object for `amount` of delivery confirmations.
This is a workaround to enable docs in mongo grow.

### Params:

* **Number** *amount* 

### Return:

* **Object** 

## _ensureIndex()

Ensure indexes.

