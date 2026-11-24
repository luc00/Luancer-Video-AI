import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

export type VitalName = 'FP' | 'FCP' | 'LCP' | 'INP' | 'CLS' | 'TTFB';
export type VitalRating = 'good' | 'needs-improvement' | 'poor';

export interface VitalEntry {
  name: VitalName;
  value: number;
  rating?: VitalRating;
  target?: string;
}

const THRESHOLDS: Record<VitalName, [number, number]> = {
  FP: [1000, 2000],
  FCP: [1800, 3000],
  LCP: [2500, 4000],
  INP: [200, 500],
  CLS: [0.1, 0.25],
  TTFB: [800, 1800],
};

export function classifyMetricRating(name: VitalName, value: number): VitalRating {
  const [goodMax, poorMin] = THRESHOLDS[name];
  if (value <= goodMax) return 'good';
  if (value <= poorMin) return 'needs-improvement';
  return 'poor';
}

export function getMetricCategory(name: VitalName): string {
  if (name === 'INP') return 'Interaction Readiness';
  if (name === 'FP' || name === 'FCP' || name === 'LCP') return 'Paint';
  if (name === 'CLS') return 'Layout Stability';
  return 'Network';
}

export function formatVitalLog(entry: VitalEntry): string {
  const rating = entry.rating ?? classifyMetricRating(entry.name, entry.value);
  const category = getMetricCategory(entry.name);
  const formattedValue =
    entry.name === 'CLS' ? entry.value.toFixed(3) : `${Math.round(entry.value)} ms`;
  const targetSuffix = entry.target ? ` (${entry.target})` : '';
  return `[WebVitals] ${entry.name} [${category}]: ${formattedValue} (${rating})${targetSuffix}`;
}

export interface TrackingOptions {
  isDev?: boolean;
  logger?: (message: string, detail?: unknown) => void;
}

export function initPerformanceTracking(options: TrackingOptions = {}): () => void {
  const isDev = options.isDev ?? Boolean(import.meta.env?.DEV);
  if (!isDev || typeof window === 'undefined') {
    return () => {};
  }

  const log = options.logger ?? ((msg: string, detail?: unknown) => console.info(msg, detail ?? ''));

  const handleMetric = (metric: Metric) => {
    const name = metric.name as VitalName;
    const target =
      'attribution' in metric && metric.attribution && typeof metric.attribution === 'object'
        ? (metric.attribution as { interactionTarget?: string }).interactionTarget
        : undefined;
    log(
      formatVitalLog({
        name,
        value: metric.value,
        rating: metric.rating,
        target,
      }),
      { id: metric.id, navigationType: metric.navigationType }
    );
  };

  onFCP(handleMetric, { reportAllChanges: true });
  onLCP(handleMetric, { reportAllChanges: true });
  onINP(handleMetric, { reportAllChanges: true });
  onCLS(handleMetric);
  onTTFB(handleMetric);

  let paintObserver: PerformanceObserver | null = null;
  if (typeof PerformanceObserver !== 'undefined') {
    try {
      paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-paint') {
            log(
              formatVitalLog({
                name: 'FP',
                value: entry.startTime,
              })
            );
          }
        }
      });
      paintObserver.observe({ type: 'paint', buffered: true });
    } catch {
      paintObserver = null;
    }
  }

  return () => {
    paintObserver?.disconnect();
  };
}
