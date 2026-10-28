import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname,join,resolve} from 'node:path';
import {gunzipSync} from 'node:zlib';
import {tickFixtureProtocol,tickSyntheticRows} from '../scripts/tick-development-fixtures.mjs';
import {createCompressedTape} from '../scripts/tick-development.mjs';
import {TICK_CONTRASTS,TICK_BUDGET,validateTickProtocol,scoreTickRows} from '../learning/tick-development.mjs';

test('fixed study covers all 22 tests, 19 exact-count guards, 696 worlds and unchanged confirmation reserve', () => {
  const p=tickFixtureProtocol(); validateTickProtocol(p);
  for (const phase of ['development','confirmation']) {
    const result=scoreTickRows(tickSyntheticRows(p,phase),p,phase);
    assert.equal(result.comparisons.length,22); assert.equal(result.survival.length,19);
    assert.equal(result.promising,phase==='development' ? true : null); assert.equal(result.qualified,phase==='confirmation');
    if (phase==='confirmation') assert.ok(result.comparisons.every(c => c.confirmationPass));
    else assert.ok(result.comparisons.filter(c => !c.null).every(c => !c.confirmationPass),'Eight histories cannot attain .05/22 exact sign-flip significance');
  }
  assert.equal(TICK_BUDGET.totalCollectionWorldSteps,24*(13*1792+16*256));
  assert.equal(TICK_BUDGET.totalWorlds,696);
  for (const mutate of [p => p.contrasts.pop(),p => p.survival.pop(),p => {p.probes.pop();},p => {p.retentionFraction=.9;},
    p => {p.confirmationHistories[0].seed=p.developmentHistories[0].seed;},p => {p.budget.totalWorlds=24;}]) {
    const altered=structuredClone(p); mutate(altered); assert.throws(() => validateTickProtocol(altered));
  }
});

test('every required mean gate can independently prevent development advancement', () => {
  const p=tickFixtureProtocol();
  for (const c of TICK_CONTRASTS) {
    const rows=tickSyntheticRows(p,'development');
    for (const row of rows) {
      if (c.main) row.arms[c.main].endpoint.budgetAdjustedEnergyPerFounder=200;
      else if (c.null) row.arms.nullCandidate.endpoint.budgetAdjustedEnergyPerFounder=1;
      else if (c.pressure==='aInterference') row.probes.find(v => v.family==='A' && v.version==='B').value=100;
      else if (c.pressure) row.probes.find(v => v.family==='A' && v.version==='B').endpoint.totals.beneficialEaten=10000;
      else {const [key,w]=c.terms[0],v=row.probes.find(v => `${v.family}:${v.version}`===key); v.value=w>0 ? -10000 : 10000;}
      row.sham=structuredClone(row.probes[0]);
    }
    const result=scoreTickRows(rows,p,'development'); assert.equal(result.promising,false,c.id);
    assert.equal(result.comparisons.find(v => v.id===c.id).developmentPass,false,c.id);
  }
});

test('reset-construction-only skill and absent checkpoints cannot pass; malformed roles and pairings are rejected', () => {
  const p=tickFixtureProtocol(),rows=tickSyntheticRows(p,'development');
  for (const row of rows) {row.probes.find(v => v.family==='A' && v.version==='A').value=.0005; row.sham=structuredClone(row.probes[0]);}
  assert.equal(scoreTickRows(rows,p,'development').comparisons.find(v => v.id==='A-initial-skill').developmentPass,false);
  for (const mutation of [r => r.probes.pop(),r => {r.probes[0].startWorldSha256='foreign';},r => {r.arms.candidate.endpoint.founders=1;},
    r => {r.endCCheckpointSha256=null;},r => {r.arms.candidate.endpoint.survival=.5;},r => {r.probes.reverse();}]) {
    const altered=tickSyntheticRows(p,'development'); mutation(altered[0]); assert.throws(() => scoreTickRows(altered,p,'development'));
  }
});

test('survival uses exact paired founder counts; activity and any probe guard can block advancement', () => {
  const p=tickFixtureProtocol(),rows=tickSyntheticRows(p,'development');
  for (const row of rows) for (const arm of Object.values(row.arms)) {arm.endpoint.survivors=7; arm.endpoint.survival=7/24;}
  rows[0].arms.candidate.endpoint.survivors=8; rows[0].arms.candidate.endpoint.survival=8/24;
  rows[1].arms.candidate.endpoint.survivors=13; rows[1].arms.candidate.endpoint.survival=13/24;
  rows[1].arms.incumbent.endpoint.survivors=14; rows[1].arms.incumbent.endpoint.survival=14/24;
  const guard=scoreTickRows(rows,p,'development').survival.find(v => v.id==='sequence-incumbent');
  assert.equal(guard.counts.reduce((n,v) => n+v,0),0); assert.equal(guard.passed,true);
  const lowActivity=tickSyntheticRows(p,'development'); lowActivity[0].arms.candidate.activity.activeFounders=11; lowActivity[0].arms.candidate.activity.passed=false;
  assert.equal(scoreTickRows(lowActivity,p,'development').promising,false);
  const deadTransfer=tickSyntheticRows(p,'development'),probe=deadTransfer[0].probes.find(v => v.family==='transfer' && v.version==='C');
  probe.survivors=23; probe.survival=23/24;
  assert.equal(scoreTickRows(deadTransfer,p,'development').promising,false);
});

test('compressed tape has bounded framing, full multi-member reconstruction and exclusive failure preservation', () => {
  const directory=mkdtempSync(join(tmpdir(),'tick-tape-'));
  try {
    const path=join(directory,'events.gz'),tape=createCompressedTape(path,TICK_BUDGET);
    const events=[{type: 'large',payload: 'x'.repeat(2100000)},{type: 'last',value: 3}]; events.forEach(tape.emit);
    const hashes=tape.close(),raw=events.map(v => JSON.stringify(v)+'\n').join('');
    assert.equal(gunzipSync(readFileSync(path)).toString(),raw); assert.equal(hashes.uncompressedBytes,Buffer.byteLength(raw));
    assert.throws(() => createCompressedTape(path,TICK_BUDGET));
    const fail=createCompressedTape(join(directory,'failed.gz'),{...TICK_BUDGET,maxUncompressedTraceBytesPerHistory: 4});
    assert.throws(() => fail.emit({value: 123})); fail.abort(); assert.ok(readFileSync(join(directory,'failed.gz')).length===0);
  } finally {assert.equal(dirname(resolve(directory)),resolve(tmpdir())); rmSync(directory,{recursive: true,force: true});}
});
