# 62 · user-Guide.md
_How to use the OTLP Process Metrics Explorer effectively_

---

## Getting Started

OTLP Process Metrics Explorer is a web-based workbench for analyzing OpenTelemetry process metrics. It helps you understand metric shape, label cardinality, and downstream cost before your data hits Prometheus or other storage backends.

## Core Workflows

### 1. Loading Metric Data

You have two options for loading data:

**Static Snapshot Analysis**:
1. Click "Load Snapshot A" in the sidebar
2. Select an OTLP JSON file from your computer
3. (Optional) Load a second snapshot as "B" to enable diff/rate analysis

**Live Streaming** (if supported by your deployment):
1. Click the connection icon in the toolbar
2. Enter WebSocket URL if not pre-configured
3. Click "Connect" to begin streaming real-time metrics

### 2. Metrics Exploration

Once data is loaded:

1. Use the sidebar to browse available metrics
2. The search box helps filter metrics by name
3. Click any metric to show it in the main view
4. Metrics appear as cards in two forms:
   - **Gauge Cards** for point-in-time values
   - **Rate/Delta Cards** for cumulative counters

**Understanding Cards**:
- Gauge cards show the current value with units
- Rate cards show change-per-second with a delta badge
- Attribute breakdown appears as bar segments when applicable
- Click any card to open a detailed inspection panel

### 3. Cardinality Analysis

1. Switch to "Cardinality Analyzer" mode using the toggle in the sidebar
2. View all metrics sorted by series count
3. Red/yellow heat indicators show high-cardinality metrics
4. Click any metric to open the "What-If" simulator

**What-If Label Drop Simulation**:
1. Check boxes next to labels you want to remove
2. See immediate impact on series count
3. RAM and storage estimates update automatically
4. Use the treemap to visualize label distribution

### 4. Configuration Export

After identifying high-cardinality labels to drop:

1. Use the "What-If" simulator to select labels to drop
2. Click "Generate Config" to create YAML
3. Copy the YAML to clipboard or download as a file
4. Add to your OTel Collector configuration under `processors:`
5. Reference the processor in your metrics pipeline

## Advanced Features

### Delta vs. Rate Analysis

When both snapshots A and B are loaded:
- **Delta** shows the absolute change between snapshots
- **Rate** shows change per second (delta ÷ time interval)
- Counter resets are detected and flagged with a warning icon

### Resource Filtering

Use the resource dropdown to focus on specific process instances when multiple resources are present in the snapshot.

### Raw JSON Inspection

In the detail panel:
1. Click the "Raw JSON" tab
2. Explore the complete OTLP structure
3. Use the copy button to extract snippets

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Cmd/Ctrl + K` | Focus search box |
| `Esc` | Close panels |
| `?` | Open help dialog |
| `Cmd/Ctrl + C` | Copy (in modal) |
| `Cmd/Ctrl + S` | Save configuration |

## Troubleshooting

### Common Issues

**File Too Large Error**:
- Maximum file size is typically 50MB
- Split larger exports or adjust `VITE_MAX_FILE_SIZE` environment variable

**Cannot Parse JSON**:
- Ensure file is a valid OTLP ExportMetricsServiceRequest JSON
- Check sample payloads in repository for correct format

**Metrics Not Showing**:
- Verify file contains ResourceMetrics
- Check for empty dataPoints arrays

**Counter Reset Warnings**:
- Normal if process restarted between snapshots
- Check process uptime in metrics or logs
