# 66 · troubleshooting.md
_Common issues and solutions for developers and users_

---

## Common Issues & Solutions

### Application Startup Problems

| Issue | Possible Causes | Solution |
|-------|----------------|----------|
| **Blank screen after launch** | JavaScript error, broken build | Check browser console for errors; rebuild with `pnpm build` |
| **"Failed to initialize EventBus"** | Script loading order issue | Ensure bootstrap.ts is imported before any component |
| **"Component failed to render"** | React error boundary triggered | Check for missing props or invalid state |

### File Loading Problems

| Issue | Possible Causes | Solution |
|-------|----------------|----------|
| **"File too large" error** | Exceeds 50 MB limit | Split file or increase `VITE_MAX_FILE_SIZE` |
| **"Invalid JSON" error** | Malformed OTLP payload | Validate JSON structure with a linter |
| **File uploads but no metrics appear** | Missing resourceMetrics or wrong format | Check file follows OTLP ExportMetricsServiceRequest format |
| **"Worker initialization failed"** | Web Worker failed to start | Check for CORS issues if loading from CDN |

### Metrics Display Issues

| Issue | Possible Causes | Solution |
|-------|----------------|----------|
| **Counter reset warnings** | Process restarted between snapshots | Normal if expected, ignore if process did restart |
| **Rate shows as "NaN"** | Division by zero (identical timestamps) | Ensure snapshots have different timestamps |
| **"Unsupported metric type"** | Histogram not yet supported | Convert to Gauge/Sum or wait for v0.3 |
| **No attributes showing** | All attributes at resource level | Check "Resource Attributes" tab in DetailPanel |

### Cardinality Analyzer Issues

| Issue | Possible Causes | Solution |
|-------|----------------|----------|
| **"CardinalityEngine error"** | Out of memory in Worker | Try in-process mode by setting smaller threshold |
| **Simulation doesn't reduce series count** | Interdependent labels | Try dropping multiple related labels together |

### WebSocket Connection Problems

| Issue | Possible Causes | Solution |
|-------|----------------|----------|
| **"Connection refused"** | Server not running or wrong port | Check server logs and endpoint configuration |
| **"Authentication failed"** | Invalid token | Verify token format and permissions |
| **"Connection keeps dropping"** | Network issues or server timeout | Increase heartbeat frequency |
| **Connected but no data flowing** | Protocol mismatch | Ensure server sends proper OTLP format |

## Debugging Techniques

### Event Bus Debugging

Monitor all events by adding this to your browser console:

```javascript
window.addEventListener('load', () => {
  if (window.bus) {
    window.bus.on('*', (type, payload) => {
      console.log(`[EventBus] ${type}`, payload);
    });
  }
});
```

### React Component Debugging

Add React DevTools extension and locate problematic components:

1. Find the component in the React tree
2. Inspect props and state
3. Check render count

### Worker Thread Debugging

Debug Web Workers by adding logging:

```javascript
// In your worker.js
self.addEventListener('error', (e) => {
  console.error('[Worker] Uncaught error:', e.message);
});

// Trace all messages
self.addEventListener('message', (e) => {
  console.log('[Worker] Received:', e.data);
});
```

### Network Debugging

For WebSocket issues:
1. Open DevTools Network tab
2. Filter by "WS"
3. Select the connection to view frames
4. Check for proper message format

## Getting Help

If you can't resolve an issue:

1. Create a GitHub issue with:
   - Error messages from console
   - Steps to reproduce
   - Version information
   - Browser and OS details

2. For urgent issues, contact the maintainers via:
   - Slack channel: #otel-explorer-help
   - Email: support@<org>.com
