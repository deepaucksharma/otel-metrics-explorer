import React, { Component, ReactNode } from 'react'
import { eventBus } from '../../services/eventBus'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    eventBus.emit('data.error', {
      message: 'UI rendering error',
      code: 'UI_CRASH',
      detail: { error, info }
    })
  }

  private handleReset = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReset={this.handleReset} />
    }
    return this.props.children
  }
}

interface ErrorFallbackProps {
  onReset: () => void
}

export function ErrorFallback({ onReset }: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 space-y-4">
      <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Something went wrong</h2>
      <p className="text-neutral-600 dark:text-neutral-400 text-center">
        An unexpected error occurred while rendering this section.
      </p>
      <button
        onClick={onReset}
        className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700"
      >
        Try Again
      </button>
    </div>
  )
}
