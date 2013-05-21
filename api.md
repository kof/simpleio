

# client/index.js

## exports.Client

Client constructor.

See: Client

## function Object() { [native code] }#create([options])

Create client.

See: Client

### Params:

* **Object** *[options]* 

### Return:

* **Client** 



# client/Client.js

## Client(options)

Client constructor.

### Params:

* **Object** *options* 

## Client.options

Default options, will be overwritten by options passed to the constructor.

  - `ajax` required jQuery ajax api
  - `url` connection url, default is '/simpleio'
  - `reconnectionDelay` ms amount to wait before to reconnect in case of error,
     will be increased on every further error until maxReconnectionDelay
  - `maxReconnectionDelay` max ms amount to wait before to reconnect in case of error
  - `multiplexDuration` ms amount for multiplexing messages before emitting

## Client#connect([data])

Start polling.

### Params:

* **Object** *[data]* data to send with the first request.

### Return:

* **Client** this

## Client#disconnect()

Stop polling.

### Return:

* **Client** this

## Client#send(message, [callback])

Send message to the server.

### Params:

* **Mixed** *message* message to send.

* **Function** *[callback]* is called when message was send to the server without error.

### Return:

* **Client** this



# server/Message.js

## Message()

Message constructor.

## undefined.recipients

Define recipients.

### Params:

* **Array|String|Number** *recipients* you can pass multiple recipients using

### Return:

* **Message** this

## Message#event(event)

Define an event name. If no event defined, the message can be subscribed
on the client using &quot;message&quot; event.

### Params:

* **String** *event* 

### Return:

* **Message** this

## Message#data(data)

Define data.

### Params:

* **Mixed** *data* 

## Message#send(callback)

Send the message. Message is sent successful if every recipient has confirmed
the delivery. Callback is called with &quot;true&quot; as second parameter if succeeded.

### Params:

* **Function** *callback* 

### Return:

* **Message** this

## Message#broadcast(callback)

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

## Server#connected(callback)

Get connected recipients.

### Params:

* **Function** *callback* 

### Return:

* **Server** this

## Server#send()

Send a message to the recipient. If all clients receive and confirm the
message, delivered parameter will be true.



# shared/Multiplexer.js

## Multiplexer(opts)

Multiplexer constructor.

### Params:

* **Object** *opts* 

## Multiplexer#add(messages)

Add message(s).

### Params:

* **Mixed** *messages* 

### Return:

* **Multiplexer** this

## Multiplexer#reset([emit])

Reset multiplexer, emit &quot;reset&quot; if there are messages.

### Params:

* **Boolean** *[emit]* only emit &quot;reset&quot; if true.

### Return:

* **Multiplexer** this

## Multiplexer#get()

Get messages.

### Return:

* **Array** 

## Multiplexer#stop()

Stop multiplexer

### Return:

* **Multiplexer** this



# server/Connection.js

## undefined.EventEmitter



# server/index.js

## exports.Server



# shared/utils.js

## undefined.toString



# server/adapters/Memory.js

## Memory#open(sender, callback)

A client opened a connection. Put the document to determine later
if the client is connected.

### Params:

* **String|Number** *sender* 

* **Function** *callback* 

### Return:

* **Mongo** this

## Memory#connected(since, callback)

Get users who opened a connection since x date.

### Params:

* **Date** *since* the date since user has send messages

* **Function** *callback* 

### Return:

* **Mongo** this

## Memory#get()

Get all messages for the recipient, which are deliverable.



# server/adapters/Mongo.js

## Mongo#open(sender, callback)

A client opened a connection. Put the document to determine later
if the client is connected.

### Params:

* **String|Number** *sender* 

* **Function** *callback* 

### Return:

* **Mongo** this

## Mongo#connected(since, callback)

Get users who opened a connection since x date.

### Params:

* **Date** *since* the date since user has send messages

* **Function** *callback* 

### Return:

* **Mongo** this

## Mongo#get(recipient, callback, this)

Get all messages for the recipient, which are deliverable.

### Params:

* **String** *recipient* 

* **Function** *callback* 

* **Mongo** *this* 

## Mongo#_getPlaceholder(amount)

Create a placeholder object for `amount` of delivery confirmations.
This is a workaround to enable docs in mongo grow.

### Params:

* **Number** *amount* 

### Return:

* **Object** 

## Mongo#_ensureIndex()

Ensure indexes.

