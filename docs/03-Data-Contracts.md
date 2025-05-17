# 03 · Data Contracts (TypeScript)

Source-of‑truth interfaces shared by **all layers**.  
These types live in `src/contracts/` and are compiled into a dedicated
`contracts.d.ts` bundle that UI, logic, and data providers import.

---

## 1. Scalar Attribute Values

```ts
export type OTLPAttributeValue =
  | { stringValue: string }
  | { boolValue: boolean }
  | { intValue: number }         // 64‑bit ints parsed as JS number
  | { doubleValue: number }
  | { bytesValue: Uint8Array };
```

NOTE: For simplicity, array & kvlist attribute kinds are omitted; add if your
OTLP exporter uses them.

---

## 2. Attribute Maps

Canonical runtime representation:

```ts
export type AttrMap = Record<string, string | number | boolean>;
```

Parsing step flattens OTLPAttributeValue → primitive for ease of equality &
JSON serialization.

---

## 3. Fundamental Entities

### 3.1 ParsedNumberDataPoint

```ts
export interface ParsedNumberDataPoint {
  /** Nanoseconds since epoch */
  timeUnixNano: number;
  /** Present for Sum/Histogram; absent for Gauge */
  startTimeUnixNano?: number;
  /** Unified numeric value (int|double) */
  value: number;
  /** Metric‑level + resource‑level attrs merged */
  attrs: AttrMap;

  /* Derived fields (filled by DiffEngine / CardinalityEngine) */
  seriesKey?: SeriesKey;
  delta?: number;      // B−A
  rate?: number;       // delta / seconds
  reset?: boolean;     // true if counter reset detected
}
```

### 3.2 ParsedMetric

```ts
export interface ParsedMetric {
  name: string;
  description?: string;
  unit?: string;
  type: 'Sum' | 'Gauge';
  aggregationTemporality?: 'CUMULATIVE' | 'DELTA';
  isMonotonic?: boolean;        // only for Sum
  points: ParsedNumberDataPoint[];
}
```

### 3.3 ParsedResourceMetrics

```ts
export interface ParsedResourceMetrics {
  resourceAttrs: AttrMap;
  scopeName?: string;
  scopeVersion?: string;
  metrics: ParsedMetric[];
}
```

### 3.4 ParsedSnapshot

```ts
export interface ParsedSnapshot {
  /** human‑readable label e.g. 'A'/'B' or ISO time */
  id: string;
  /** wall‑clock when file/stream was ingested (ms epoch) */
  ingestTs: number;
  resourceMetrics: ParsedResourceMetrics[];
}
```

---

## 4. SeriesKey Algorithm

Uniquely identifies a time‑series instance.

```ts
export type SeriesKey = string; // `${metric}|${sortedKvPairs}`

export function buildSeriesKey(
  metricName: string,
  attrs: AttrMap
): SeriesKey {
  const kv = Object.entries(attrs)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${String(v)}`)
    .join(',');
  return `${metricName}|${kv}`;
}
```

Deterministic (attrs sorted) and collision‑free (strict stringify).
Used by:

* DiffEngine – to align A/B points
* CardinalityEngine – to count unique series
* UI hover – show “SeriesKey: …” in Raw JSON inspector

---

## 5. Diff & Cardinality Stores

```ts
export interface DiffSeries {
  seriesKey: SeriesKey;
  delta: number;
  rate: number;
  reset: boolean;
}

export interface DiffStore {
  /* Map: metricName -> list of DiffSeries */
  diffs: Record<string, DiffSeries[]>;
  timeIntervalSec: number;
}

export interface CardinalityEntry {
  attrKey: string;
  uniqueValues: number;
}

export interface CardinalityMetric {
  metricName: string;
  seriesCount: number;
  attrStats: CardinalityEntry[];
}

export interface CardinalityStore {
  totalSeries: number;
  metrics: CardinalityMetric[];
}
```

---

## 6. Drop‑Plan Contract

Used between ui‑WhatIfSimulator and logic‑ConfigGenerator.

```ts
export interface DropPlan {
  metricName: string;
  labelsToDrop: string[];   // attr keys
}
```

---

## 7. Versioning Notes

Any change to these contracts is a breaking API; bump major in package.json
and update 02-Dependency-Graph.md.

---

## 8. Example Payload → Contracts Walk‑through

Given OTLP process.cpu.time with attrs:

```json
{
  "state":"user",
  "process.pid":1234,
  "host.name":"alpha"
}
```

SeriesKey

```
process.cpu.time|host.name=alpha,process.pid=1234,state=user
```

ParsedNumberDataPoint

```ts
{
  timeUnixNano: 1700000…,
  startTimeUnixNano: 1699900…,
  value: 150.5,
  attrs: {
    "state": "user",
    "process.pid": 1234,
    "host.name": "alpha"
  },
  seriesKey: "process.cpu.time|host.name=alpha,process.pid=1234,state=user"
}
```

DiffEngine later populates delta, rate, reset.

End of contract file.
