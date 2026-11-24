import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyMetricRating,
  formatVitalLog,
  getMetricCategory,
  initPerformanceTracking,
} from './webVitals';

test('classifyMetricRating maps paint and interaction thresholds accurately', () => {
  assert.equal(classifyMetricRating('FCP', 900), 'good');
  assert.equal(classifyMetricRating('FCP', 2100), 'needs-improvement');
  assert.equal(classifyMetricRating('FCP', 3400), 'poor');

  assert.equal(classifyMetricRating('INP', 120), 'good');
  assert.equal(classifyMetricRating('INP', 320), 'needs-improvement');
  assert.equal(classifyMetricRating('INP', 650), 'poor');

  assert.equal(classifyMetricRating('CLS', 0.04), 'good');
  assert.equal(classifyMetricRating('CLS', 0.18), 'needs-improvement');
  assert.equal(classifyMetricRating('CLS', 0.4), 'poor');
});

test('formatVitalLog outputs readable dev console lines for paint and interaction readiness', () => {
  assert.equal(getMetricCategory('INP'), 'Interaction Readiness');
  assert.equal(getMetricCategory('LCP'), 'Paint');

  const fcpLine = formatVitalLog({ name: 'FCP', value: 412.6 });
  assert.equal(fcpLine, '[WebVitals] FCP [Paint]: 413 ms (good)');

  const inpLine = formatVitalLog({ name: 'INP', value: 48.2, target: 'button#create' });
  assert.equal(
    inpLine,
    '[WebVitals] INP [Interaction Readiness]: 48 ms (good) (button#create)'
  );

  const clsLine = formatVitalLog({ name: 'CLS', value: 0.0124 });
  assert.equal(clsLine, '[WebVitals] CLS [Layout Stability]: 0.012 (good)');
});

test('initPerformanceTracking is a safe no-op when isDev is false', () => {
  let logged = false;
  const cleanup = initPerformanceTracking({
    isDev: false,
    logger: () => {
      logged = true;
    },
  });
  cleanup();
  assert.equal(logged, false);
});
