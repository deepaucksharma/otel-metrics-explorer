# OTLP Process Metrics Explorer Specification

The primary entry point for understanding the OTLP Process Metrics Explorer specification.

## 1. Purpose & Vision

The OpenTelemetry (OTLP) Process Metrics Explorer is a specialized web-based tool designed to offer deep, schema-aware insights into process-level metrics. It targets Site Reliability Engineers (SREs), developers, and observability engineers who need to understand the structure, dimensionality, and potential cost implications of their metrics data, going beyond typical time-series graph visualization.

The tool's philosophy is rooted in making the rich OpenTelemetry (OTel) schema transparent and actionable, empowering users to optimize their telemetry and make informed decisions about metric collection and retention.

| Key Value Proposition | Description |
|-----------------------|-------------|
| Schema-Driven Transparency | Meticulously expose the full context of every metric (name, description, unit, instrument type, temporality, monotonicity). |
| Rich Contextual Visuals | Present metrics in intuitive forms (gauges, stacked bars, delta/rate indicators) that reinforce the OTel schema. |
| Empowerment & Education | Highlight potential issues (e.g., high-cardinality attributes) and guide users towards OTel/Prometheus best practices. |
| Optimization & Cost Awareness | Analyze metric cardinality and its resource cost implications, offering guidance on reduction. |
| Extensibility & Future-Proofing | Architected for static OTLP JSON analysis initially, with a clear path to support live data streams and configuration export. |

## 2. Target Users

- **SREs (Site Reliability Engineers)**: Need to verify metrics shape, diagnose cardinality issues impacting their monitoring systems (e.g., Prometheus, Mimir), and optimize telemetry pipelines.
- **Developers**: Want to understand the OTel output of their services, ensure correct instrumentation, and debug metric-related issues during development.
- **Observability Engineers**: Design and manage telemetry collection infrastructure (e.g., OTel Collectors), define metric processing rules, and educate teams on best practices.

## 3. Core Technology Stack (Initial Version)

- **Frontend Framework**: React 18 (or Vue 3) with Vite for bundling.
- **State Management**: Zustand (with Immer middleware).
- **Charting/Visualization**: ECharts (or similar, e.g., Recharts, Nivo).
- **Event Bus**: mitt for decoupled inter-component communication.
- **Web Workers**: For offloading heavy tasks like JSON parsing and cardinality calculations.
- **Styling**: Tailwind CSS (or CSS Modules with a utility-first approach).

## 4. Data Flow Overview

1. **Data Ingestion**: User provides static OTLP JSON payload(s) (Snapshot A, optional Snapshot B).
2. **Parsing**: A Web Worker parses the JSON into a structured internal data model (ParsedSnapshot).
3. **State Update**: Parsed data, along with derived metric definitions, populates the global state store.
4. **Diff & Rate Calculation**: If two snapshots are present, a DiffEngine computes deltas and rates.
5. **Visualization**: UI micro-components subscribe to relevant state slices and render metrics.
6. **Analysis**: A CardinalityEngine (potentially in a Worker) analyzes attribute cardinality.
7. **Configuration Export**: A ConfigGenerator produces OTel Collector YAML snippets based on user analysis.

## 5. Navigating This Documentation

This `/docs` directory contains the complete system specification, broken down into ultra-modular micro-component definitions.

| Section | File Prefix | Content |
|---------|------------|---------|
| Core Principles & Architecture | 0X- | Overall vision, guiding principles, dependency flow, shared data contracts. |
| Data Provider Layer | 1X-data- | Components responsible for sourcing OTLP data (static files, live streams). |
| Logic Layer (Workers & Pure Modules) | 2X-logic- | Non-UI components for parsing, diffing, cardinality analysis, config generation. |
| UI Layer (React/Vue Components) | 3X-ui- | Visual micro-components that render data and handle user interaction. |
| Shared Utilities & Services | 4X- | Event bus, state store definitions, core utility functions. |
| Supporting Documentation | 5X- | Sample payloads, testing strategy, performance budgets, roadmap, contributing. |
| Visual Design & Accessibility | AA- | Design tokens, accessibility guidelines. |

Start with `01-Architecture-Principles.md` to understand the foundational rules governing development. Each subsequent file details a specific micro-component or system aspect, including its responsibilities, public interface, dependencies, and error handling.

This overview provides the context for the detailed specifications that follow.
