# OTLP Process Metrics Explorer

A web-based workbench for **schema-aware, cost-aware, label-safe** inspection of
OpenTelemetry process metrics.

| Key Value                      | Notes                                                                           |
|--------------------------------|---------------------------------------------------------------------------------|
| **Purpose**                    | Help SREs, developers, and observability engineers understand metric shape,     |
|                                | label cardinality, and downstream cost _before_ the data hits Prometheus / Mimir|
| **Core Philosophy**            | 1. Deep Interactive Context  2. Streamlined Investigation Flows                 |
|                                | 3. Enhanced Temporal Awareness  4. Proactive Insights                           |
| **Tech Stack (initial)**       | React 18 · Vite · Zustand · ECharts · Mitt event-bus · Web Workers              |
| **Primary Data Source (v0.1)** | Static OTLP JSON ExportMetricsServiceRequest snapshots                          |
| **Future Sources**             | OTLP/HTTP polling • WebSocket streaming • gRPC->WS bridge                       |

## The Ultimate Metric Instance Widget 3.1

At the heart of our application is the **Ultimate Metric Instance Widget 3.1** — a hyper-focused OTLP metric observatory that combines:

1. **Enhanced Snapshot Timeline**: Clear temporal navigation with explicit A/B roles and time deltas
2. **Schema+ View & Inline Help**: OTLP schema properties with contextual tooltips 
3. **Rich Dimensional Explorer**: Hierarchical view of attributes with heat maps and change indicators
4. **Detail Pane Superpowers**: Mini-trends, contribution stats, exemplars, and humanized views
5. **Cardinality & Stability Insights**: Attribute stability analysis and whatif simulation
6. **Contextual Actions**: Deeply contextual jumps and metric-specific actions

This approach provides unprecedented insight into your metrics, enabling rapid diagnosis and understanding of behavior with exceptional clarity.

## What You'll Find in /docs

| File # | Title                            | Why you need it                              |
|--------|----------------------------------|----------------------------------------------|
| 01     | Architecture Principles          | Tenets that every PR must respect            |
| 02     | Dependency Graph                 | Single-page overview of allowed import flow  |
| 03     | Data Contracts                   | TypeScript interfaces shared across layers   |
| 10–15  | *data-*.md                       | Pluggable data-provider micro-services       |
| 20–25  | *logic-*.md                      | Pure-logic/worker modules for analysis       |
| 30–39  | *ui-*.md                         | React components, each a self-contained unit |
| 40–42  | Event Bus & Store Slices         | Messaging and state isolation                |
| 50–55  | Samples, Tests, Performance      | Operational guides                           |
| 60–69  | Project Structure & Deployment   | Environment and installation guides          |
| 70–79  | ADRs & Implementation Plans      | Architecture decisions and roadmap           |
| 80–89  | Core Widget Components           | Documentation for main UI components         |

---

## Quick Start (dev)

```bash
pnpm i
pnpm dev        # launches Vite + Mock StaticFileProvider
Drag a sample payload from example-payloads/.

Explore metrics with enhanced UI.

View attribute stability report.

Generate YAML → copy into your OTel Collector.
```