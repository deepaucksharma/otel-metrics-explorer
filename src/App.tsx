import { useEffect, useState } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/layout/Layout'
import { MetricsView } from './components/metrics/MetricsView'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { SnapshotUploader } from './components/data-providers/SnapshotUploader'
import { useStore } from './state/store'
import { eventBus } from './services/eventBus'
import { CardinalityOverview } from './components/cardinality/CardinalityOverview'
import { WhatIfSimulator } from './components/cardinality/WhatIfSimulator'

import { ParsedSnapshot, MetricType } from './types/otlp';

// Sample data for demonstration - first snapshot
const sampleSnapshotA: ParsedSnapshot = {
  id: "sample-snapshot-A",
  timestamp: Date.now() - 60000, // 1 minute ago
  resources: [
    {
      id: "resource-1",
      attributes: {
        "service.name": "sample-service",
        "service.version": "1.0.0",
        "deployment.environment": "development"
      },
      scopes: [
        {
          id: "scope-1",
          name: "io.opentelemetry.runtime",
          version: "1.0.0",
          metricIds: ["metric-1", "metric-2", "metric-3", "metric-4", "metric-5"]
        }
      ]
    }
  ],
  metrics: {
    "metric-1": {
      id: "metric-1",
      name: "system.cpu.usage",
      description: "CPU usage",
      unit: "percent",
      type: "gauge" as MetricType,
      dataPoints: [
        {
          attributes: { cpu: "cpu0", host: "host1", region: "us-east-1", zone: "us-east-1a", rack: "rack-101" },
          timeUnixNano: "1640995200000000000",
          startTimeUnixNano: "1640995100000000000",
          value: 45.5,
          seriesKey: "system.cpu.usage|cpu=cpu0,host=host1,region=us-east-1,zone=us-east-1a,rack=rack-101"
        },
        {
          attributes: { cpu: "cpu1", host: "host1", region: "us-east-1", zone: "us-east-1a", rack: "rack-101" },
          timeUnixNano: "1640995200000000000",
          startTimeUnixNano: "1640995100000000000",
          value: 32.1,
          seriesKey: "system.cpu.usage|cpu=cpu1,host=host1,region=us-east-1,zone=us-east-1a,rack=rack-101"
        },
        {
          attributes: { cpu: "cpu0", host: "host2", region: "us-east-1", zone: "us-east-1b", rack: "rack-102" },
          timeUnixNano: "1640995200000000000",
          startTimeUnixNano: "1640995100000000000",
          value: 41.2,
          seriesKey: "system.cpu.usage|cpu=cpu0,host=host2,region=us-east-1,zone=us-east-1b,rack=rack-102"
        },
        {
          attributes: { cpu: "cpu1", host: "host2", region: "us-east-1", zone: "us-east-1b", rack: "rack-102" },
          timeUnixNano: "1640995200000000000",
          startTimeUnixNano: "1640995100000000000",
          value: 35.5,
          seriesKey: "system.cpu.usage|cpu=cpu1,host=host2,region=us-east-1,zone=us-east-1b,rack=rack-102"
        }
      ],
      attributeKeys: ["cpu", "host", "region", "zone", "rack"],
      resourceIds: ["resource-1"],
      scopeIds: ["scope-1"]
    },
    "metric-2": {
      id: "metric-2",
      name: "system.memory.usage",
      description: "Memory usage",
      unit: "bytes",
      type: "gauge" as MetricType,
      dataPoints: [
        {
          attributes: { state: "used", host: "host1", region: "us-east-1", zone: "us-east-1a", rack: "rack-101" },
          timeUnixNano: "1640995200000000000",
          startTimeUnixNano: "1640995100000000000",
          value: 2147483648, // 2GB
          seriesKey: "system.memory.usage|state=used,host=host1,region=us-east-1,zone=us-east-1a,rack=rack-101"
        },
        {
          attributes: { state: "free", host: "host1", region: "us-east-1", zone: "us-east-1a", rack: "rack-101" },
          timeUnixNano: "1640995200000000000",
          startTimeUnixNano: "1640995100000000000",
          value: 4294967296, // 4GB
          seriesKey: "system.memory.usage|state=free,host=host1,region=us-east-1,zone=us-east-1a,rack=rack-101"
        },
        {
          attributes: { state: "used", host: "host2", region: "us-east-1", zone: "us-east-1b", rack: "rack-102" },
          timeUnixNano: "1640995200000000000",
          startTimeUnixNano: "1640995100000000000",
          value: 1879048192, // 1.75GB
          seriesKey: "system.memory.usage|state=used,host=host2,region=us-east-1,zone=us-east-1b,rack=rack-102"
        },
        {
          attributes: { state: "free", host: "host2", region: "us-east-1", zone: "us-east-1b", rack: "rack-102" },
          timeUnixNano: "1640995200000000000",
          startTimeUnixNano: "1640995100000000000",
          value: 3758096384, // 3.5GB
          seriesKey: "system.memory.usage|state=free,host=host2,region=us-east-1,zone=us-east-1b,rack=rack-102"
        }
      ],
      attributeKeys: ["state", "host", "region", "zone", "rack"],
      resourceIds: ["resource-1"],
      scopeIds: ["scope-1"]
    },
    "metric-3": {
      id: "metric-3",
      name: "process.uptime",
      description: "Process uptime",
      unit: "s",
      type: "gauge" as MetricType,
      dataPoints: [
        {
          attributes: { service: "app1", host: "host1", region: "us-east-1", pod: "pod-123" },
          timeUnixNano: "1640995200000000000",
          startTimeUnixNano: "1640995100000000000",
          value: 3600.5, // 1h 0m 0.5s
          seriesKey: "process.uptime|service=app1,host=host1,region=us-east-1,pod=pod-123"
        },
        {
          attributes: { service: "app1", host: "host2", region: "us-east-1", pod: "pod-456" },
          timeUnixNano: "1640995200000000000",
          startTimeUnixNano: "1640995100000000000",
          value: 7200.0, // 2h 0m 0s
          seriesKey: "process.uptime|service=app1,host=host2,region=us-east-1,pod=pod-456"
        },
        {
          attributes: { service: "app2", host: "host1", region: "us-east-1", pod: "pod-789" },
          timeUnixNano: "1640995200000000000",
          startTimeUnixNano: "1640995100000000000",
          value: 1800.25, // 0h 30m 0.25s
          seriesKey: "process.uptime|service=app2,host=host1,region=us-east-1,pod=pod-789"
        }
      ],
      attributeKeys: ["service", "host", "region", "pod"],
      resourceIds: ["resource-1"],
      scopeIds: ["scope-1"]
    },
    "metric-4": {
      id: "metric-4",
      name: "http.server.requests",
      description: "HTTP server request count",
      unit: "{requests}",
      type: "sum" as MetricType,
      monotonic: true,
      dataPoints: [
        {
          attributes: { method: "GET", path: "/api/users", status: "200", host: "host1", service: "api" },
          timeUnixNano: "1640995200000000000",
          startTimeUnixNano: "1640995100000000000",
          value: 1250,
          seriesKey: "http.server.requests|method=GET,path=/api/users,status=200,host=host1,service=api"
        },
        {
          attributes: { method: "POST", path: "/api/users", status: "201", host: "host1", service: "api" },
          timeUnixNano: "1640995200000000000",
          startTimeUnixNano: "1640995100000000000",
          value: 542,
          seriesKey: "http.server.requests|method=POST,path=/api/users,status=201,host=host1,service=api"
        },
        {
          attributes: { method: "GET", path: "/api/users", status: "200", host: "host2", service: "api" },
          timeUnixNano: "1640995200000000000",
          startTimeUnixNano: "1640995100000000000",
          value: 986,
          seriesKey: "http.server.requests|method=GET,path=/api/users,status=200,host=host2,service=api"
        },
        {
          attributes: { method: "GET", path: "/api/orders", status: "200", host: "host1", service: "api" },
          timeUnixNano: "1640995200000000000",
          startTimeUnixNano: "1640995100000000000",
          value: 782,
          seriesKey: "http.server.requests|method=GET,path=/api/orders,status=200,host=host1,service=api"
        },
        {
          attributes: { method: "GET", path: "/api/products", status: "200", host: "host1", service: "api" },
          timeUnixNano: "1640995200000000000",
          startTimeUnixNano: "1640995100000000000",
          value: 418,
          seriesKey: "http.server.requests|method=GET,path=/api/products,status=200,host=host1,service=api"
        }
      ],
      attributeKeys: ["method", "path", "status", "host", "service"],
      resourceIds: ["resource-1"],
      scopeIds: ["scope-1"]
    },
    "metric-5": {
      id: "metric-5",
      name: "app.counter.resets",
      description: "Counter that will be reset",
      type: "sum" as MetricType,
      monotonic: true,
      dataPoints: [
        {
          attributes: { region: "us-east", service: "app1", instance: "i-12345", transaction_id: "tx-1001" },
          timeUnixNano: "1640995200000000000",
          startTimeUnixNano: "1640995100000000000",
          value: 9500,
          seriesKey: "app.counter.resets|region=us-east,service=app1,instance=i-12345,transaction_id=tx-1001"
        },
        {
          attributes: { region: "us-west", service: "app1", instance: "i-67890", transaction_id: "tx-1002" },
          timeUnixNano: "1640995200000000000",
          startTimeUnixNano: "1640995100000000000",
          value: 8200,
          seriesKey: "app.counter.resets|region=us-west,service=app1,instance=i-67890,transaction_id=tx-1002"
        },
        {
          attributes: { region: "eu-central", service: "app2", instance: "i-abcde", transaction_id: "tx-1003" },
          timeUnixNano: "1640995200000000000",
          startTimeUnixNano: "1640995100000000000",
          value: 1250,
          seriesKey: "app.counter.resets|region=eu-central,service=app2,instance=i-abcde,transaction_id=tx-1003"
        }
      ],
      attributeKeys: ["region", "service", "instance", "transaction_id"],
      resourceIds: ["resource-1"],
      scopeIds: ["scope-1"]
    }
  },
  metricCount: 5,
  totalSeries: 19,
  totalDataPoints: 19
};

