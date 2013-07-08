# Map
  - [/components/component-emitter/index.js] (#componentscomponent-emitterindexjs)
  - [/lib/client/Client.js] (#libclientclientjs)
  - [/lib/client/index.js] (#libclientindexjs)
  - [/lib/server/Adapter.js] (#libserveradapterjs)
  - [/lib/server/Connection.js] (#libserverconnectionjs)
  - [/lib/server/Message.js] (#libservermessagejs)
  - [/lib/server/Server.js] (#libserverserverjs)
  - [/lib/server/adapters/Memory.js] (#libserveradaptersmemoryjs)
  - [/lib/server/adapters/Mongo.js] (#libserveradaptersmongojs)
  - [/lib/server/index.js] (#libserverindexjs)
  - [/lib/shared/Multiplexer.js] (#libsharedmultiplexerjs)
  - [/lib/shared/utils.js] (#libsharedutilsjs)

## /components/component-emitter/index.js

### Emitter()

Initialize a new `Emitter`.

### Emitter#on(event, fn)

Listen on the given `event` with `fn`.

#### Params:

* **String** *event* 

* **Function** *fn* 

#### Return:

* **Emitter** 

### Emitter#once(event, fn)

Adds an `event` listener that will be invoked a single
time then automatically removed.

#### Params:

* **String** *event* 

* **Function** *fn* 

#### Return:

* **Emitter** 

Remove the given callback for `event` or all
registered callbacks.

#### Params:

* **String** *event* 

* **Function** *fn* 

#### Return:

* **Emitter** 

### Emitter#emit(event, ...)

Emit `event` with the given args.

#### Params:

* **String** *event* 

* **Mixed** *...* 

#### Return:

* **Emitter** 

### Emitter#listeners(event)

Return array of callbacks for `event`.

#### Params:

* **String** *event* 

#### Return:

* **Array** 

### Emitter#hasListeners(event)

Check if this emitter has `event` handlers.

#### Params:

* **String** *event* 

#### Return:

* **Boolean** 



## /lib/client/Client.js

### Client(options)

Client constructor.
Inherits from Emitter.

See: Emitter

#### Params:

* **Object** *options* 

### Client.options

Default options, will be overwritten by options passed to the constructor.

  - `ajax` required jQuery ajax api (web client only)
  - `url` connection url, default is `/simpleio`
  - `reconnectionDelay` ms amount to wait before to reconnect in case of error,
    will be increased on every further error until maxReconnectionDelay, default is `1000`
  - `maxReconnectionDelay` max ms amount to wait before to reconnect in case of error,
    default is `10000`
  - `multiplexDuration` ms amount for multiplexing messages before emitting,
    default is `500`

### Client#connect([data])

Start polling.

#### Params:

* **Object** *[data]* data to send with every request.

#### Return:

* **Client** this

### Client#disconnect()

Stop polling.

#### Return:

* **Client** this

### Client#send(message, [callback])

Send message to the server.

#### Params:

* **Mixed** *message* message to send.

* **Function** *[callback]* is called when message was send to the server without error.

#### Return:

* **Client** this



## /lib/client/index.js

### exports.Client

Client constructor.

See: Client

### exports#create([options])

Create client.

See: Client

#### Params:

* **Object** *[options]* 

#### Return:

* **Client** 



## /lib/server/Adapter.js

### Adapter()

Adapter interface.
Inherits from `Emitter.
All adapters should inherit from this class.

### Adapter#dispatch(recipient, data, callback)

Dispatch a message.

#### Params:

* **String** *recipient* 

* **Mixed** *data* 

* **Function** *callback* 

#### Return:

* **Adapter** this

### Adapter#open(sender, callback)

A client opened a connection. Save it to determine later if the client is connected.

#### Params:

* **String|Number** *sender* 

* **Function** *callback* 

#### Return:

* **Adapter** this

### Adapter#connected(since, callback)

Get users who opened a connection since x date.

#### Params:

* **Date** *since* the date since user has send messages

* **Function** *callback* 

#### Return:

* **Adapter** this

### Adapter#get(recipient, since, callback)

Get all messages for the recipient, which are deliverable.

#### Params:

* **String** *recipient* id

* **Date** *since* which date to consider messages, the oldest message would

* **Function** *callback* 

#### Return:

* **Adapter** this

### Adapter#delivery(opts, callback)

Mark message status as deliverable, save clients who has got the message.

Options
  - `deliverable` boolean, message is undeliverable if false
  - `delivered` boolean, true if some client got a message
  - `client` client id which got a message
  - `public` boolean, true if delivered event needs to be published on the storage

#### Params:

* **Object** *opts* 

* **Function** *callback* 

#### Return:

* **Adapter** this

### Adapter#destroy()

Destroy the adapter.
Remove all event listeners, close connections to the storage etc.

#### Return:

* **Adapter** this



## /lib/server/Connection.js

### Connection(params, server, adapter)

Incomming connection.
Inherits from `Emitter`.

#### Params:

* **Object** *params* 

* **Server** *server* 

* **Adapter** *adapter* 

### Connection#open()

Open a connection.

#### Return:

* **Connection** this

### Connection#close([status])

Close a connection.

#### Params:

* **String** *[status]* message

#### Return:

* **Connection** this



## /lib/server/Message.js

### Message(server)

Message constructor - a higher level way to build and send a message.

#### Params:

* **Server** *server* 

### recipients

Define recipients.

#### Params:

* **Array|String|Number** *recipients* you can pass multiple recipients using

#### Return:

* **Message** this

### Message#event(event)

Define an event name. If no event defined, the message can be subscribed
on the client using &quot;message&quot; event.

#### Params:

* **String** *event* 

#### Return:

* **Message** this

### Message#data(data)

Define data to be send within a message

#### Params:

* **Mixed** *data* 

#### Return:

* **Message** this

### Message#send(callback)

Send the message. Message is sent successful if every recipient has confirmed
the delivery. Callback is called with &quot;true&quot; as second parameter if succeeded.

#### Params:

* **Function** *callback* 

#### Return:

* **Message** this

### Message#broadcast(callback)

Broadcast a message. There is no delivery confirmation. Callback is called
after the message is stored.

#### Params:

* **Function** *callback* 

#### Return:

* **Message** this



## /lib/server/Server.js

### Server([options])

Server constructor.
Inherits from `Emitter`.

#### Params:

* **Object** *[options]* 

### Server.options

Default options, will be overwritten by options passed to the Server.

 - `deliveryTimeout` Message is not delivered if confirmation was not received
   during this time, default is `40000`
 - `keepAlive` amount of ms to keep connection open. (Heroku requires this
   value to be less than 30s.), default is `25000`
 - `disconnectedAfter` amount of ms after which client counts as disconnected,
   default is `40000`
 - `multiplexDuration` amount of ms messages will be collected before send,
   default is `500`

### Server#open(params)

Client has opened a connection.

Params object:

 - `user` user id
 - `client` client id of the user (one user can have multiple clients)
 - `delivered` optional delivered messages ids array

#### Params:

* **Object** *params* 

#### Return:

* **Connection** 

### Server#close(client)

Close connection to one/all clients.

#### Params:

* **String|Number** *client* id

#### Return:

* **Server** this

### Server#destroy()

Destroy the server.

#### Return:

* **Server** this

### Server#message()

Create a message.

#### Return:

* **Message** 

### Server#connected(callback)

Get connected users.

#### Params:

* **Function** *callback* 

#### Return:

* **Server** this

### Server#send(recipients, data, [callback])

Send a message to recipient(s). If all recipients receive and confirm the
message, second callback parameter will be true.

Recommended to use a Server#message which is a higher level to send a message.

#### Params:

* **String|Number|Array** *recipients* one or multiple recipients

* **Object** *data* to send

* **Function** *[callback]* 

#### Return:

* **Server** this



## /lib/server/adapters/Memory.js

### Memory(opts)

Memory adapter constructor.
Inherits from `Adapter`.

#### Params:

* **Object** *opts* will overwrite default options, see `Memory.options`

### Memory.options

Default options.

  - `maxAge` message lifetime
  - `cleanupInterval` interval when to cleanup the cache
  - `cleanup` true if cache should be periodically cleaned up

### Memory#dispatch()

@see Adapter#dispatch

### Memory#open()

@see Adapter#open

### Memory#connected()

@see Adapter#connected

### Memory#get()

@see Adapter#get

### Memory#delivery()

@see Adapter#delivery

### Memory#destroy()

@see Adapter#destroy



## /lib/server/adapters/Mongo.js

### Mongo(uri, opts)

Mongo adapter constructor.

#### Params:

* **String|Object** *uri* or Db instance from mongo driver.

* **Object** *opts* will overwrite defaults, see `Mongo.options`

### Mongo.options

Mongo adapter defaults.
Inherits from `Adapter`.

  - `uri` mongo uri
  - `db` mongo options
  - `name` collection name, mubsub channel name
  - `channel` mubsub channel options
  - `maxClients` max amount of clients per recipient. Needed to reserve space
    in docs, because capped collections can't grow.
  - `stringify` function for data serialization, defaults to JSON.stringify
  - `parse` function for data deserialization, defaults to JSON.parse

### Mongo#dispatch()

@see Adapter#dispatch

### Mongo#open()

@see Adapter#open

### Mongo#connected()

@see Adapter#connected

### Mongo#get()

@see Adapter#get

### Mongo#delivery()

@see Adapter#delivery

### Mongo#destroy()

@see Adapter#destroy



## /lib/server/index.js

### exports.Server

Expose Server constructor.

### exports.Message

Expose Message constructor.

### exports.Connection

Expose Connection constructor.

### exports.Multiplexer

Expose Multiplexer constructor.

### exports.utils

Expose utils.

### exports.adapters

Expose adapters.

### exports#create([opts])

Create a Server instance.

See: exports.Server

#### Params:

* **Object** *[opts]* 

#### Return:

* **Server** 



## /lib/shared/Multiplexer.js

### Multiplexer(opts)

Multiplexer constructor.
Inherits from `Emitter`.

#### Params:

* **Object** *opts* 

### Multiplexer#add(messages)

Add message(s).

#### Params:

* **Mixed** *messages* 

#### Return:

* **Multiplexer** this

### Multiplexer#reset([emit])

Reset multiplexer, emit &quot;reset&quot; if there are messages.

#### Params:

* **Boolean** *[emit]* only emit &quot;reset&quot; if true.

#### Return:

* **Multiplexer** this

### Multiplexer#get()

Get messages.

#### Return:

* **Array** 

### Multiplexer#stop()

Stop multiplexer

#### Return:

* **Multiplexer** this



## /lib/shared/utils.js

### exports.isArray

Crossengine detecttion if passed object is an array.

#### Params:

* **Object** *obj* 

#### Return:

* **Boolean** 

### exports.now

Crossbrowser Date.now.

#### Return:

* **Number** 

### exports#each(obj, iterator, [context])

The cornerstone, an `each` implementation, aka `forEach`.
Handles objects with the built-in `forEach`, arrays, and raw objects.
Delegates to **ECMAScript 5**'s native `forEach` if available.

#### Params:

* **Object** *obj* 

* **Function** *iterator* 

* **Object** *[context]* 

### exports#has(obj, key)

Shortcut for hasOwnProperty.

#### Params:

* **Object** *obj* 

* **String** *key* 

#### Return:

* **Boolean** 

### exports#extend(obj)

Extend first passed object by the following.

#### Params:

* **Object** *obj* 

### exports#uid()

Generate a unique id.

#### Return:

* **Number** 

### exports#noop()

No operation.

