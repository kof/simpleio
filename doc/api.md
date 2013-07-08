# Map
  - /components/component-emitter/index.js
  - /lib/client/Client.js
  - /lib/client/index.js
  - /lib/server/Adapter.js
  - /lib/server/Connection.js
  - /lib/server/Message.js
  - /lib/server/Server.js
  - /lib/server/adapters/Memory.js
  - /lib/server/adapters/Mongo.js
  - /lib/server/index.js
  - /lib/shared/Multiplexer.js
  - /lib/shared/utils.js

# /components/component-emitter/index.js

## Emitter()

Initialize a new `Emitter`.

## Emitter#on(event, fn)

Listen on the given `event` with `fn`.

### Params:

* **String** *event* 

* **Function** *fn* 

### Return:

* **Emitter** 

## Emitter#once(event, fn)

Adds an `event` listener that will be invoked a single
time then automatically removed.

### Params:

* **String** *event* 

* **Function** *fn* 

### Return:

* **Emitter** 

Remove the given callback for `event` or all
registered callbacks.

### Params:

* **String** *event* 

* **Function** *fn* 

### Return:

* **Emitter** 

## Emitter#emit(event, ...)

Emit `event` with the given args.

### Params:

* **String** *event* 

* **Mixed** *...* 

### Return:

* **Emitter** 

## Emitter#listeners(event)

Return array of callbacks for `event`.

### Params:

* **String** *event* 

### Return:

* **Array** 

## Emitter#hasListeners(event)

Check if this emitter has `event` handlers.

### Params:

* **String** *event* 

### Return:

* **Boolean** 



# /lib/client/Client.js

## Client(options)

Client constructor.
Inherits from Emitter.

See: Emitter

### Params:

* **Object** *options* 

## Client.options

Default options, will be overwritten by options passed to the constructor.

  - `ajax` required jQuery ajax api (web client only)
  - `url` connection url, default is `/simpleio`
  - `reconnectionDelay` ms amount to wait before to reconnect in case of error,
    will be increased on every further error until maxReconnectionDelay, default is `1000`
  - `maxReconnectionDelay` max ms amount to wait before to reconnect in case of error,
    default is `10000`
  - `multiplexDuration` ms amount for multiplexing messages before emitting,
    default is `500`

## Client#connect([data])

Start polling.

### Params:

* **Object** *[data]* data to send with every request.

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



# /lib/client/index.js

## exports.Client

Client constructor.

See: Client

## exports#create([options])

Create client.

See: Client

### Params:

* **Object** *[options]* 

### Return:

* **Client** 



# /lib/server/Adapter.js



# /lib/server/Connection.js



# /lib/server/Message.js

## Message(server)

Message constructor - a higher level way to build and send a message.

### Params:

* **Server** *server* 

## recipients

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

Define data to be send within a message

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



# /lib/server/adapters/Mongo.js

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

## Mongo#get(recipient, since, callback, this)

Get all messages for the recipient, which are deliverable.

### Params:

* **String** *recipient* id

* **Date** *since* which date to consider messages, the oldest message would

* **Function** *callback* 

* **Mongo** *this* 



# /lib/server/Server.js

## Server([options])

Server constructor.

### Params:

* **Object** *[options]* 

## Server.options

Default options, will be overwritten by options passed to the Server.

 - `deliveryTimeout` Message is not delivered if confirmation was not received during this time
 - `keepAlive` amount of ms to keep connection open. (Heroku requires this value to be less than 30s.)
 - `disconnectedAfter` amount of ms after which client counts as disconnected
 - `multiplexDuration` amount of ms messages will be collected before send

## Server#open(params)

Client has opened a connection.

Params object:

 - `user` user id
 - `client` client id of the user (one user can have multiple clients)
 - `delivered` optional delivered messages ids array

### Params:

* **Object** *params* 

### Return:

* **Connection** 

## Server#close(client)

Close connection to one/all clients.

### Params:

* **String|Number** *client* id

### Return:

* **Server** this

## Server#destroy()

Destroy the server.

### Return:

* **Server** this

## Server#message()

Create a message.

### Return:

* **Message** 

## Server#connected(callback)

Get connected users.

### Params:

* **Function** *callback* 

### Return:

* **Server** this

## Server#send(recipients, data, [callback])

Send a message to recipient(s). If all recipients receive and confirm the
message, second callback parameter will be true.

Recommended to use a Server#message which is a higher level to send a message.

### Params:

* **String|Number|Array** *recipients* one or multiple recipients

* **Object** *data* to send

* **Function** *[callback]* 

### Return:

* **Server** this



# /lib/server/adapters/Memory.js

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

## Memory#get(recipient, since, callback, this)

Get all messages for the recipient, which are deliverable.

### Params:

* **String** *recipient* id

* **Date** *since* which date to consider messages, the oldest message would

* **Function** *callback* 

* **Memory** *this* 



# /lib/server/index.js

## exports.Server

Expose Server constructor.

## exports.Message

Expose Message constructor.

## exports.Connection

Expose Connection constructor.

## exports.Multiplexer

Expose Multiplexer constructor.

## exports.utils

Expose utils.

## exports.adapters

Expose adapters.

## exports#create([opts])

Create a Server instance.

See: exports.Server

### Params:

* **Object** *[opts]* 

### Return:

* **Server** 



# /lib/shared/Multiplexer.js

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



# /lib/shared/utils.js

## exports.isArray

Crossengine detecttion if passed object is an array.

### Params:

* **Object** *obj* 

### Return:

* **Boolean** 

## exports.now

Crossbrowser Date.now.

### Return:

* **Number** 

## exports#each(obj, iterator, [context])

The cornerstone, an `each` implementation, aka `forEach`.
Handles objects with the built-in `forEach`, arrays, and raw objects.
Delegates to **ECMAScript 5**'s native `forEach` if available.

### Params:

* **Object** *obj* 

* **Function** *iterator* 

* **Object** *[context]* 

## exports#has(obj, key)

Shortcut for hasOwnProperty.

### Params:

* **Object** *obj* 

* **String** *key* 

### Return:

* **Boolean** 

## exports#extend(obj)

Extend first passed object by the following.

### Params:

* **Object** *obj* 

## exports#uid()

Generate a unique id.

### Return:

* **Number** 

## exports#noop()

No operation.

