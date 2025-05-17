# 63 · api-Reference.md
_Public APIs for integration with other systems_

---

## REST API

The Explorer provides HTTP endpoints for programmatic integration.

### Authentication

All API requests require an API key provided in the `Authorization` header:

```
Authorization: Bearer <your-api-key>
```

API keys can be configured via the `VITE_API_KEYS` environment variable.

### Endpoints

#### `POST /api/v1/snapshots`

Upload a new OTLP snapshot for analysis.

**Request Body**: Raw JSON ExportMetricsServiceRequest
**Content-Type**: `application/json`

**Response**:
```json
{
  "id": "snap_123abc",
  "timestamp": "2025-06-15T14:32:10Z",
  "metrics": 42,
  "series": 1250
}
```

**Status Codes**:
- `201 Created` - Snapshot uploaded successfully
- `400 Bad Request` - Invalid JSON format
- `413 Payload Too Large` - Snapshot exceeds size limit

#### `GET /api/v1/snapshots/:id`

Retrieve a previously uploaded snapshot.

**Parameters**:
- `id` - Snapshot ID from upload response

**Response**: JSON ExportMetricsServiceRequest

**Status Codes**:
- `200 OK` - Snapshot retrieved successfully
- `404 Not Found` - Snapshot not found

#### `POST /api/v1/analyze`

Perform analysis on a snapshot without uploading.

**Request Body**:
```json
{
  "snapshot": "<base64-encoded-snapshot>",
  "options": {
    "includeCardinality": true,
    "includeDiff": false
  }
}
```

**Response**:
```json
{
  "totalSeries": 1250,
  "metrics": [
    {
      "name": "process.cpu.time",
      "series": 320,
      "attributes": [
        {"key": "process.pid", "uniqueValues": 32},
        {"key": "state", "uniqueValues": 2}
      ]
    }
  ]
}
```

#### `POST /api/v1/config/generate`

Generate OTel Collector configuration for label dropping.

**Request Body**:
```json
{
  "plans": [
    {
      "metricName": "process.cpu.time",
      "labelsToDrop": ["process.command_line"]
    }
  ],
  "excludes": ["process.thread.count"]
}
```

**Response**:
```json
{
  "yaml": "processors:\n  attributes/drop_process_cpu_time:\n    include_metrics..."
}
```

## WebSocket API

### Connect

Connect to the WebSocket endpoint:

```
ws://your-server/api/v1/metrics/ws
```

Query parameters:
- `token` - Authentication token (required)
- `interval` - Streaming interval in milliseconds (optional, default: 1000)

### Protocol

**Client to Server**:
- `{"command": "start"}` - Begin streaming
- `{"command": "stop"}` - Stop streaming
- `{"command": "ping"}` - Heartbeat check

**Server to Client**:
- `{"type": "metrics", "payload": {...}}` - OTLP payload
- `{"type": "status", "connected": true}` - Connection status
- `{"type": "error", "message": "..."}` - Error notification

### Disconnect

To disconnect, send a close frame with code 1000.

## JavaScript SDK

The Explorer can be embedded in other applications using our JavaScript SDK:

```javascript
import { OtelExplorerClient } from '@otel/explorer-sdk';

const explorer = new OtelExplorerClient({
  apiKey: 'your-api-key',
  endpoint: 'https://your-explorer-instance'
});

// Upload a snapshot
const result = await explorer.uploadSnapshot(jsonData);

// Generate config
const yaml = await explorer.generateConfig({
  plans: [{
    metricName: 'process.cpu.time',
    labelsToDrop: ['process.command_line']
  }]
});

// Connect to WebSocket for live updates
explorer.connectLive({
  onMetrics: (data) => console.log('New metrics:', data),
  interval: 2000
});
```

See the [SDK repository](https://github.com/<org>/otel-explorer-sdk) for full documentation.
