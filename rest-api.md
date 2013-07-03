## REST API

See json schema http://json-schema.org

All requests will remain open connection until there is a new data available for the client or timeout defined on the server is occurred.

GET can be used if there are no `delivered` and `messages` to send.

If client gets a successfull response, it should reconnect immediately.
If client gets an error, it should start reconnect using incremental delay. Client should increment the delay until `maxReconnectionDelay` is reached.

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
