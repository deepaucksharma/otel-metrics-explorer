# 65 · error-Handling.md
_Core error handling strategy across all layers_

---

## Error Flow Architecture

```
                                ┌─────────────────┐
                                │ ui-ToastCenter  │
                                └────────▲────────┘
                                         │
┌─────────────┐  error event  ┌─────────┴────────┐
│ Any Component├──────────────►│     EventBus     │
└─────────────┘               │  (data.error)    │
                              └─────────┬────────┘
                                        │
                                        ▼
                              ┌─────────────────┐
                              │   Error Logger  │
                              └─────────────────┘
```

## Error Categories

| Category | Description | Example | Handling Strategy |
|----------|-------------|---------|-------------------|
| **Parsing** | Data format issues | Invalid JSON | Show error toast, highlight file |
| **Network** | Connection failures | WebSocket disconnect | Auto-retry with backoff |
| **Resource** | System limitations | Out of memory | Clear state, suggest smaller files |
| **Logic** | Algorithm failures | Counter reset issues | Flag in UI, continue processing |
| **Rendering** | UI failures | Component crash | Error boundary with reset option |

## EventBus Error Protocol

All errors are published on the EventBus with a consistent format:

```ts
bus.emit('data.error', {
  message: string;       // Human-readable message
  code?: string;         // Error code (e.g., 'PARSER_ERROR')
  detail?: any;          // Technical details (dev mode only)
  recoverable?: boolean; // Can the user take action?
  action?: {             // Optional recovery action
    label: string;       // Button text
    handler: () => void; // Action to perform
  }
});
```

## Layer-Specific Error Handling

### Data Provider Layer

- File size checks before reading
- Try/catch around file operations
- Network timeouts for WS connections
- HTTP status code handling

Example:
```ts
try {
  if (file.size > MAX_SIZE) {
    bus.emit('data.error', {
      message: 'File exceeds maximum size',
      code: 'FILE_TOO_LARGE',
      detail: `${file.size} > ${MAX_SIZE} bytes`,
      recoverable: true,
      action: {
        label: 'Select smaller file',
        handler: () => fileInput.click()
      }
    });
    return;
  }
  // Process file...
} catch (err) {
  bus.emit('data.error', {
    message: 'Failed to read file',
    code: 'FILE_READ_ERROR',
    detail: err
  });
}
```

### Logic Layer

- Input validation before processing
- Worker error propagation
- Algorithm edge case handling

### UI Layer

- React error boundaries around each major component
- Form validation before submission
- Render guards for missing data

Example:
```tsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  componentDidCatch(error, info) {
    bus.emit('data.error', {
      message: 'UI rendering error',
      code: 'UI_CRASH',
      detail: { error, info }
    });
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReset={() => this.setState({ hasError: false })} />;
    }
    return this.props.children;
  }
}
```

## Common Error Codes

| Code | Meaning | Resolution |
|------|---------|------------|
| `FILE_TOO_LARGE` | File exceeds size limit | Split file or increase limit |
| `JSON_PARSE_ERROR` | Invalid JSON structure | Validate file format |
| `NO_RESOURCE_METRICS` | Missing required OTLP structure | Check file has resourceMetrics array |
| `WORKER_INIT_FAILED` | Web Worker failed to start | Check CORS or try disabling workers |
| `WS_CONNECT_FAILED` | WebSocket connection failed | Check network/firewall |
| `WS_AUTH_FAILED` | WebSocket authentication failed | Verify token |
| `PARSER_WORKER_OFFLINE` | Worker crashed | Reload application |
| `CARDINALITY_OUT_OF_MEMORY` | Memory limit exceeded | Process smaller dataset |
