# Sample Payloads

This document provides example OTLP JSON payloads that can be used for testing, development, and demonstration purposes. These samples represent different types of metrics data that the OTLP Process Metrics Explorer should be able to handle.

## 1. Basic Metrics Example

```json
{
  "resourceMetrics": [
    {
      "resource": {
        "attributes": [
          {
            "key": "service.name",
            "value": {
              "stringValue": "payment-service"
            }
          },
          {
            "key": "service.version",
            "value": {
              "stringValue": "1.0.0"
            }
          },
          {
            "key": "deployment.environment",
            "value": {
              "stringValue": "production"
            }
          }
        ]
      },
      "scopeMetrics": [
        {
          "scope": {
            "name": "io.opentelemetry.runtime",
            "version": "1.0.0"
          },
          "metrics": [
            {
              "name": "process.runtime.jvm.memory.heap",
              "description": "JVM heap memory usage",
              "unit": "bytes",
              "gauge": {
                "dataPoints": [
                  {
                    "attributes": [
                      {
                        "key": "pool",
                        "value": {
                          "stringValue": "eden"
                        }
                      }
                    ],
                    "timeUnixNano": "1640995200000000000",
                    "asDouble": 256000000
                  },
                  {
                    "attributes": [
                      {
                        "key": "pool",
                        "value": {
                          "stringValue": "survivor"
                        }
                      }
                    ],
                    "timeUnixNano": "1640995200000000000",
                    "asDouble": 32000000
                  },
                  {
                    "attributes": [
                      {
                        "key": "pool",
                        "value": {
                          "stringValue": "old"
                        }
                      }
                    ],
                    "timeUnixNano": "1640995200000000000",
                    "asDouble": 512000000
                  }
                ]
              }
            },
            {
              "name": "process.runtime.jvm.cpu.utilization",
              "description": "JVM CPU utilization",
              "unit": "1",
              "gauge": {
                "dataPoints": [
                  {
                    "timeUnixNano": "1640995200000000000",
                    "asDouble": 0.45
                  }
                ]
              }
            }
          ]
        },
        {
          "scope": {
            "name": "io.opentelemetry.payment",
            "version": "0.1.0"
          },
          "metrics": [
            {
              "name": "payment.transactions",
              "description": "Number of payment transactions",
              "unit": "{transactions}",
              "sum": {
                "dataPoints": [
                  {
                    "attributes": [
                      {
                        "key": "status",
                        "value": {
                          "stringValue": "success"
                        }
                      },
                      {
                        "key": "method",
                        "value": {
                          "stringValue": "credit_card"
                        }
                      }
                    ],
                    "timeUnixNano": "1640995200000000000",
                    "asInt": 126
                  },
                  {
                    "attributes": [
                      {
                        "key": "status",
                        "value": {
                          "stringValue": "failed"
                        }
                      },
                      {
                        "key": "method",
                        "value": {
                          "stringValue": "credit_card"
                        }
                      }
                    ],
                    "timeUnixNano": "1640995200000000000",
                    "asInt": 4
                  },
                  {
                    "attributes": [
                      {
                        "key": "status",
                        "value": {
                          "stringValue": "success"
                        }
                      },
                      {
                        "key": "method",
                        "value": {
                          "stringValue": "paypal"
                        }
                      }
                    ],
                    "timeUnixNano": "1640995200000000000",
                    "asInt": 57
                  }
                ],
                "aggregationTemporality": "AGGREGATION_TEMPORALITY_CUMULATIVE",
                "isMonotonic": true
              }
            },
            {
              "name": "payment.amount",
              "description": "Total payment amount",
              "unit": "USD",
              "sum": {
                "dataPoints": [
                  {
                    "attributes": [
                      {
                        "key": "method",
                        "value": {
                          "stringValue": "credit_card"
                        }
                      }
                    ],
                    "timeUnixNano": "1640995200000000000",
                    "asDouble": 12587.45
                  },
                  {
                    "attributes": [
                      {
                        "key": "method",
                        "value": {
                          "stringValue": "paypal"
                        }
                      }
                    ],
                    "timeUnixNano": "1640995200000000000",
                    "asDouble": 4298.12
                  }
                ],
                "aggregationTemporality": "AGGREGATION_TEMPORALITY_CUMULATIVE",
                "isMonotonic": true
              }
            }
          ]
        }
      ]
    }
  ]
}
```

## 2. High Cardinality Example

