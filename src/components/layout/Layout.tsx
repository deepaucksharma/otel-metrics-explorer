import { ReactNode } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { SidebarNavigator } from './SidebarNavigator';
import { useStore } from '../../services/stateStore';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { selectedSnapshotId } = useStore(state => state.uiState);
  
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">
      <header className="sticky top-0 z-10 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-xl text-primary-600 dark:text-primary-500">
              OTLP Explorer
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              className="p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
              onClick={toggleDarkMode}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </header>
      
      <div className="flex flex-1 h-[calc(100vh-64px)]">
        {/* Sidebar navigation */}
        <div className="w-64 border-r border-neutral-200 dark:border-neutral-800 h-full">
          <SidebarNavigator />
        </div>
        
        {/* Main content area */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
      
      <footer className="border-t border-neutral-200 dark:border-neutral-800 py-3">
        <div className="px-4 text-center text-neutral-500 dark:text-neutral-500 text-sm">
          OTLP Process Metrics Explorer - Open Source Project
        </div>
      </footer>
    </div>
  );
}

// Icon components
function SunIcon({ className = "h-6 w-6" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function MoonIcon({ className = "h-6 w-6" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  );
}
