/**
 * Formatting utilities for displaying values in the UI
 */

/**
 * Format a numeric value with thousands separators
 */
export function formatNumber(value: number): string {
  if (value === undefined || value === null) return '-';
  
  return new Intl.NumberFormat().format(value);
}

/**
 * Format a byte value to human-readable format (KB, MB, GB, etc.)
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format a cost value with currency symbol
 */
export function formatCost(value: number, currency: string = 'USD'): string {
  if (value === undefined || value === null) return '-';
  
  // Format based on magnitude
  if (value < 0.01) {
    return `< $0.01`;
  }
  
  let currencySymbol = '$';
  switch (currency) {
    case 'EUR':
      currencySymbol = '€';
      break;
    case 'GBP':
      currencySymbol = '£';
      break;
    // Add more currencies as needed
  }
  
  return `${currencySymbol}${value.toFixed(2)}`;
}

/**
 * Format a percentage value
 */
export function formatPercent(value: number): string {
  if (value === undefined || value === null) return '-';
  
  return `${Math.round(value * 100)}%`;
}

/**
 * Format a duration in milliseconds to a human-readable string
 */
export function formatDuration(milliseconds: number): string {
  if (milliseconds === undefined || milliseconds === null) return '-';
  
  if (milliseconds < 1000) {
    return `${milliseconds.toFixed(0)}ms`;
  }
  
  const seconds = milliseconds / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  
  const minutes = seconds / 60;
  if (minutes < 60) {
    const secs = Math.floor(seconds % 60);
    return `${Math.floor(minutes)}m ${secs}s`;
  }
  
  const hours = minutes / 60;
  const mins = Math.floor(minutes % 60);
  return `${Math.floor(hours)}h ${mins}m`;
}