```json
{
  "resourceMetrics": [
    {
      "resource": {
        "attributes": [
          {
            "key": "service.name",
            "value": {
              "stringValue": "api-gateway"
            }
          },
          {
            "key": "service.instance.id",
            "value": {
              "stringValue": "gateway-pod-1234"
            }
          },
          {
            "key": "k8s.cluster.name",
            "value": {
              "stringValue": "production-east"
            }
          }
        ]
      },
      "scopeMetrics": [
        {
          "scope": {
            "name": "io.opentelemetry.http",
            "version": "1.1.0"
          },
          "metrics": [
            {
              "name": "http.server.request.duration",
              "description": "Duration of HTTP server requests",
              "unit": "ms",
              "histogram": {
                "dataPoints": [
                  {
                    "attributes": [
                      {
                        "key": "http.method",
                        "value": {
                          "stringValue": "GET"
                        }
                      },
                      {
                        "key": "http.route",
                        "value": {
                          "stringValue": "/api/users/{userId}"
                        }
                      },
                      {
                        "key": "http.status_code",
                        "value": {
                          "intValue": 200
                        }
                      },
                      {
                        "key": "user.id",
                        "value": {
                          "stringValue": "user-12345"
                        }
                      },
                      {
                        "key": "client.ip",
                        "value": {
                          "stringValue": "203.0.113.0"
                        }
                      }
                    ],
                    "timeUnixNano": "1640995200000000000",
                    "count": 1,
                    "sum": 125.5,
                    "bucketCounts": [0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
                    "explicitBounds": [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000]
                  },
                  {
                    "attributes": [
                      {
                        "key": "http.method",
                        "value": {
                          "stringValue": "GET"
                        }
                      },
                      {
                        "key": "http.route",
                        "value": {
                          "stringValue": "/api/users/{userId}"
                        }
                      },
                      {
                        "key": "http.status_code",
                        "value": {
                          "intValue": 200
                        }
                      },
                      {
                        "key": "user.id",
                        "value": {
                          "stringValue": "user-67890"
                        }
                      },
                      {
                        "key": "client.ip",
                        "value": {
                          "stringValue": "203.0.113.1"
                        }
                      }
                    ],
                    "timeUnixNano": "1640995200000000000",
                    "count": 1,
                    "sum": 42.1,
                    "bucketCounts": [0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
                    "explicitBounds": [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000]
                  }
                  // Additional data points would follow with more user.id and client.ip combinations
                ],
                "aggregationTemporality": "AGGREGATION_TEMPORALITY_DELTA"
              }
            }
          ]
        }
      ]
    }
  ]
}
```

## 3. All Metric Types Example

```json
{
  "resourceMetrics": [
    {
      "resource": {
        "attributes": [
          {
            "key": "service.name",
            "value": {
              "stringValue": "demo-service"
            }
          }
        ]
      },
      "scopeMetrics": [
        {
          "scope": {
            "name": "io.opentelemetry.demo",
            "version": "1.0.0"
          },
          "metrics": [
            {
              "name": "demo.gauge.value",
              "description": "Example gauge metric",
              "unit": "1",
              "gauge": {
                "dataPoints": [
                  {
                    "timeUnixNano": "1640995200000000000",
                    "asDouble": 42.0
                  }
                ]
              }
            },
            {
              "name": "demo.sum.count",
              "description": "Example sum metric (counter)",
              "unit": "1",
              "sum": {
                "dataPoints": [
                  {
                    "timeUnixNano": "1640995200000000000",
                    "asInt": 12345
                  }
                ],
                "aggregationTemporality": "AGGREGATION_TEMPORALITY_CUMULATIVE",
                "isMonotonic": true
              }
            },
            {
              "name": "demo.sum.updown",
              "description": "Example sum metric (up-down counter)",
              "unit": "1",
              "sum": {
                "dataPoints": [
                  {
                    "timeUnixNano": "1640995200000000000",
                    "asInt": 42
                  }
                ],
                "aggregationTemporality": "AGGREGATION_TEMPORALITY_CUMULATIVE",
                "isMonotonic": false
              }
            },
            {
              "name": "demo.histogram.values",
              "description": "Example histogram metric",
              "unit": "ms",
              "histogram": {
                "dataPoints": [
                  {
                    "timeUnixNano": "1640995200000000000",
                    "count": 100,
                    "sum": 5000.0,
                    "bucketCounts": [10, 25, 35, 20, 10],
                    "explicitBounds": [10, 50, 100, 500]
                  }
                ],
                "aggregationTemporality": "AGGREGATION_TEMPORALITY_CUMULATIVE"
              }
            },
            {
              "name": "demo.summary.values",
              "description": "Example summary metric",
              "unit": "ms",
              "summary": {
                "dataPoints": [
                  {
                    "timeUnixNano": "1640995200000000000",
                    "count": 100,
                    "sum": 5000.0,
                    "quantileValues": [
                      {
                        "quantile": 0.5,
                        "value": 42.5
                      },
                      {
                        "quantile": 0.9,
                        "value": 89.2
                      },
                      {
                        "quantile": 0.99,
                        "value": 123.7
                      }
                    ]
                  }
                ]
              }
            }
          ]
        }
      ]
    }
  ]
}
```