// Sample data for demonstration - second snapshot
const sampleSnapshotB: ParsedSnapshot = {
  id: "sample-snapshot-B",
  timestamp: Date.now(), // now
  resources: [
    {
      id: "resource-1",
      attributes: {
        "service.name": "sample-service",
        "service.version": "1.0.0",
        "deployment.environment": "development"
      },
      scopes: [
        {
          id: "scope-1",
          name: "io.opentelemetry.runtime",
          version: "1.0.0",
          metricIds: ["metric-1", "metric-2", "metric-3", "metric-4", "metric-5"]
        }
      ]
    }
  ],
  metrics: {
    "metric-1": {
      id: "metric-1",
      name: "system.cpu.usage",
      description: "CPU usage",
      unit: "percent",
      type: "gauge" as MetricType,
      dataPoints: [
        {
          attributes: { cpu: "cpu0", host: "host1", region: "us-east-1", zone: "us-east-1a", rack: "rack-101" },
          timeUnixNano: "1640995200000000000",
          startTimeUnixNano: "1640995100000000000",
          value: 65.2, // increased
          seriesKey: "system.cpu.usage|cpu=cpu0,host=host1,region=us-east-1,zone=us-east-1a,rack=rack-101"
        },
        {
          attributes: { cpu: "cpu1", host: "host1", region: "us-east-1", zone: "us-east-1a", rack: "rack-101" },
          timeUnixNano: "1640995200000000000",
          startTimeUnixNano: "1640995100000000000",
          value: 38.7, // increased
          seriesKey: "system.cpu.usage|cpu=cpu1,host=host1,region=us-east-1,zone=us-east-1a,rack=rack-101"
        },
        {
          attributes: { cpu: "cpu0", host: "host2", region: "us-east-1", zone: "us-east-1b", rack: "rack-102" },
          timeUnixNano: "1640995200000000000",
          startTimeUnixNano: "1640995100000000000",
          value: 50.8, // increased
          seriesKey: "system.cpu.usage|cpu=cpu0,host=host2,region=us-east-1,zone=us-east-1b,rack=rack-102"
        },
        {
          attributes: { cpu: "cpu1", host: "host2", region: "us-east-1", zone: "us-east-1b", rack: "rack-102" },
          timeUnixNano: "1640995200000000000",
          startTimeUnixNano: "1640995100000000000",
          value: 42.1, // increased
          seriesKey: "system.cpu.usage|cpu=cpu1,host=host2,region=us-east-1,zone=us-east-1b,rack=rack-102"
        }
      ],
      attributeKeys: ["cpu", "host", "region", "zone", "rack"],
      resourceIds: ["resource-1"],
      scopeIds: ["scope-1"]
    },
    "metric-2": {
      id: "metric-2",
      name: "system.memory.usage",
      description: "Memory usage",
      unit: "bytes",
      type: "gauge" as MetricType,
      dataPoints: [
        {
          attributes: { state: "used", host: "host1", region: "us-east-1", zone: "us-east-1a", rack: "rack-101" },
          timeUnixNano: "1640995200000000000",
          startTimeUnixNano: "1640995100000000000",
          value: 3221225472, // 3GB (increased)
          seriesKey: "system.memory.usage|state=used,host=host1,region=us-east-1,zone=us-east-1a,rack=rack-101"
        },
        {
          attributes: { state: "free", host: "host1", region: "us-east-1", zone: "us-east-1a", rack: "rack-101" },
          timeUnixNano: "1640995200000000000",
          startTimeUnixNano: "1640995100000000000",
          value: 3221225472, // 3GB (decreased)
          seriesKey: "system.memory.usage|state=free,host=host1,region=us-east-1,zone=us-east-1a,rack=rack-101"
        },
        {
          attributes: { state: "used", host: "host2", region: "us-east-1", zone: "us-east-1b", rack: "rack-102" },
          timeUnixNano: "1640995200000000000",
          startTimeUnixNano: "1640995100000000000",
          value: 2147483648, // 2GB (increased)
          seriesKey: "system.memory.usage|state=used,host=host2,region=us-east-1,zone=us-east-1b,rack=rack-102"
        },
        {
          attributes: { state: "free", host: "host2", region: "us-east-1", zone: "us-east-1b", rack: "rack-102" },
          timeUnixNano: "1640995200000000000",
          startTimeUnixNano: "1640995100000000000",
          value: 3489660928, // 3.25GB (decreased)
          seriesKey: "system.memory.usage|state=free,host=host2,region=us-east-1,zone=us-east-1b,rack=rack-102"
        }
      ],
      attributeKeys: ["state", "host", "region", "zone", "rack"],
      resourceIds: ["resource-1"],
      scopeIds: ["scope-1"]
    },
    "metric-3": {
      id: "metric-3",
      name: "process.uptime",
      description: "Process uptime",
      unit: "s",
      type: "gauge" as MetricType,
      dataPoints: [
        {
          attributes: { service: "app1", host: "host1", region: "us-east-1", pod: "pod-123" },
          timeUnixNano: "1640995200000000000",
          startTimeUnixNano: "1640995100000000000",
          value: 3660.5, // 1h 1m (increased)
          seriesKey: "process.uptime|service=app1,host=host1,region=us-east-1,pod=pod-123"
        },
        {
          attributes: { service: "app1", host: "host2", region: "us-east-1", pod: "pod-456" },
          timeUnixNano: "1640995200000000000",
          startTimeUnixNano: "1640995100000000000",
          value: 7260.0, // 2h 1m (increased)
          seriesKey: "process.uptime|service=app1,host=host2,region=us-east-1,pod=pod-456"
        },
        {
          attributes: { service: "app2", host: "host1", region: "us-east-1", pod: "pod-789" },
          timeUnixNano: "1640995200000000000",
          startTimeUnixNano: "1640995100000000000",
          value: 1860.25, // 0h 31m (increased)
          seriesKey: "process.uptime|service=app2,host=host1,region=us-east-1,pod=pod-789"
        }
      ],
      attributeKeys: ["service", "host", "region", "pod"],
      resourceIds: ["resource-1"],
      scopeIds: ["scope-1"]
    },
    "metric-4": {
      id: "metric-4",
      name: "http.server.requests",
      description: "HTTP server request count",
      unit: "{requests}",
      type: "sum" as MetricType,
      monotonic: true,
      dataPoints: [
        {
          attributes: { method: "GET", path: "/api/users", status: "200", host: "host1", service: "api" },
          timeUnixNano: "1640995200000000000",
          startTimeUnixNano: "1640995100000000000",
          value: 1375, // 125 more requests
          seriesKey: "http.server.requests|method=GET,path=/api/users,status=200,host=host1,service=api"
        },
        {
          attributes: { method: "POST", path: "/api/users", status: "201", host: "host1", service: "api" },
          timeUnixNano: "1640995200000000000",
          startTimeUnixNano: "1640995100000000000",
          value: 590, // 48 more requests
          seriesKey: "http.server.requests|method=POST,path=/api/users,status=201,host=host1,service=api"
        },
        {
          attributes: { method: "GET", path: "/api/users", status: "200", host: "host2", service: "api" },
          timeUnixNano: "1640995200000000000",
          startTimeUnixNano: "1640995100000000000",
          value: 1100, // 114 more requests
          seriesKey: "http.server.requests|method=GET,path=/api/users,status=200,host=host2,service=api"
        },
        {
          attributes: { method: "GET", path: "/api/orders", status: "200", host: "host1", service: "api" },
          timeUnixNano: "1640995200000000000",
          startTimeUnixNano: "1640995100000000000",
          value: 840, // 58 more requests
          seriesKey: "http.server.requests|method=GET,path=/api/orders,status=200,host=host1,service=api"
        },
        {
          attributes: { method: "GET", path: "/api/products", status: "200", host: "host1", service: "api" },
          timeUnixNano: "1640995200000000000",
          startTimeUnixNano: "1640995100000000000",
          value: 480, // 62 more requests
          seriesKey: "http.server.requests|method=GET,path=/api/products,status=200,host=host1,service=api"
        }
      ],
      attributeKeys: ["method", "path", "status", "host", "service"],
      resourceIds: ["resource-1"],
      scopeIds: ["scope-1"]
    },
    "metric-5": {
      id: "metric-5",
      name: "app.counter.resets",
      description: "Counter that was reset",
      type: "sum" as MetricType,
      monotonic: true,
      dataPoints: [
        {
          attributes: { region: "us-east", service: "app1", instance: "i-12345", transaction_id: "tx-1001" },
          timeUnixNano: "1640995200000000000",
          startTimeUnixNano: "1640995100000000000",
          value: 250, // reset!
          seriesKey: "app.counter.resets|region=us-east,service=app1,instance=i-12345,transaction_id=tx-1001"
        },
        {
          attributes: { region: "us-west", service: "app1", instance: "i-67890", transaction_id: "tx-1002" },
          timeUnixNano: "1640995200000000000",
          startTimeUnixNano: "1640995100000000000",
          value: 8500, // increased by 300
          seriesKey: "app.counter.resets|region=us-west,service=app1,instance=i-67890,transaction_id=tx-1002"
        },
        {
          attributes: { region: "eu-central", service: "app2", instance: "i-abcde", transaction_id: "tx-1003" },
          timeUnixNano: "1640995200000000000",
          startTimeUnixNano: "1640995100000000000",
          value: 1450, // increased by 200
          seriesKey: "app.counter.resets|region=eu-central,service=app2,instance=i-abcde,transaction_id=tx-1003"
        }
      ],
      attributeKeys: ["region", "service", "instance", "transaction_id"],
      resourceIds: ["resource-1"],
      scopeIds: ["scope-1"]
    }
  },
  metricCount: 5,
  totalSeries: 19,
  totalDataPoints: 19
};

