## Description

1. Client should implement http log polling.
1. Request will remain open unless
    1. There is a new messages for the client.
    1. Client has new messages for the server.
    1. Timeout defined on the server is occurred.
1. GET can be used if there are no `delivered` and `messages` to send, otherwise POST.
1. If client gets a successful response, it should reconnect immediately.
1. If client gets an error, it should start reconnect using incremental delay. Client should increment the delay until `maxReconnectionDelay` is reached.

## REST API

See json schema http://json-schema.org

```javascript
POST /simpleio
{
    "type": "object",
    "properties": {
        "client": {
            "type": "number",
            "required": true
        },
        "delivered": {
            type: "array",
            "items": {"type": "string"}
        },
        "messages": {
            type: "array",
            "items": {"type": "any"}
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
            "enum": ["polling timeout", "new messages"]
        }
    }
}
```
