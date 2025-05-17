export type SeriesKey = string;

export function buildSeriesKey(
  metricName: string,
  attrs: Record<string, string | number | boolean>
): SeriesKey {
  const kv = Object.entries(attrs)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${String(v)}`)
    .join(',');
  return `${metricName}|${kv}`;
}
