import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { parseOtlpJson } from '../otlpJsonParser.worker';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadFixture(name: string): string {
  const file = resolve(__dirname, '../../../tests/fixtures', name);
  return readFileSync(file, 'utf8');
}

describe('otlpJsonParser.worker', () => {
  it('parses OTLP JSON snapshot', () => {
    const json = loadFixture('sample.json');
    const snapshot = parseOtlpJson(json);

    expect(snapshot.metricCount).toBe(4);
    expect(snapshot.totalDataPoints).toBe(7);
    expect(snapshot.totalSeries).toBe(7);
  });
});
