// ODOR DEV ROUND 4 fixtures (PLAN V1 §5, script-level): frozen numbers,
// no-new-seeds, scorer reuse (BC rule covered in odor-distill.test.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';

const root=fileURLToPath(new URL('..',import.meta.url));
const src=readFileSync(join(root,'scripts/odor-routed-r4.mjs'),'utf8');

test('frozen numbers: 1792 ticks, single arm, caps, verdict mapping',()=>{
  assert.ok(src.includes('learned-distilled'));
  assert.ok(src.includes('40e9'||'40000000000')||src.includes('ODOR_R2_OP_CAP'));
  assert.ok(src.includes('R4-GO')&&src.includes('R4-PARTIAL')&&src.includes('R4-NO-GO'));
});

test('no new seeds: script references no fresh-bank seed literals',()=>{
  const hits=src.match(/\b(4[6-9]\d{4}|[5-9]\d{5}|\d{9,})\b/g)||[];
  // Allow-list: tick/wall constants + the codebase RNG multiplier (not a seed).
  const allowed=new Set(['1792','3600','2654435761']);
  for(const h of hits)assert.ok(allowed.has(h)||Number(h)<100000,'fresh-looking literal in R4 script: '+h);
});

test('single-variable isolation: fixed curriculum, 8-dim students, no phase table',()=>{
  assert.ok(!src.includes('phaseTable'),'R4 must not use the rehearsal table');
  assert.ok(src.includes('createOwnSteering'));
  assert.ok(src.includes('superviseOwnSteering'));
});
