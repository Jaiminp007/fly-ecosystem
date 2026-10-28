import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {auditCueCredit} from '../scripts/audit-cue-credit.mjs';

test('named physical fixtures distinguish contact cue, ranked target, and mixed intake', () => {
  const record = auditCueCredit();
  assert.deepEqual(auditCueCredit(),record);
  const [ranked,mixed,movement] = record.physicalFixtures;
  assert.equal(ranked.sensed.cueId,1);
  assert.equal(ranked.sensed.rankedCueId,2);
  assert.deepEqual(ranked.sensed.contactCueIds,[1]);
  assert.equal(ranked.sensed.raw[0],1);
  assert.deepEqual(mixed.sensed.cue, [1,-1,1,-1]);
  assert.ok(mixed.receipt.beneficialEaten > 0 && mixed.receipt.toxinDamage > mixed.receipt.beneficialEaten);
  assert.ok(mixed.previousFoodAfter < 0);
  assert.deepEqual(mixed.consumed.map(patch => patch.cueId),[1,2]);
  assert.deepEqual(movement.sensed.contactCueIds,[1]);
  assert.equal(movement.sensed.cueId,1);
  assert.ok(movement.after.x > movement.before.x);
  assert.ok(movement.consumed.some(patch => patch.cueId === 2));
  for (const fixture of record.physicalFixtures) {
    assert.ok(fixture.exactCheckpointReplay);
    const row = fixture.receipt;
    assert.ok(Math.abs(row.initialEnergy-row.cost+row.beneficialEaten-row.toxinDamage-row.finalEnergy) < 1e-10);
  }
});

test('eight-tick and terminal credit use pending features and own net energy', () => {
  for (const fixture of auditCueCredit().creditFixtures) {
    assert.equal(fixture.transition.tick,1);
    assert.equal(fixture.transition.duration,8);
    assert.equal(fixture.transition.reward,-1/120);
    assert.equal(fixture.transition.terminal,fixture.terminal);
    assert.deepEqual(fixture.transition.phi,fixture.pendingFeatures);
  }
});

test('diagnostic CLI records source hashes, regenerates exactly, and refuses overwrite', () => {
  const directory = mkdtempSync(join(tmpdir(),'cue-credit-'));
  try {
    const path = join(directory,'record.json');
    const run = () => spawnSync(process.execPath,['scripts/audit-cue-credit.mjs','--output',path],{encoding: 'utf8'});
    const first = run(); assert.equal(first.status,0,first.stderr);
    const bytes = readFileSync(path,'utf8'), record = JSON.parse(bytes);
    assert.deepEqual(record,auditCueCredit());
    assert.ok(Object.values(record.sources).every(hash => /^[a-f0-9]{64}$/.test(hash)));
    assert.notEqual(run().status,0);
    assert.equal(readFileSync(path,'utf8'),bytes);
  } finally {rmSync(directory,{recursive: true,force: true});}
});
