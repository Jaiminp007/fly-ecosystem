// ODOR DEV ROUND 7 fixtures (PLAN V1 §4, script-level): frozen numbers,
// no-new-seeds, single-variable vs R1 (TIME only; no instrument change).
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';

const root=fileURLToPath(new URL('..',import.meta.url));
const src=readFileSync(join(root,'scripts/odor-routed-r7.mjs'),'utf8');

test('frozen numbers: 3584 ticks, doubled phases, single extended arm, caps, verdict mapping',()=>{
  assert.ok(src.includes('learned-extended'));
  assert.ok(src.includes('3584'));
  assert.ok(src.includes('1024,1024,1024,512'));
  assert.ok(src.includes('ODOR_R2_OP_CAP'));
  assert.ok(src.includes('R7-GO')&&src.includes('R7-PARTIAL')&&src.includes('R7-NO-GO'));
});

test('no new seeds: script references no fresh-bank seed literals',()=>{
  const hits=src.match(/\b(4[6-9]\d{4}|[5-9]\d{5}|\d{9,})\b/g)||[];
  const allowed=new Set(['1792','3584','3600','2654435761']);
  for(const h of hits)assert.ok(allowed.has(h)||Number(h)<100000,'fresh-looking literal in R7 script: '+h);
});

test('single-variable isolation: doubled phases via override, plain head, short-self comparator',()=>{
  assert.ok(!src.includes('phaseTable'),'R7 must not use the rehearsal table (phaseDurations override only)');
  assert.ok(!src.includes('steeringDims'),'R7 is the R1-plain 8-dim head');
  assert.ok(src.includes('short-self')||src.includes('shortSelf'),'R7 must compare against short-self R1 rows');
  assert.ok(src.includes('slope'),'R7 must report the late-half plateau slope in all verdicts');
});
