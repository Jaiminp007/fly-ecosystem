// ODOR DEV ROUND 6 fixtures (PLAN V1 §5, script-level): frozen numbers,
// no-new-seeds, single-variable vs R5 (module-level gate/learn/starve
// covered in odor-soft-gated.test.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';

const root=fileURLToPath(new URL('..',import.meta.url));
const src=readFileSync(join(root,'scripts/odor-routed-r6.mjs'),'utf8');

test('frozen numbers: 1792 ticks, single soft-gated arm, caps, verdict mapping',()=>{
  assert.ok(src.includes('learned-soft-gated'));
  assert.ok(src.includes("steeringLearner:'soft-gated'"));
  assert.ok(src.includes('ODOR_R2_OP_CAP'));
  assert.ok(src.includes('R6-GO')&&src.includes('R6-PARTIAL')&&src.includes('R6-NO-GO'));
});

test('no new seeds: script references no fresh-bank seed literals',()=>{
  const hits=src.match(/\b(4[6-9]\d{4}|[5-9]\d{5}|\d{9,})\b/g)||[];
  const allowed=new Set(['1792','3600','2654435761']);
  for(const h of hits)assert.ok(allowed.has(h)||Number(h)<100000,'fresh-looking literal in R6 script: '+h);
});

test('single-variable isolation: fixed curriculum, soft-gated learner, no phase table or dims override',()=>{
  assert.ok(!src.includes('phaseTable'),'R6 must not use the rehearsal table');
  assert.ok(!src.includes('steeringDims'),'R6 dims are the mixture head\u2019s frozen internal 10');
  assert.ok(src.includes('guarded')&&src.includes('native-full'),'R6 keeps the guarded comparator');
});
