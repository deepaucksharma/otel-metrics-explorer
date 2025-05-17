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

- **Frontend Framework**: React 18 with Vite for bundling.
- **State Management**: Zustand (with Immer middleware).
- **Charting/Visualization**: ECharts for rich visualizations.
- **Event Bus**: mitt for decoupled inter-component communication.
- **Web Workers**: For offloading heavy tasks like JSON parsing and cardinality calculations.
- **Styling**: Tailwind CSS for utility-first styling.

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
- [21-logic-DiffEngine.md](/docs/21-logic-DiffEngine.md): Computing diffs between snapshots
- [22-logic-CardinalityEngine.md](/docs/22-logic-CardinalityEngine.md): Set math engine for series and label counts

### UI Layer

- [32-ui-GaugeStatCard.md](/docs/32-ui-GaugeStatCard.md): Gauge-style statistic card
- [33-ui-RateDeltaCard.md](/docs/33-ui-RateDeltaCard.md): Rate/delta display for counters
- [35-ui-CardinalityOverview.md](/docs/35-ui-CardinalityOverview.md): Cardinality Analyzer overview

### Shared Utilities

- [40-event-Bus.md](/docs/40-event-Bus.md): Global publish-subscribe hub
- [41-state-StoreSlices.md](/docs/41-state-StoreSlices.md): Zustand store slices

### Development & Deployment

- [60-project-Structure.md](/docs/60-project-Structure.md): Codebase organization and structure
- [61-installation-Deployment.md](/docs/61-installation-Deployment.md): Setting up and deploying the application
- [62-user-Guide.md](/docs/62-user-Guide.md): How to use the application effectively
- [63-api-Reference.md](/docs/63-api-Reference.md): Public APIs for integration

### Error Handling & Troubleshooting

- [65-error-Handling.md](/docs/65-error-Handling.md): Error handling strategy
- [66-troubleshooting.md](/docs/66-troubleshooting.md): Common issues and solutions

### Project Management & Planning

- [70-adr-Template.md](/docs/70-adr-Template.md): Template for architectural decisions
- [72-implementation-Plan.md](/docs/72-implementation-Plan.md): Highly parallelized execution plan with interface-first approach
- [73-github-Project-Setup.md](/docs/73-github-Project-Setup.md): Using GitHub project management features for tracking implementation

### Supporting Documentation

- [50-SamplePayloads.md](/docs/50-SamplePayloads.md): Example OTLP JSON payloads
- [51-TestingStrategy.md](/docs/51-TestingStrategy.md): Testing approach and methodology

## Getting Started

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

See [61-installation-Deployment.md](/docs/61-installation-Deployment.md) for detailed setup instructions.

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on how to get started. Our project follows an interface-first development approach as detailed in [72-implementation-Plan.md](/docs/72-implementation-Plan.md).

## Development Process

Our development process follows these key principles:

1. **Interface-First Development**: We define interfaces and contracts before implementation
2. **Robust Mocking Strategy**: High-quality mocks enable parallel development
3. **Contract Tests**: Validate that implementations correctly adhere to interfaces

We use GitHub Projects for task tracking and coordination as described in [73-github-Project-Setup.md](/docs/73-github-Project-Setup.md).

## License

This project is licensed under the MIT License - see the LICENSE file for details.