function App() {
  const addSnapshot = useStore(state => state.addSnapshot);
  const [activeView, setActiveView] = useState<'metrics' | 'cardinality'>('metrics');

  // Load sample data on init for demonstration
  useEffect(() => {
    // First add snapshot A (older)
    addSnapshot(sampleSnapshotA);
    console.log("Added sample snapshot A to store");
    
    // Then add snapshot B (newer) - this will trigger a diff computation
    setTimeout(() => {
      addSnapshot(sampleSnapshotB);
      console.log("Added sample snapshot B to store");
      
      // Emit snapshot loaded events to trigger diffing and cardinality analysis
      eventBus.emit('snapshot.loaded', {
        snapshotId: sampleSnapshotA.id,
        frame: 'A',
        fileName: 'sample-A.json',
        timestamp: Date.now()
      });
      
      eventBus.emit('snapshot.loaded', {
        snapshotId: sampleSnapshotB.id,
        frame: 'B',
        fileName: 'sample-B.json',
        timestamp: Date.now()
      });
    }, 500); // Small delay to ensure A is processed first
  }, [addSnapshot]);
  
  // Initialize the runners
  useEffect(() => {
    // Import and initialize diffRunner
    const diffRunnerPromise = import('./services/diffRunner').then(({ initDiffRunner }) => {
      return initDiffRunner();
    });
    
    // Import and initialize cardinalityRunner
    const cardinalityRunnerPromise = import('./services/cardinalityRunner').then(({ initCardinalityRunner }) => {
      return initCardinalityRunner();
    });
    
    // Return cleanup function
    return () => {
      diffRunnerPromise.then(cleanup => cleanup && cleanup());
      cardinalityRunnerPromise.then(cleanup => cleanup && cleanup());
    };
  }, []);

  // Handle view selection
  const handleViewChange = (view: 'metrics' | 'cardinality') => {
    setActiveView(view);
    // Emit event for other components to respond
    eventBus.emit('ui.mode.change', view);
  };

  return (
    <ThemeProvider>
      <ErrorBoundary>
        <Layout>
          <div className="p-4">
            <div className="mb-4 flex justify-between items-center">
              <SnapshotUploader onSnapshotLoaded={(id) => console.log('Snapshot loaded:', id)} />
              
              <div className="flex space-x-2">
                <button
                  className={`px-4 py-2 rounded-md ${
                    activeView === 'metrics'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                  onClick={() => handleViewChange('metrics')}
                >
                  Metrics View
                </button>
                <button
                  className={`px-4 py-2 rounded-md ${
                    activeView === 'cardinality'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                  onClick={() => handleViewChange('cardinality')}
                >
                  Cardinality Analyzer
                </button>
              </div>
            </div>
            
            {activeView === 'metrics' ? (
              <MetricsView />
            ) : (
              <div className="space-y-6">
                <CardinalityOverview />
                <WhatIfSimulator />
              </div>
            )}
          </div>
        </Layout>
      </ErrorBoundary>
    </ThemeProvider>
  )
}

export default App