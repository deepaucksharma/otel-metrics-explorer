interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: 'chart' | 'file' | 'data' | string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ 
  title, 
  description, 
  icon = 'data', 
  actionLabel,
  onAction
}: EmptyStateProps) {
  // Determine if icon is a string emoji or a predefined icon type
  const isEmojiIcon = icon && !['chart', 'file', 'data'].includes(icon);
  
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {isEmojiIcon ? (
        <div className="text-4xl mb-4">{icon}</div>
      ) : (
        <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-100 flex items-center justify-center mb-4">
          {icon === 'chart' && <ChartIcon className="w-10 h-10 text-primary-600 dark:text-primary-600" />}
          {icon === 'file' && <FileIcon className="w-10 h-10 text-primary-600 dark:text-primary-600" />}
          {icon === 'data' && <DataIcon className="w-10 h-10 text-primary-600 dark:text-primary-600" />}
        </div>
      )}
      
      <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">{title}</h2>
      
      {description && (
        <p className="text-neutral-600 dark:text-neutral-400 text-center max-w-md mb-4">{description}</p>
      )}
      
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// Icon components
function ChartIcon({ className = "h-6 w-6" }) {
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
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}

function FileIcon({ className = "h-6 w-6" }) {
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
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function DataIcon({ className = "h-6 w-6" }) {
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
        d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
      />
    </svg>
  );
}
