import { describe, it, expect } from 'vitest';
import { buildSeriesKey } from '../seriesKey';

describe('buildSeriesKey', () => {
  it('creates deterministic key from attrs', () => {
    const attrs = { 'state': 'user', 'process.pid': 1234, 'host.name': 'alpha' };
    const key = buildSeriesKey('process.cpu.time', attrs);
    expect(key).toBe('process.cpu.time|host.name=alpha,process.pid=1234,state=user');
  });
});
