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
  buildMixGenerationPrompt,
} from './viggleLogic';
import { compute4kDimensions, getTemplate4kVideoUrl } from './templateMedia';
import {
  MOTION_TEMPLATES,
  MOVING_TEMPLATES,
  CLASSIC_MEME_TEMPLATES,
  HOME_FEATURED_TEMPLATES,
  HOME_TOP_TEMPLATES,
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

test('motion template library includes all exported classic, moving, VFX & 3D World templates and filters accurately', () => {
  assert.ok(MOTION_TEMPLATES.length >= 250, `Expected >=250 templates, got ${MOTION_TEMPLATES.length}`);
  assert.equal(CLASSIC_MEME_TEMPLATES.length, 33);
  assert.ok(MOVING_TEMPLATES.filter((t) => Boolean(t.videoUrl)).length >= 210);
  assert.deepEqual(filterMotionTemplates(MOTION_TEMPLATES, 'All', '').length, MOTION_TEMPLATES.length);

  const uniqueIds = new Set(MOTION_TEMPLATES.map((t) => t.id));
  assert.equal(uniqueIds.size, MOTION_TEMPLATES.length, 'Every template id must be unique');

  for (const tpl of MOTION_TEMPLATES) {
    assert.equal(
      /viggle/i.test(`${tpl.id} ${tpl.name} ${tpl.creator} ${tpl.prompt}`),
      false,
      `Template ${tpl.id} contains exposed Viggle branding`
    );
  }

  for (const cat of TEMPLATE_CATEGORIES.filter((c) => c !== 'All')) {
    const subset = filterMotionTemplates(MOTION_TEMPLATES, cat, '');
    assert.ok(subset.length >= 10, `Category ${cat} should have at least 10 templates, got ${subset.length}`);
    assert.ok(subset.every((t) => t.category === cat));
  }

  const yachty = filterMotionTemplates(MOTION_TEMPLATES, 'All', 'yachty');
  assert.equal(yachty.length, 1);
  assert.equal(yachty[0].id, 'tpl-yachty-walk');

  const soccer = filterMotionTemplates(MOTION_TEMPLATES, 'Memes', 'soccer');
  assert.equal(soccer[0]?.id, 'tpl-ronaldo-siu');

  const windmill = filterMotionTemplates(MOTION_TEMPLATES, '3D Worlds', 'Windmill Village 3D World');
  assert.equal(windmill.length, 1);

  assert.equal(HOME_FEATURED_TEMPLATES.length, 6);
  assert.ok(HOME_FEATURED_TEMPLATES.every((t) => Boolean(t.videoUrl)));
  assert.equal(new Set(HOME_FEATURED_TEMPLATES.map((t) => t.category)).size >= 4, true);

  assert.equal(HOME_TOP_TEMPLATES.length, 5);
  assert.ok(HOME_TOP_TEMPLATES.every((t) => Boolean(t.videoUrl)));
  const featuredIds = new Set(HOME_FEATURED_TEMPLATES.map((t) => t.id));
  assert.ok(HOME_TOP_TEMPLATES.every((t) => !featuredIds.has(t.id)));
});

test('4K UHD dimension calculator preserves aspect ratios with even 2160p/3840p outputs', () => {
  assert.deepEqual(compute4kDimensions(480, 270), { width: 3840, height: 2160 });
  assert.deepEqual(compute4kDimensions(480, 854), { width: 2158, height: 3840 });
  assert.deepEqual(compute4kDimensions(480, 480), { width: 2160, height: 2160 });
  assert.deepEqual(compute4kDimensions(640, 480), { width: 2880, height: 2160 });
  assert.equal(
    getTemplate4kVideoUrl('tpl-yachty-walk', '/assets/viggle-templates/clip.mp4'),
    '/api/templates/4k/tpl-yachty-walk.mp4'
  );
});

test('Mix Studio prompt builder incorporates green screen, refine, physics, and multi-track options', () => {
  const mixPrompt = buildMixGenerationPrompt({
    basePrompt: '',
    templateName: 'Kitchen Dance Routine',
    templateCategory: 'Dance',
    bgMode: 'green',
    characterRefine: true,
    lipSync: true,
    footLock: true,
    isTextOnly: false,
    secondCharacterName: 'Blaze',
  });
  assert.match(mixPrompt, /Kitchen Dance Routine/);
  assert.match(mixPrompt, /green screen/i);
  assert.match(mixPrompt, /multi-angle/i);
  assert.match(mixPrompt, /lip sync/i);
  assert.match(mixPrompt, /foot-lock/i);
  assert.match(mixPrompt, /Blaze/);

  const t2v = buildMixGenerationPrompt({
    basePrompt: '  Cyberpunk samurai in neon alley  ',
    templateName: 'Ignored',
    templateCategory: 'Action',
    bgMode: 'green',
    characterRefine: true,
    lipSync: true,
    footLock: true,
    isTextOnly: true,
  });
  assert.equal(t2v, 'Cyberpunk samurai in neon alley');
});
