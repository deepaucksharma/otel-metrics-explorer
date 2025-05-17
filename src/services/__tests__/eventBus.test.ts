import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { eventBus } from '../eventBus';

describe('EventBus', () => {
  beforeEach(() => {
    // Clear all event subscriptions before each test
    eventBus.clearAll();
  });

  afterEach(() => {
    // Ensure we clear history and subscriptions after each test
    eventBus.setHistoryEnabled(false);
    eventBus.clearAll();
  });

  it('should subscribe to events and receive them', () => {
    const mockHandler = vi.fn();
    eventBus.on('test.event', mockHandler);
    
    const payload = { data: 'test-data' };
    eventBus.emit('test.event', payload);
    
    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(mockHandler).toHaveBeenCalledWith(payload);
  });

  it('should allow unsubscribing from events', () => {
    const mockHandler = vi.fn();
    const unsubscribe = eventBus.on('test.event', mockHandler);
    
    // Unsubscribe and ensure the handler is not called
    unsubscribe();
    eventBus.emit('test.event', { data: 'test-data' });
    
    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('should support once subscriptions', () => {
    const mockHandler = vi.fn();
    eventBus.once('test.event', mockHandler);
    
    // Emit twice, but handler should only be called once
    eventBus.emit('test.event', { count: 1 });
    eventBus.emit('test.event', { count: 2 });
    
    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(mockHandler).toHaveBeenCalledWith({ count: 1 });
  });

  it('should track event history when enabled', () => {
    eventBus.setHistoryEnabled(true);
    
    const event1 = { type: 'create' };
    const event2 = { type: 'update' };
    
    eventBus.emit('test.create', event1);
    eventBus.emit('test.update', event2);
    
    const history = eventBus.getEventHistory();
    
    expect(history.length).toBe(2);
    expect(history[0].event).toBe('test.create');
    expect(history[0].data).toEqual(event1);
    expect(history[1].event).toBe('test.update');
    expect(history[1].data).toEqual(event2);
  });
  
  it('should handle async event handlers with emitAsync', async () => {
    let asyncResult = false;
    
    const asyncHandler = async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      asyncResult = true;
    };
    
    eventBus.on('test.async', asyncHandler);
    
    await eventBus.emitAsync('test.async', {});
    
    expect(asyncResult).toBe(true);
  });
});
