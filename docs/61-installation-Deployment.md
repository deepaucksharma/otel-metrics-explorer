# 61 · installation-Deployment.md
_Guide for installing, configuring, and deploying the application_

---

## Development Setup

### Prerequisites

- Node.js >= 16.x
- pnpm >= 7.x
- Git

### Local Development

```bash
# Clone the repository
git clone https://github.com/<org>/otel-metrics-explorer
cd otel-metrics-explorer

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The app will be available at `http://localhost:5173`

Test with sample data by dragging any file from `example-payloads/` into the app.

## Production Deployment

### Option 1: Docker Deployment

```bash
# Build the Docker image
docker build -t otel-metrics-explorer:latest .

# Run the container
docker run -p 8080:80 otel-metrics-explorer:latest
```

### Option 2: Static Site Deployment

```bash
# Build the application
pnpm build

# The 'dist' directory can be deployed to any static file server
```

Compatible with:
- Netlify
- Vercel
- AWS S3 + CloudFront
- GitHub Pages
- Any static file server

### Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `VITE_WS_URL` | WebSocket endpoint for live mode | `ws://localhost:4317/v1/metrics/ws` |
| `VITE_MAX_FILE_SIZE` | Maximum file size in bytes | `50000000` (50 MB) |

## Integration with OTel Collector

### Sample Collector Configuration

```yaml
receivers:
  otlp:
    protocols:
      http:
        endpoint: 0.0.0.0:4318
      grpc:
        endpoint: 0.0.0.0:4317

exporters:
  otlphttp:
    endpoint: http://localhost:5173/api/v1/metrics
    tls:
      insecure: true
  
  websocket:
    endpoint: ws://localhost:5173/api/v1/metrics/ws
    tls:
      insecure: true

service:
  pipelines:
    metrics:
      receivers: [otlp]
      exporters: [otlphttp, websocket]
```

## Monitoring & Logging

The application outputs structured logs to console which can be captured by container orchestration platforms.

Configure log level with `VITE_LOG_LEVEL` environment variable:
- `debug` - Verbose output for development
- `info` - Regular operations (default)
- `warn` - Only warnings and errors
- `error` - Only errors

Health check endpoint: `/api/health` returns 200 OK when service is operational.
