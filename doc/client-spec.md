## Description

1. Client should implement http long polling.
1. Client should remain open request until its closed by the server.
1. Server will respond in this cases:
    1. There are new messages for the client.
    1. Timeout defined on the server is occurred, client should reconnect.
1. If client has messages to send, it should create a new request, if there is already an open request - it should remain open.
1. HTTP "GET" method can be used if there are no `delivered` and `messages` to send, otherwise "POST" should be used.
1. If client gets a successful response (status code 200), it should reconnect immediately.
1. If client gets an error (anything else than status code 200), it should reconnect using incremental delay.
    1. Client should increment the delay until `maxReconnectionDelay` is reached.
    1. Client should reconnect endless amount of times even if `maxReconnectionDelay` is reached.
1. To minimize reconnects amount, client should multiplex messages.
1. When client gets new messages, it should send a delivery confirmation immediately.
1. Client should implement public options and methods defined in [api.md](./api.md).

## REST API

- Read URI template spec http://tools.ietf.org/html/rfc6570
- Read JSON schema spec http://json-schema.org

```javascript
POST /simpleio
{
    "type": "object",
    "properties": {
        "client": {
            "type": "number",
            "required": true,
            "description": "Client id randomly generated which should be unique."
        },
        "delivered": {
            type: "array",
            "items": {"type": "string"},
            "description": "Message ids of received messages."
        },
        "messages": {
            type: "array",
            "items": {"type": "any"},
            "description": "Array of messages which can contain elements of any type."
        }
    }
}
< 200
< Content-Type: application/json
{
    "type": "object",
    "properties": {
        "messages": {
            "type": "array",
            "items": {
                "id": {
                    "type": "string",
                    "required": true
                },
                "date": {
                    "type": "string",
                    "required": true
                },
                "data": {
                    "type": "object",
                    "required": true,
                    "properties": {
                        "event": {"type": "string"},
                        "data": {"type": "any"}
                    }
                }
            }
        },
        "status": {
            "enum": ["polling timeout", "new messages"],
            "description": "Status message is for debugging only."
        }
    }
}
```
