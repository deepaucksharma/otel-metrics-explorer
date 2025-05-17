# Static File Provider

## Overview

The Static File Provider is responsible for loading OTLP metrics data from static JSON files or text input. It serves as the primary data ingestion method for the initial version of the OTLP Process Metrics Explorer.

## Responsibilities

1. Accept JSON file uploads from users
2. Handle direct JSON text input via a text area
3. Validate the input data against the OTLP schema
4. Parse and normalize the data into the internal data model
5. Emit events when new data is available
6. Maintain references to previously loaded snapshots

## Public Interface

```typescript
interface StaticFileProvider {
  // Load OTLP data from a File object
  loadFromFile(file: File): Promise<string>; // Returns snapshot ID
  
  // Load OTLP data from a string
  loadFromText(jsonText: string, label?: string): Promise<string>; // Returns snapshot ID
  
  // Get a list of available snapshots
  getAvailableSnapshots(): SnapshotReference[];
  
  // Remove a previously loaded snapshot
  removeSnapshot(snapshotId: string): boolean;
  
  // Clear all loaded snapshots
  clearAllSnapshots(): void;
}

interface SnapshotReference {
  id: string;
  label: string;
  timestamp: number;
  source: 'file' | 'text';
  fileName?: string;
  metricCount: number;
  fileSize?: number;
}
```

## Event Emissions

The Static File Provider emits the following events on the global event bus:

- `snapshot.loading`: When a new file/text starts loading
- `snapshot.loaded`: When a snapshot has been successfully loaded
- `snapshot.error`: When there's an error loading a snapshot
- `snapshot.removed`: When a snapshot has been removed
- `snapshots.cleared`: When all snapshots have been cleared

## Implementation Details

### File Loading Process

1. When a file is loaded, it's read as text using the FileReader API
2. The text is parsed as JSON and validated against the OTLP schema
3. If valid, the data is passed to the OtlpJsonParser for processing
4. The parsed snapshot is stored in memory and registered with the SnapshotRegistry
5. A snapshot reference is created and returned to the caller

### Text Input Process

1. The provided text is parsed as JSON and validated
2. The same processing steps are followed as with file loading
3. A default label is generated if none is provided

### Error Handling

- Invalid JSON format: Emits `snapshot.error` with a descriptive message
- Invalid OTLP schema: Provides detailed validation errors in the event payload
- File read errors: Captures and reports the specific error type

### Performance Considerations

- For large files (>10MB), processing is delegated to a Web Worker
- A loading indicator is displayed during processing
- Partial results may be streamed for very large datasets

## Dependencies

- OtlpJsonParser: For converting raw JSON to the internal data model
- SnapshotRegistry: For registering and managing snapshots
- EventBus: For emitting events
- SchemaValidator: For validating input data against the OTLP schema

## Configuration Options

The Static File Provider accepts the following configuration options:

```typescript
interface StaticFileProviderConfig {
  maxFileSizeMB: number; // Default: 50
  workerEnabled: boolean; // Default: true
  workerThresholdMB: number; // Default: 10
  validateSchema: boolean; // Default: true
  allowPartialResults: boolean; // Default: false
}
```

## Usage Example

```typescript
const fileProvider = new StaticFileProvider();

// From file upload
inputElement.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  try {
    const snapshotId = await fileProvider.loadFromFile(file);
    console.log(`Loaded snapshot: ${snapshotId}`);
  } catch (error) {
    console.error('Failed to load file:', error);
  }
});

// From text input
submitButton.addEventListener('click', async () => {
  const jsonText = textAreaElement.value;
  try {
    const snapshotId = await fileProvider.loadFromText(jsonText, 'Manual Input');
    console.log(`Loaded snapshot: ${snapshotId}`);
  } catch (error) {
    console.error('Failed to parse JSON:', error);
  }
});
```

This component provides the foundation for data ingestion in the initial version of the OTLP Process Metrics Explorer, with a focus on static file analysis.
