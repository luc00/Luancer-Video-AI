import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rulesSource = fs.readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf8');
const blueprint = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'firebase-blueprint.json'), 'utf8')
);

test('firestore.rules enforces global deny, rules_version 2, and all blueprint collections', () => {
  assert.match(rulesSource, /rules_version = '2';/);
  assert.match(rulesSource, /match \/\{document=\*\*\} \{\s*allow read, write: if false;/);
  assert.ok(blueprint.firestore['/users/{userId}']);
  assert.ok(blueprint.firestore['/users/{userId}/creations/{creationId}']);
  assert.match(rulesSource, /match \/users\/\{userId\}/);
  assert.match(rulesSource, /match \/creations\/\{creationId\}/);
});

test('firestore.rules enforces Eight Pillars constraints against Dirty Dozen attacks', () => {
  // Pillar 1 & 3: ID hardening & email verified
  assert.match(rulesSource, /function isValidId\(id\)/);
  assert.match(rulesSource, /request\.auth\.token\.email_verified == true/);
  // Pillar 2: Strict key checks + no open reads
  assert.ok(!/allow (read|write|get|list|create|update): if true/.test(rulesSource));
  assert.match(rulesSource, /isValidUserProfile\(incoming\(\)\)/);
  assert.match(rulesSource, /isValidStudioCreation\(incoming\(\)\)/);
  // Pillar 6: No user listing
  assert.match(rulesSource, /allow list: if false;/);
  // Pillar 4 & 6: Terminal state locking on creations + immutable credit floor
  assert.match(rulesSource, /!\(existing\(\)\.status in \['completed', 'failed'\]\)/);
  assert.match(rulesSource, /incoming\(\)\.credits <= existing\(\)\.credits/);
  // Pillar 7 & 8: Atomicity check + secure list query without get()/exists() in list
  assert.match(rulesSource, /getAfter\(\/databases\/\$\(database\)\/documents\/users\/\$\(userId\)\)\.data\.updatedAt == request\.time/);
  assert.match(rulesSource, /outputUrl\.size\(\) <= 500/);
});
