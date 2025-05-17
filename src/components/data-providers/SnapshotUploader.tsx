import { useState, ChangeEvent, useEffect, useRef } from 'react';
import { eventBus } from '../../services/eventBus';
import { useStore } from '../../services/stateStore';
import { ParsedSnapshot } from '../../types/otlp';

// Import worker as a module
// In a real implementation, this would use proper worker loader and TypeScript worker setup
const OtlpJsonParserWorker = () => {
  return new Worker(new URL('../../workers/otlpJsonParser.worker.ts', import.meta.url), { type: 'module' });
};

interface SnapshotUploaderProps {
  onSnapshotLoaded: (snapshotId: string) => void;
}

export function SnapshotUploader({ onSnapshotLoaded }: SnapshotUploaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [worker, setWorker] = useState<Worker | null>(null);
  const responseHandlers = useRef<Map<string, (data: any) => void>>(new Map());
  
  const addSnapshot = useStore(state => state.addSnapshot);
  
  // Initialize the worker
  useEffect(() => {
    const newWorker = OtlpJsonParserWorker();
    
    // Set up message handler
    newWorker.onmessage = (event) => {
      const { id, success, data, error } = event.data;
      
      // Find and call the handler for this message ID
      const handler = responseHandlers.current.get(id);
      if (handler) {
        handler({ success, data, error });
        // Clean up the handler
        responseHandlers.current.delete(id);
      }
    };
    
    setWorker(newWorker);
    
    // Clean up the worker on unmount
    return () => {
      newWorker.terminate();
    };
  }, []);
  
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !worker) return;
    
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
      
      // Process with worker
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
  
  // Process OTLP JSON using worker
  const processOtlpJson = async (content: string, fileName: string): Promise<string> => {
    if (!worker) {
      throw new Error('Worker not initialized');
    }
    
    // Create a unique ID for this request
    const messageId = `parse-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create a promise that will be resolved when the worker responds
    const responsePromise = new Promise<{ success: boolean, data?: ParsedSnapshot, error?: string }>((resolve) => {
      responseHandlers.current.set(messageId, resolve);
    });
    
    // Send the message to the worker
    worker.postMessage({
      id: messageId,
      action: 'parse',
      payload: {
        jsonString: content,
        options: {
          snapshotId: `snapshot-${Date.now()}`,
          timestamp: Date.now(),
          includeZeroValues: true,
          normalizeAttributes: true,
          computeStatistics: true
        }
      }
    });
    
    // Wait for the response
    const response = await responsePromise;
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to process OTLP data');
    }
    
    // Add to store
    addSnapshot(response.data);
    
    return response.data.id;
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
            disabled={isLoading || !worker}
          />
        </label>
      </div>
      {error && (
        <p className="text-error-500 text-sm mt-2">{error}</p>
      )}
    </div>
  );
}
