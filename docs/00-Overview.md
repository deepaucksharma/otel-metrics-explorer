# OTLP Process Metrics Explorer

A web-based workbench for **schema-aware, cost-aware, label-safe** inspection of
OpenTelemetry process metrics.

| Key Value                      | Notes                                                                           |
|--------------------------------|---------------------------------------------------------------------------------|
| **Purpose**                    | Help SREs, developers, and observability engineers understand metric shape,     |
|                                | label cardinality, and downstream cost _before_ the data hits Prometheus / Mimir|
| **Core Philosophy**            | 1. Schema-Driven Transparency  2. Rich Contextual Visuals                       |
|                                | 3. Education via Warnings  4. Cardinality Optimisation  5. Future-Proof Design |
| **Tech Stack (initial)**       | React 18 · Vite · Zustand · ECharts · Mitt event-bus · Web Workers              |
| **Primary Data Source (v0.1)** | Static OTLP JSON ExportMetricsServiceRequest snapshots                          |
| **Future Sources**             | OTLP/HTTP polling • WebSocket streaming • gRPC->WS bridge                       |

## What You’ll Find in /docs

| File # | Title                            | Why you need it                              |
|--------|----------------------------------|----------------------------------------------|
| 01     | Architecture Principles          | Tenets that every PR must respect            |
| 02     | Dependency Graph                 | Single-page overview of allowed import flow  |
| 03     | Data Contracts                   | TypeScript interfaces shared across layers   |
| 10–15  | *data-*.md                       | Pluggable data-provider micro-services       |
| 20–23  | *logic-*.md                      | Pure-logic/worker modules (parser, diff, …)  |
| 30–37  | *ui-*.md                         | React components, each a self-contained unit |
| 40–41  | Event Bus & Store Slices         | Messaging and state isolation                |
| 50–54  | Samples, Tests, Roadmap, Contrib | Operational guides                           |

---

### Quick Start (dev)

```bash
pnpm i
pnpm dev        # launches Vite + Mock StaticFileProvider
Drag a sample payload from example-payloads/.

Explore metrics view.

Click “Cardinality Analyzer”.

Generate YAML → copy into your OTel Collector.
```
