# OTLP Process Metrics Explorer

A specialized web-based tool designed to offer deep, schema-aware insights into OpenTelemetry (OTLP) process-level metrics.

## Purpose & Vision

The OpenTelemetry (OTLP) Process Metrics Explorer targets Site Reliability Engineers (SREs), developers, and observability engineers who need to understand the structure, dimensionality, and potential cost implications of their metrics data, going beyond typical time-series graph visualization.

The tool's philosophy is rooted in making the rich OpenTelemetry (OTel) schema transparent and actionable, empowering users to optimize their telemetry and make informed decisions about metric collection and retention.

## Key Value Propositions

- **Schema-Driven Transparency**: Meticulously expose the full context of every metric (name, description, unit, instrument type, temporality, monotonicity).
- **Rich Contextual Visuals**: Present metrics in intuitive forms (gauges, stacked bars, delta/rate indicators) that reinforce the OTel schema.
- **Empowerment & Education**: Highlight potential issues (e.g., high-cardinality attributes) and guide users towards OTel/Prometheus best practices.
- **Optimization & Cost Awareness**: Analyze metric cardinality and its resource cost implications, offering guidance on reduction.
- **Extensibility & Future-Proofing**: Architected for static OTLP JSON analysis initially, with a clear path to support live data streams and configuration export.

## Target Users

- **SREs (Site Reliability Engineers)**: Need to verify metrics shape, diagnose cardinality issues impacting their monitoring systems (e.g., Prometheus, Mimir), and optimize telemetry pipelines.
- **Developers**: Want to understand the OTel output of their services, ensure correct instrumentation, and debug metric-related issues during development.
- **Observability Engineers**: Design and manage telemetry collection infrastructure (e.g., OTel Collectors), define metric processing rules, and educate teams on best practices.

## Core Technology Stack

- **Frontend Framework**: React 18 (or Vue 3) with Vite for bundling.
- **State Management**: Zustand (with Immer middleware).
- **Charting/Visualization**: ECharts (or similar, e.g., Recharts, Nivo).
- **Event Bus**: mitt for decoupled inter-component communication.
- **Web Workers**: For offloading heavy tasks like JSON parsing and cardinality calculations.
- **Styling**: Tailwind CSS (or CSS Modules with a utility-first approach).

## Documentation

Comprehensive documentation is available in the `/docs` directory:

- [00-Overview.md](/docs/00-Overview.md): Main entry point for understanding the specification
- [01-Architecture-Principles.md](/docs/01-Architecture-Principles.md): Foundational architecture principles
- [02-Dependency-Graph.md](/docs/02-Dependency-Graph.md): Single-page overview of allowed import flow

### Data Provider Layer

- [10-data-StaticFileProvider.md](/docs/10-data-StaticFileProvider.md): Loading OTLP data from static files
- [11-data-LiveWsProvider.md](/docs/11-data-LiveWsProvider.md): Connecting to live OTLP data sources

### Logic Layer

- [20-logic-ParserWorker.md](/docs/20-logic-ParserWorker.md): Worker that transforms raw OTLP JSON into typed snapshots
- [22-logic-CardinalityEngine.md](/docs/22-logic-CardinalityEngine.md): Set math engine for series and label counts

### UI Layer

- [32-ui-GaugeStatCard.md](/docs/32-ui-GaugeStatCard.md): Gauge-style statistic card
- [35-ui-CardinalityOverview.md](/docs/35-ui-CardinalityOverview.md): Cardinality Analyzer overview

### Shared Utilities

- [40-event-Bus.md](/docs/40-event-Bus.md): Global publish-subscribe hub
- [41-state-StoreSlices.md](/docs/41-state-StoreSlices.md): Zustand store slices

### Supporting Documentation

- [50-sample-Payloads.md](/docs/50-sample-Payloads.md): Example OTLP JSON payloads
- [51-testing-Strategy.md](/docs/51-testing-Strategy.md): Testing approach and methodology

### Visual Design & Accessibility

- [AA-DesignTokens.md](/docs/AA-DesignTokens.md): Design tokens and accessibility guidelines

## Getting Started

Instructions for setting up the development environment and running the application will be added as the project progresses.

## Contributing

Contribution guidelines will be provided in a future update.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
