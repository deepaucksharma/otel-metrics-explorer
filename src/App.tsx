import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/layout/Layout'
import { MetricsView } from './components/metrics/MetricsView'
import { ErrorBoundary } from './components/ui/ErrorBoundary'

function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <Layout>
          <MetricsView />
        </Layout>
      </ErrorBoundary>
    </ThemeProvider>
  )
}

export default App