## 4. Multiple Resources Example

```json
{
  "resourceMetrics": [
    {
      "resource": {
        "attributes": [
          {
            "key": "service.name",
            "value": {
              "stringValue": "frontend-service"
            }
          },
          {
            "key": "service.instance.id",
            "value": {
              "stringValue": "frontend-1"
            }
          }
        ]
      },
      "scopeMetrics": [
        {
          "scope": {
            "name": "io.opentelemetry.nodejs",
            "version": "1.0.0"
          },
          "metrics": [
            {
              "name": "process.cpu.usage",
              "description": "CPU usage",
              "unit": "percent",
              "gauge": {
                "dataPoints": [
                  {
                    "timeUnixNano": "1640995200000000000",
                    "asDouble": 12.5
                  }
                ]
              }
            }
          ]
        }
      ]
    },
    {
      "resource": {
        "attributes": [
          {
            "key": "service.name",
            "value": {
              "stringValue": "backend-service"
            }
          },
          {
            "key": "service.instance.id",
            "value": {
              "stringValue": "backend-1"
            }
          }
        ]
      },
      "scopeMetrics": [
        {
          "scope": {
            "name": "io.opentelemetry.java",
            "version": "1.0.0"
          },
          "metrics": [
            {
              "name": "process.cpu.usage",
              "description": "CPU usage",
              "unit": "percent",
              "gauge": {
                "dataPoints": [
                  {
                    "timeUnixNano": "1640995200000000000",
                    "asDouble": 24.7
                  }
                ]
              }
            }
          ]
        }
      ]
    },
    {
      "resource": {
        "attributes": [
          {
            "key": "service.name",
            "value": {
              "stringValue": "database-service"
            }
          },
          {
            "key": "service.instance.id",
            "value": {
              "stringValue": "database-1"
            }
          }
        ]
      },
      "scopeMetrics": [
        {
          "scope": {
            "name": "io.opentelemetry.database",
            "version": "1.0.0"
          },
          "metrics": [
            {
              "name": "process.cpu.usage",
              "description": "CPU usage",
              "unit": "percent",
              "gauge": {
                "dataPoints": [
                  {
                    "timeUnixNano": "1640995200000000000",
                    "asDouble": 65.3
                  }
                ]
              }
            }
          ]
        }
      ]
    }
  ]
}
```

## 5. Delta Temporality Example

```json
{
  "resourceMetrics": [
    {
      "resource": {
        "attributes": [
          {
            "key": "service.name",
            "value": {
              "stringValue": "batch-processor"
            }
          }
        ]
      },
      "scopeMetrics": [
        {
          "scope": {
            "name": "io.opentelemetry.processing",
            "version": "1.0.0"
          },
          "metrics": [
            {
              "name": "batch.processed.records",
              "description": "Number of records processed in a batch",
              "unit": "{records}",
              "sum": {
                "dataPoints": [
                  {
                    "timeUnixNano": "1640995200000000000",
                    "startTimeUnixNano": "1640995140000000000",
                    "asInt": 1250
                  }
                ],
                "aggregationTemporality": "AGGREGATION_TEMPORALITY_DELTA",
                "isMonotonic": true
              }
            },
            {
              "name": "batch.processing.duration",
              "description": "Duration of batch processing",
              "unit": "ms",
              "histogram": {
                "dataPoints": [
                  {
                    "timeUnixNano": "1640995200000000000",
                    "startTimeUnixNano": "1640995140000000000",
                    "count": 10,
                    "sum": 12542.5,
                    "bucketCounts": [0, 0, 1, 3, 4, 2, 0, 0],
                    "explicitBounds": [100, 250, 500, 1000, 2500, 5000, 10000]
                  }
                ],
                "aggregationTemporality": "AGGREGATION_TEMPORALITY_DELTA"
              }
            }
          ]
        }
      ]
    }
  ]
}
```

These sample payloads can be used for:

1. Testing the OTLP JSON Parser component
2. Demonstrating the UI components with realistic data
3. Developing and testing the Cardinality Analysis Engine
4. Creating end-to-end tests for the application
5. Building example visualizations for documentation

Developers can modify these payloads to create specific test cases or to simulate different scenarios, such as extremely high cardinality, missing values, or edge cases in metric types.
