# Configuration Exporter

## Overview

The Configuration Exporter is a utility component that generates configuration snippets for OpenTelemetry Collectors based on the insights and optimizations identified in the OTLP Process Metrics Explorer. It translates user-selected cardinality reduction strategies into executable OpenTelemetry Collector configuration YAML, enabling users to easily implement their metric optimization decisions.

## Responsibilities

1. Generate OpenTelemetry Collector configuration YAML from user selections
2. Support various optimization strategies (attribute dropping, filtering, etc.)
3. Provide configuration templates for different scenarios
4. Produce valid, well-formatted YAML configuration
5. Support multiple export formats (file, clipboard, direct download)
6. Generate documentation and comments in the configuration

## Public Interface

```typescript
interface ConfigExporter {
  // Generate configuration from optimization selections
  generateConfig(optimizationPlan: OptimizationPlan, options?: ConfigOptions): ConfigResult;
  
  // Get available templates
  getTemplates(): ConfigTemplate[];
  
  // Apply specific template
  applyTemplate(templateId: string, optimizationPlan: OptimizationPlan): ConfigResult;
  
  // Validate a configuration
  validateConfig(config: string): ValidationResult;
}

interface OptimizationPlan {
  dropAttributes: AttributeDropPlan[];
  dropMetrics: MetricDropPlan[];
  transformMetrics: MetricTransformPlan[];
  filterMetrics: MetricFilterPlan[];
  relabelAttributes: AttributeRelabelPlan[];
}

interface AttributeDropPlan {
  metricName: string;
  attributeKey: string;
  pattern?: string; // Regex pattern for conditional dropping
}

interface MetricDropPlan {
  metricName: string;
  condition?: string; // Condition for dropping the metric
}

interface MetricTransformPlan {
  metricName: string;
  action: 'update_name' | 'add_label' | 'aggregate_labels' | 'aggregate_metric';
  newName?: string;
  label?: string;
  labelValue?: string;
  aggregation?: 'sum' | 'min' | 'max' | 'mean';
}

interface MetricFilterPlan {
  include?: string[]; // Metric names or patterns to include
  exclude?: string[]; // Metric names or patterns to exclude
}

interface AttributeRelabelPlan {
  metricName: string;
  attributeKey: string;
  newAttributeKey: string;
}

interface ConfigOptions {
  format: 'yaml' | 'json';
  includeComments: boolean;
  pipelineName: string;
  collectorVersion: string;
  includeSampleValues: boolean;
}

interface ConfigResult {
  config: string;
  format: 'yaml' | 'json';
  affectedMetrics: number;
  estimatedCardinalityReduction: number;
  warnings: ConfigWarning[];
}

interface ConfigWarning {
  type: 'syntax' | 'compatibility' | 'performance' | 'logic';
  message: string;
  line?: number;
}

interface ConfigTemplate {
  id: string;
  name: string;
  description: string;
  applicableTo: 'all' | 'high_cardinality' | 'counters' | 'gauges' | 'histograms';
}

interface ValidationResult {
  valid: boolean;
  errors: ConfigError[];
  warnings: ConfigWarning[];
}

interface ConfigError {
  type: 'syntax' | 'reference' | 'structure';
  message: string;
  line?: number;
}
```

## Implementation Details

### Configuration Generation Process

1. The exporter takes an optimization plan generated from user selections in the UI
2. It applies a template or creates a new configuration based on the plan
3. Processors are added to the configuration based on the optimization strategies
4. The configuration is formatted and validated
5. Comments and documentation are added to explain the purpose of each section
6. The final configuration is returned in the requested format

### Configuration Sections

The exporter generates specific sections for an OpenTelemetry Collector configuration:

- **Processors**:
  - `filter`: For including or excluding specific metrics
  - `metricstransform`: For renaming, modifying, or aggregating metrics
  - `attributes`: For modifying, renaming, or dropping attributes
  - `resourcedetection`: For augmenting or modifying resource information

- **Pipelines**:
  - A configured metrics pipeline that includes the generated processors
  - Default receivers and exporters placeholders

### Templates

The exporter provides several built-in templates for common scenarios:

- **Basic Cardinality Reduction**: Drops high-cardinality attributes
- **Service-Specific Optimization**: Tailored for specific service types
- **Cost Optimization**: Focused on reducing metric volume for cost savings
- **Performance Tuning**: Optimizations for collector performance

### YAML Generation

The exporter uses a structured approach to YAML generation:

1. Building an object model representing the configuration
2. Converting the object model to YAML using a specialized library
3. Formatting and indenting the YAML for readability
4. Adding comments and documentation where appropriate

## Performance Considerations

- Efficient generation of large configurations
- Caching of templates and intermediate results
- Incremental updates for interactive UI changes
- Asynchronous validation and formatting

## Error Handling

- Invalid optimization plans: Detecting and reporting inconsistencies
- YAML syntax validation: Ensuring the generated YAML is valid
- Logical conflict detection: Identifying contradictory rules
- Performance warnings: Flagging configurations that might cause issues

## Dependencies

- YAML Generator Library: For proper YAML formatting
- OTel Schema Validator: For validating against OTel Collector schemas
- Template Engine: For applying and customizing templates
- EventBus: For emitting generation events and progress

## Usage Example

```typescript
const configExporter = new ConfigExporter();

// Generate configuration based on user selections
function generateCollectorConfig(cardinalityAnalysis) {
  // Create an optimization plan based on cardinality analysis
  const optimizationPlan: OptimizationPlan = {
    dropAttributes: [],
    dropMetrics: [],
    transformMetrics: [],
    filterMetrics: {
      include: ['app.*', 'system.*'],
      exclude: ['system.network.*']
    },
    relabelAttributes: []
  };
  
  // Add attribute drop rules for high-cardinality attributes
  const highCardinalityThreshold = 1000;
  
  Object.values(cardinalityAnalysis.metrics).forEach(metric => {
    metric.attributeCardinalityFactors
      .filter(factor => factor.uniqueValues > highCardinalityThreshold)
      .forEach(factor => {
        optimizationPlan.dropAttributes.push({
          metricName: metric.name,
          attributeKey: factor.attributeKey
        });
      });
  });
  
  // Generate the configuration
  const configResult = configExporter.generateConfig(optimizationPlan, {
    format: 'yaml',
    includeComments: true,
    pipelineName: 'metrics',
    collectorVersion: '0.49.0',
    includeSampleValues: true
  });
  
  console.log(`Generated configuration with ${configResult.affectedMetrics} affected metrics`);
  console.log(`Estimated cardinality reduction: ${configResult.estimatedCardinalityReduction} series`);
  
  if (configResult.warnings.length > 0) {
    console.warn('Configuration warnings:');
    configResult.warnings.forEach(warning => {
      console.warn(`- ${warning.type}: ${warning.message}`);
    });
  }
  
  return configResult.config;
}
```

This component is essential for translating the insights gained from the OTLP Process Metrics Explorer into actionable configurations that users can implement in their monitoring infrastructure.
