import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BLUEPRINT_LIMITS,
  sanitizeCreationFields,
  sanitizeUserProfileFields,
  validateVideoRequestPayload,
} from './videoValidation';

test('validateVideoRequestPayload validates text-to-video payloads and aspect ratios', () => {
  const empty = validateVideoRequestPayload({ mode: 'text-to-video', prompt: '   ', aspectRatio: '16:9' });
  assert.equal(empty.valid, false);

  const ok = validateVideoRequestPayload({
    mode: 'text-to-video',
    prompt: 'A cyberpunk dancer performing under rain',
    aspectRatio: '9:16',
  });
  assert.equal(ok.valid, true);
  if (ok.valid) {
    assert.equal(ok.data.aspectRatio, '9:16');
    assert.equal(ok.data.mode, 'text-to-video');
  }
});

test('validateVideoRequestPayload enforces image data for image-to-video and strips data URL prefix', () => {
  const missingImg = validateVideoRequestPayload({
    mode: 'image-to-video',
    prompt: 'Wave hello and smile',
    aspectRatio: '16:9',
  });
  assert.equal(missingImg.valid, false);

  const validImg = validateVideoRequestPayload({
    mode: 'image-to-video',
    prompt: 'Camera orbits slowly while hair moves in the wind',
    aspectRatio: '16:9',
    imageBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk',
    imageMimeType: 'image/png',
  });
  assert.equal(validImg.valid, true);
  if (validImg.valid) {
    assert.ok(!validImg.data.imageBase64?.startsWith('data:'));
    assert.equal(validImg.data.imageMimeType, 'image/png');
  }
});

test('sanitizeCreationFields and sanitizeUserProfileFields enforce blueprint volumetric caps', () => {
  const creation = sanitizeCreationFields({
    id: 'bad id!@# 123',
    userId: 'user_abc',
    title: 'X'.repeat(300),
    prompt: 'P'.repeat(1500),
    model: 'gemini-omni-1.2-flash',
    outputUrl: '/api/videos/file/test123',
  });

  assert.match(creation.id, BLUEPRINT_LIMITS.idPattern);
  assert.equal(creation.title.length, BLUEPRINT_LIMITS.titleMax);
  assert.equal(creation.prompt.length, BLUEPRINT_LIMITS.promptMax);

  const profile = sanitizeUserProfileFields({
    uid: 'uid123',
    displayName: '',
    email: 'creator@example.com',
    photoURL: 'https://example.com/' + 'a'.repeat(700),
  });
  assert.equal(profile.displayName, 'creator');
  assert.equal(profile.photoUrl?.length, BLUEPRINT_LIMITS.photoUrlMax);
});
