import { useState } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/layout/Layout'
import { SnapshotUploader } from './components/data-providers/SnapshotUploader'
import { MetricsList } from './components/metrics/MetricsList'
import { EmptyState } from './components/ui/EmptyState'

function App() {
  const [activeSnapshotId, setActiveSnapshotId] = useState<string | null>(null)

  return (
    <ThemeProvider>
      <Layout>
        <div className="flex flex-col space-y-6 p-6">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                OTLP Process Metrics Explorer
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400">
                Explore and analyze your OpenTelemetry metrics
              </p>
            </div>
            <SnapshotUploader onSnapshotLoaded={setActiveSnapshotId} />
          </header>

          <main className="flex-1">
            {activeSnapshotId ? (
              <MetricsList snapshotId={activeSnapshotId} />
            ) : (
              <EmptyState
                title="No data loaded"
                description="Upload an OTLP JSON file to get started"
                icon="chart"
              />
            )}
          </main>
        </div>
      </Layout>
    </ThemeProvider>
  )
}

export default App
