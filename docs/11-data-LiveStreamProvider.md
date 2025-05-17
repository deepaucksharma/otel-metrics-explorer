# Live Stream Provider

## Overview

The Live Stream Provider enables the OTLP Process Metrics Explorer to connect to live sources of OTLP metrics data. While the initial version of the application focuses on static file analysis, this component is designed to support future enhancements for real-time monitoring and analysis.

## Responsibilities

1. Establish connections to various OTLP data sources (HTTP endpoints, gRPC streams, etc.)
2. Handle authentication and connection management
3. Parse incoming data streams into the internal data model
4. Create periodic snapshots for analysis and comparison
5. Emit events when new data is available
6. Provide controls for stream management (pause, resume, disconnect)

## Public Interface

```typescript
interface LiveStreamProvider {
  // Connect to a HTTP endpoint that delivers OTLP metrics
  connectToHttpEndpoint(url: string, options?: HttpConnectionOptions): Promise<string>; // Returns connection ID
  
  // Connect to a gRPC endpoint (future enhancement)
  connectToGrpcEndpoint(url: string, options?: GrpcConnectionOptions): Promise<string>; // Returns connection ID
  
  // Get a list of active connections
  getActiveConnections(): ConnectionReference[];
  
  // Pause data ingestion for a specific connection
  pauseConnection(connectionId: string): boolean;
  
  // Resume data ingestion for a specific connection
  resumeConnection(connectionId: string): boolean;
  
  // Disconnect from a specific endpoint
  disconnect(connectionId: string): boolean;
  
  // Disconnect from all endpoints
  disconnectAll(): void;
  
  // Take a snapshot of the current data
  takeSnapshot(connectionId: string, label?: string): Promise<string>; // Returns snapshot ID
  
  // Configure automatic snapshot creation
  configureAutoSnapshot(connectionId: string, options: AutoSnapshotOptions): void;
}

interface HttpConnectionOptions {
  method?: 'GET' | 'POST'; // Default: 'GET'
  headers?: Record<string, string>;
  pollingIntervalMs?: number; // For polling endpoints, default: 10000
  authType?: 'none' | 'basic' | 'bearer' | 'custom';
  authCredentials?: AuthCredentials;
  formatType?: 'json' | 'protobuf';
}

interface GrpcConnectionOptions {
  // To be defined in future versions
}

interface ConnectionReference {
  id: string;
  label: string;
  sourceType: 'http' | 'grpc';
  url: string;
  status: 'connecting' | 'active' | 'paused' | 'error' | 'disconnected';
  connectionTime: number;
  lastDataReceived?: number;
  error?: string;
  snapshotCount: number;
  autoSnapshotEnabled: boolean;
}

interface AutoSnapshotOptions {
  enabled: boolean;
  intervalMs: number; // Default: 60000 (1 minute)
  maxSnapshots: number; // Default: 10
  rotateOldest: boolean; // Default: true
  labelTemplate: string; // Default: 'Auto {timestamp}'
}

interface AuthCredentials {
  // Varies based on authType
  username?: string;
  password?: string;
  token?: string;
  customHeaderName?: string;
  customHeaderValue?: string;
}
```

## Event Emissions

The Live Stream Provider emits the following events on the global event bus:

- `connection.connecting`: When attempting to connect to an endpoint
- `connection.established`: When a connection is successfully established
- `connection.error`: When there's an error with a connection
- `connection.paused`: When a connection is paused
- `connection.resumed`: When a connection is resumed
- `connection.disconnected`: When a connection is disconnected
- `data.received`: When new data is received from a connection
- `snapshot.created`: When an automatic or manual snapshot is created

## Implementation Details

### Connection Process

1. When a connection is requested, the provider validates the URL and options
2. It establishes the appropriate connection based on the endpoint type
3. For HTTP endpoints, it sets up polling or streaming based on the server capabilities
4. For gRPC endpoints (future), it establishes a bidirectional stream
5. Incoming data is parsed and transformed into the internal data model
6. Data is stored in a rolling buffer to support snapshot creation

### Snapshot Creation

1. Snapshots can be created manually or automatically based on configuration
2. When created, the current state of the data is copied and processed
3. The snapshot is registered with the SnapshotRegistry
4. A reference to the snapshot is returned or published via an event

### Error Handling

- Connection failures: Retries with exponential backoff, emits error events
- Data parsing errors: Logs errors, attempts to continue processing
- Authentication failures: Provides detailed error information, prompts for credentials

### Performance Considerations

- Streaming data is processed incrementally to avoid memory issues
- Data is buffered efficiently to support snapshot creation without duplication
- Resource-intensive processing is delegated to Web Workers

## Dependencies

- OtlpJsonParser: For converting streaming data to the internal data model
- OtlpProtobufParser: For handling binary protobuf data (future enhancement)
- SnapshotRegistry: For registering and managing snapshots
- EventBus: For emitting events
- AuthManager: For handling authentication credentials securely

## Configuration Options

The Live Stream Provider accepts the following global configuration options:

```typescript
interface LiveStreamProviderConfig {
  maxConnections: number; // Default: 5
  defaultPollingIntervalMs: number; // Default: 10000
  connectionTimeoutMs: number; // Default: 30000
  maxBufferSize: number; // Default: 100 (data points per metric)
  workerEnabled: boolean; // Default: true
  autoReconnect: boolean; // Default: true
  autoReconnectMaxAttempts: number; // Default: 5
}
```

## Usage Example

```typescript
const streamProvider = new LiveStreamProvider();

// Connect to a HTTP endpoint
connectButton.addEventListener('click', async () => {
  const url = endpointUrlInput.value;
  try {
    const connectionId = await streamProvider.connectToHttpEndpoint(url, {
      pollingIntervalMs: 5000,
      authType: 'bearer',
      authCredentials: {
        token: authTokenInput.value
      }
    });
    console.log(`Connected to endpoint: ${connectionId}`);
    
    // Configure automatic snapshots
    streamProvider.configureAutoSnapshot(connectionId, {
      enabled: true,
      intervalMs: 60000,
      maxSnapshots: 5,
      rotateOldest: true
    });
  } catch (error) {
    console.error('Failed to connect:', error);
  }
});

// Take a manual snapshot
snapshotButton.addEventListener('click', async () => {
  const connectionId = activeConnectionSelect.value;
  try {
    const snapshotId = await streamProvider.takeSnapshot(connectionId, 'Manual Snapshot');
    console.log(`Created snapshot: ${snapshotId}`);
  } catch (error) {
    console.error('Failed to create snapshot:', error);
  }
});
```

The Live Stream Provider is designed to be implemented in future versions of the OTLP Process Metrics Explorer, building on the foundation established by the Static File Provider.
