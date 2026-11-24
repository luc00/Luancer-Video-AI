import test from 'node:test';
import assert from 'node:assert/strict';
import {
  VIGGLE_AI_PLANS,
  PINOC_PLANS,
  getDisplayPrice,
  formatUsd,
  validateNewsletterEmail,
  calculateJobCredits,
  createStudioJob,
  advanceStudioJob,
  parseRoute,
  filterMotionTemplates,
  TEMPLATE_CATEGORIES,
} from './viggleLogic';
import {
  MOTION_TEMPLATES,
  MOVING_TEMPLATES,
  CLASSIC_MEME_TEMPLATES,
} from '../data/viggleData';

test('pricing toggles accurately between monthly and yearly (-20%) prices', () => {
  const pro = VIGGLE_AI_PLANS.find((p) => p.id === 'pro')!;
  const live = VIGGLE_AI_PLANS.find((p) => p.id === 'live')!;
  const max = VIGGLE_AI_PLANS.find((p) => p.id === 'max')!;
  const pinocCreator = PINOC_PLANS.find((p) => p.id === 'pinoc-creator')!;

  assert.equal(formatUsd(getDisplayPrice(pro, 'monthly')), '$9.99');
  assert.equal(formatUsd(getDisplayPrice(pro, 'yearly')), '$7.99');
  assert.equal(formatUsd(getDisplayPrice(live, 'monthly')), '$19.99');
  assert.equal(formatUsd(getDisplayPrice(live, 'yearly')), '$15.99');
  assert.equal(formatUsd(getDisplayPrice(max, 'monthly')), '$79.99');
  assert.equal(formatUsd(getDisplayPrice(max, 'yearly')), '$63.99');
  assert.equal(formatUsd(getDisplayPrice(pinocCreator, 'yearly')), '$10.39');
});

test('newsletter email validator catches empty and malformed addresses', () => {
  assert.equal(validateNewsletterEmail('').valid, false);
  assert.equal(validateNewsletterEmail('not-an-email').valid, false);
  assert.equal(validateNewsletterEmail('user@domain').valid, false);
  const ok = validateNewsletterEmail('  Creator@Luancer.ai ');
  assert.equal(ok.valid, true);
  assert.equal(ok.normalized, 'creator@luancer.ai');
});

test('studio job creation and progress state transitions work deterministically', () => {
  const cost = calculateJobCredits('pinoc', 'JST-2 World', true);
  assert.equal(cost, 7);

  let job = createStudioJob({
    id: 'job_1',
    mode: 'mix',
    characterName: 'Cyber Runner',
    templateName: 'Sidekick Dance',
    prompt: '',
    model: 'JST-2',
    hd: false,
    outputUrl: '/test.jpg',
  });
  assert.equal(job.status, 'queued');
  assert.equal(job.creditsUsed, 4);

  job = advanceStudioJob(job, 40);
  assert.equal(job.status, 'rendering');
  assert.equal(job.progress, 52);

  job = advanceStudioJob(job, 60);
  assert.equal(job.status, 'completed');
  assert.equal(job.progress, 100);
});

test('route parser resolves home, meme, pricing, studio modes, template query params, and blog slugs', () => {
  assert.deepEqual(parseRoute('/'), { id: 'home' });
  assert.deepEqual(parseRoute('/meme'), { id: 'meme' });
  assert.deepEqual(parseRoute('/pricing'), { id: 'pricing' });
  assert.deepEqual(parseRoute('/studio/multi-editor'), {
    id: 'studio',
    studioMode: 'multi-editor',
  });
  assert.deepEqual(parseRoute('/studio/mix?template=tpl-yachty-walk&view=create'), {
    id: 'studio',
    studioMode: 'image-to-video',
    templateId: 'tpl-yachty-walk',
    studioView: 'create',
  });
  assert.deepEqual(parseRoute('/blog/black-mirror-experience-viggle-api-case-study'), {
    id: 'blog',
    slug: 'black-mirror-experience-viggle-api-case-study',
  });
});

test('motion template library includes all Viggle classic & moving templates and filters accurately', () => {
  assert.ok(MOTION_TEMPLATES.length >= 66);
  assert.equal(CLASSIC_MEME_TEMPLATES.length, 33);
  assert.ok(MOVING_TEMPLATES.filter((t) => Boolean(t.videoUrl)).length >= 33);
  assert.deepEqual(filterMotionTemplates(MOTION_TEMPLATES, 'All', '').length, MOTION_TEMPLATES.length);

  for (const cat of TEMPLATE_CATEGORIES.filter((c) => c !== 'All')) {
    const subset = filterMotionTemplates(MOTION_TEMPLATES, cat, '');
    assert.ok(subset.length >= 2, `Category ${cat} should have at least 2 templates`);
    assert.ok(subset.every((t) => t.category === cat));
  }

  const yachty = filterMotionTemplates(MOTION_TEMPLATES, 'All', 'yachty');
  assert.equal(yachty.length, 1);
  assert.equal(yachty[0].id, 'tpl-yachty-walk');

  const soccer = filterMotionTemplates(MOTION_TEMPLATES, 'Memes', 'soccer');
  assert.equal(soccer[0]?.id, 'tpl-ronaldo-siu');
});
