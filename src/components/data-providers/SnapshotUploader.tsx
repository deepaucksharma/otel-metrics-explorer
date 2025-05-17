import { useState, ChangeEvent } from 'react';
import { eventBus } from '../../services/eventBus';
import { useStore } from '../../services/stateStore';

interface SnapshotUploaderProps {
  onSnapshotLoaded: (snapshotId: string) => void;
}

export function SnapshotUploader({ onSnapshotLoaded }: SnapshotUploaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const addSnapshot = useStore(state => state.addSnapshot);
  
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Reset states
    setIsLoading(true);
    setError(null);
    
    try {
      // Emit loading event
      eventBus.emit('snapshot.loading', {
        fileName: file.name,
        fileSize: file.size,
        timestamp: Date.now()
      });
      
      // Read the file
      const content = await readFileAsText(file);
      
      // TODO: In a real implementation, this would be processed by a worker
      // For now, we'll do basic processing here
      const snapshotId = await processOtlpJson(content, file.name);
      
      // Success - notify callback
      onSnapshotLoaded(snapshotId);
      
      // Emit loaded event
      eventBus.emit('snapshot.loaded', {
        snapshotId,
        fileName: file.name,
        timestamp: Date.now()
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error loading file';
      setError(errorMessage);
      
      // Emit error event
      eventBus.emit('snapshot.error', {
        fileName: file.name,
        error: errorMessage,
        timestamp: Date.now()
      });
    } finally {
      setIsLoading(false);
      // Reset the input
      e.target.value = '';
    }
  };
  
  // Placeholder for actual OTLP processing
  const processOtlpJson = async (content: string, fileName: string): Promise<string> => {
    try {
      // Parse the JSON
      const data = JSON.parse(content);
      
      // Very basic validation to check if it's OTLP format
      if (!data.resourceMetrics) {
        throw new Error('Invalid OTLP format: missing resourceMetrics');
      }
      
      // In a real implementation, we would:
      // 1. Use the OtlpJsonParser worker to parse the data
      // 2. Transform it into our internal data model
      // 3. Calculate statistics and optimize the data structure
      
      // For this demo, create a simplified snapshot with basic structure
      const snapshotId = `snapshot-${Date.now()}`;
      
      // Create a simple parsed snapshot for demo
      const snapshot = {
        id: snapshotId,
        timestamp: Date.now(),
        resources: [],
        metrics: {},
        metricCount: 0,
        totalSeries: 0,
        totalDataPoints: 0
      };
      
      // Add to store
      addSnapshot(snapshot);
      
      return snapshotId;
    } catch (err) {
      console.error('Error processing OTLP JSON:', err);
      throw new Error('Failed to process OTLP data: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };
  
  // Helper to read file
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = (e) => {
        reject(new Error('Error reading file: ' + e.target?.error?.message));
      };
      reader.readAsText(file);
    });
  };
  
  return (
    <div className="flex flex-col items-end">
      <div className="flex items-center space-x-4">
        <label className="btn btn-primary cursor-pointer">
          <span>{isLoading ? 'Loading...' : 'Upload OTLP JSON'}</span>
          <input
            type="file"
            className="hidden"
            accept=".json"
            onChange={handleFileUpload}
            disabled={isLoading}
          />
        </label>
      </div>
      {error && (
        <p className="text-error-500 text-sm mt-2">{error}</p>
      )}
    </div>
  );
}
