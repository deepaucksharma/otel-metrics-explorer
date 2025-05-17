# OTLP JSON Parser

## Overview

The OTLP JSON Parser is a core component of the Logic Layer responsible for parsing and transforming raw OpenTelemetry (OTLP) JSON data into the application's internal data model. This transformation enables efficient analysis, visualization, and comparison of metrics data.

## Responsibilities

1. Parse raw OTLP JSON data according to the OpenTelemetry specification
2. Validate the structure and content of the input data
3. Transform the data into the application's internal data model (ParsedSnapshot)
4. Generate unique identifiers for resources, scopes, metrics, and data points
5. Extract and normalize attribute values
6. Detect and handle special metric types (histograms, summaries)
7. Perform initial statistical analysis on metric data

## Public Interface

```typescript
interface OtlpJsonParser {
  // Parse OTLP JSON string into the internal data model
  parse(jsonString: string, options?: ParserOptions): Promise<ParsedSnapshot>;
  
  // Parse pre-parsed OTLP JSON object
  parseObject(otlpJson: OtlpMetricsJson, options?: ParserOptions): Promise<ParsedSnapshot>;
  
  // Validate OTLP JSON structure without full parsing
  validate(jsonString: string): ValidationResult;
  
  // Get schema version information from OTLP data
  getSchemaInfo(otlpJson: OtlpMetricsJson): SchemaInfo;
}

interface ParserOptions {
  snapshotId?: string; // Custom ID for the snapshot, auto-generated if not provided
  timestamp?: number; // Custom timestamp, defaults to current time
  includeZeroValues?: boolean; // Whether to include data points with zero values, default: true
  normalizeAttributes?: boolean; // Whether to normalize attribute values, default: true
  computeStatistics?: boolean; // Whether to compute initial statistics, default: true
  validateInput?: boolean; // Whether to validate input before parsing, default: true
}

interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
  warnings?: ValidationWarning[];
}

interface ValidationError {
  path: string;
  message: string;
  severity: 'error';
}

interface ValidationWarning {
  path: string;
  message: string;
  severity: 'warning';
}

interface SchemaInfo {
  version?: string;
  metrics?: {
    count: number;
    types: Record<string, number>; // e.g., { 'gauge': 5, 'sum': 3 }
  };
}
```

## Implementation Details

### Parsing Process

1. The parser first validates the input JSON structure against the OTLP schema
2. It then iterates through the resource metrics, creating unique resource objects
3. For each resource, it processes the scope metrics and creates scope objects
4. For each scope, it processes the individual metrics and data points
5. Special handling is applied for different metric types (gauge, sum, histogram, etc.)
6. Attributes at all levels (resource, scope, data point) are processed and normalized
7. Unique IDs are generated for all entities to enable efficient lookup and comparison
8. The resulting structure is assembled into a ParsedSnapshot object

### ID Generation Strategy

- Resources: Hash of resource attributes
- Scopes: Hash of scope name, version, and attributes
- Metrics: Hash of metric name and type
- Data Points: Hash of metric ID, data point attributes, and timestamp

### Attribute Normalization

- String attributes are trimmed and normalized
- Numeric attributes are converted to a consistent format
- Boolean attributes are converted to true/false
- Array attributes are serialized consistently
- Labels/names are normalized for case and special characters

### Performance Optimizations

- The parser is designed to run in a Web Worker to avoid blocking the main thread
- Large JSON payloads are processed incrementally
- Memory-efficient data structures are used for large attribute sets
- Caching is employed for repeated attribute sets to reduce memory usage

## Error Handling

The parser implements comprehensive error handling:

- Invalid JSON format: Returns a clear error indicating the syntax issue
- Schema validation failures: Provides detailed path and explanation
- Missing required fields: Identifies specifically which fields are missing
- Type mismatches: Reports expected vs. actual types
- Processing failures: Attempts to continue processing where possible, reporting partial results

## Dependencies

- SchemaValidator: For validating input against the OTLP schema
- IdGenerator: For creating unique identifiers
- AttributeNormalizer: For processing and normalizing attributes
- StatisticsCalculator: For computing initial metric statistics

## Usage Example

```typescript
const parser = new OtlpJsonParser();

// From a JSON string
async function parseOtlpFile(fileContent) {
  try {
    const parsedSnapshot = await parser.parse(fileContent, {
      computeStatistics: true,
      normalizeAttributes: true
    });
    
    console.log(`Parsed snapshot with ${parsedSnapshot.metricCount} metrics`);
    console.log(`Total data points: ${parsedSnapshot.totalDataPoints}`);
    
    // Access the parsed data
    const metrics = parsedSnapshot.metrics;
    const resources = parsedSnapshot.resources;
    
    // Return the parsed snapshot for further processing
    return parsedSnapshot;
  } catch (error) {
    console.error('Failed to parse OTLP JSON:', error);
    throw error;
  }
}

// Validate without full parsing
function validateOtlpJson(jsonString) {
  const result = parser.validate(jsonString);
  
  if (!result.valid) {
    console.error('Validation errors:');
    result.errors.forEach(error => {
      console.error(`- ${error.path}: ${error.message}`);
    });
  }
  
  return result.valid;
}
```

This component is a critical part of the data processing pipeline and forms the foundation for all analysis performed by the OTLP Process Metrics Explorer.
