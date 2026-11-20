// KERNEL-CRITIC instrument fixtures (10/10 green required before bank build; zero bank worlds).
// Synthetic rows/events only (no bank worlds). Union-excluded via tests/*.mjs scan.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {collectKernelCritic,scoreKernelCritic,kernelCriticDevBank,kernelCriticDevSources,
  KC_ARMS,KC_HISTORIES,KC_EXPECT_MAINS,KC_EXPECT_PROBES,KC_FIXTURE_SEEDS} from '../scripts/kernel-critic-dev.mjs';
import {TICK_CUE_ARMS} from '../learning/tick-cue-experiment.mjs';

test('null-hygiene: default path never touches kernel-critic (static source guard)',()=>{
  assert.ok(TICK_CUE_ARMS.includes('candidate'));
  assert.ok(TICK_CUE_ARMS.includes('kernelCritic'));
  const src=readFileSync(new URL('../learning/tick-cue-experiment.mjs',import.meta.url),'utf8');
  for(const line of src.split('\n')){
    if(!line.includes('kernelCritic'))continue;
    assert.ok(/kernelCriticBody|kernelCriticAction|=== 'kernelCritic'|'kernelCritic'/.test(line),`non-dispatched kernelCritic reference: ${line.slice(0,120)}`);
  }
  assert.ok(src.includes("import {createKernelCriticBody,chooseKernelCriticAction,observeKernelCriticBody,restoreKernelCriticBody}"));
});

const mkRowK=(tag,seed,gap,pauseRate=0.1,surv=1)=>({tag,history:{seed},
  endpoint:{survivors:Math.round(surv*24),founders:24},
  summary:{joinRate:1,pauseRate,decisions:100,pauseTot:Math.round(pauseRate*100),contactTot:100,
    harmTurn:(0.5+gap/2)*20,harmN:20,benTurn:(0.5-gap/2)*20,benN:20,
    gap:+gap.toFixed(4),cues:{}}});
const kRows=(baseGap,critGap,critSurv=1,critPause=0.1)=>{const rows=[];for(let h=0;h<6;h++){const s=451001+h;
  rows.push(mkRowK('candidate',s,baseGap));rows.push(mkRowK('kernelCritic',s,critGap,critPause,critSurv));}return rows;};

test('scorer KC-GO on pooled critic minus baseline >= +0.1 with survival and pause intact',()=>{
  const v=scoreKernelCritic(kRows(0.6,0.75));
  assert.equal(v.g1,true);
  assert.equal(v.g0,true);
  assert.ok(Math.abs(v.baseMean-0.6)<1e-9);
  assert.ok(Math.abs(v.pooledCrit-v.pooledBase-0.15)<1e-9);
  assert.equal(v.g2a,true);
  assert.equal(v.g2b,true);
  assert.equal(v.go,true);
  assert.equal(v.verdict,'KC-GO');
});

test('scorer KC-NOGO when the critic lift misses the bar',()=>{
  const v=scoreKernelCritic(kRows(0.6,0.65));
  assert.equal(v.go,false);
  assert.equal(v.g2a,false);
  assert.equal(v.verdict,'KC-NOGO');
});

test('scorer KC-NOGO on collapse (low survival)',()=>{
  const dead=scoreKernelCritic(kRows(0.6,0.75,0.3));
  assert.equal(dead.go,false);
  assert.equal(dead.g2b,false);
  assert.equal(dead.verdict,'KC-NOGO');
});

test('scorer KC-NOGO on pause-breach (frozen actor)',()=>{
  const frozen=scoreKernelCritic(kRows(0.6,0.75,1,0.5));
  assert.equal(frozen.go,false);
  assert.equal(frozen.g2b,false);
  assert.equal(frozen.verdict,'KC-NOGO');
});

test('scorer INVALID on join breach; INCOMPLETE-BASELINE on weak baseline',()=>{
  const bad=kRows(0.6,0.75).map((r,i)=>i===0?{...r,summary:{...r.summary,joinRate:0.5}}:r);
  const iv=scoreKernelCritic(bad);
  assert.equal(iv.go,false);
  assert.equal(iv.verdict,'INVALID');
  const weak=kRows(0.4,0.75);
  const iu=scoreKernelCritic(weak);
  assert.equal(iu.go,false);
  assert.equal(iu.g0,false);
  assert.equal(iu.verdict,'INCOMPLETE-BASELINE');
  const short=kRows(0.6,0.75).slice(0,11);
  const sh=scoreKernelCritic(short);
  assert.equal(sh.go,false);
  assert.equal(sh.verdict,'INVALID');
});

test('collector joins tick-cue decision+physical into turn-gaps with valence labels',()=>{
  const c=collectKernelCritic();
  c.emit({type:'decision',own:{agentId:1,tick:5},sourceCue:[1,0,1,0],choice:3});
  c.emit({type:'physical',agentId:1,tick:5,beneficialEaten:0,toxinDamage:5});
  c.emit({type:'decision',own:{agentId:1,tick:6},sourceCue:[0,1,0,1],choice:0});
  c.emit({type:'physical',agentId:1,tick:6,beneficialEaten:9,toxinDamage:0});
  const s=c.summarize();
  assert.equal(s.joined,2);
  assert.equal(s.joinRate,1);
  assert.ok(Math.abs(s.pauseRate-0.5)<1e-9);
  assert.equal(s.cues['1,0,1,0'].label,'harmful');
  assert.equal(s.cues['0,1,0,1'].label,'beneficial');
  assert.ok(Math.abs(s.gap-1.0)<1e-9);
});

test('bank refuses rebuild (451xxx absorbed into union-exclusion by committed T1 bank)',()=>{
  // K1 V1/V1A closed INVALID with no bank ever built; T1's committed bank lists
  // 451001-451054 in excludedSeeds (range respected, never drawn). The tmpdir-build
  // assumption is stale by bank lifecycle (V1k/V1l/V1m/T1 precedent): expect refusal.
  const dir=mkdtempSync(join(tmpdir(),'kernel-critic-dev-bank-'));
  assert.throws(()=>kernelCriticDevBank(join(dir,'protocol.json')),/already used in prior evidence/);
});

test('mains/probes caps match the frozen 6-history x 2-arm design (V1l 12-vs-15 lesson)',()=>{
  assert.deepEqual([...KC_ARMS],['candidate','kernelCritic']);
  assert.equal(KC_HISTORIES,6);
  assert.equal(KC_EXPECT_MAINS,12);
  assert.equal(KC_EXPECT_MAINS,KC_HISTORIES*KC_ARMS.length);
  assert.equal(KC_EXPECT_PROBES,0);
  assert.equal(KC_FIXTURE_SEEDS.length,54);
});

test('runner wires the frozen arms over TickCueExperiment (structural guard)',()=>{
  const src=readFileSync(new URL('../scripts/kernel-critic-dev.mjs',import.meta.url),'utf8');
  assert.ok(src.includes('new TickCueExperiment'),'runner must use TickCueExperiment');
  assert.ok(src.includes('for(const tag of KC_ARMS)'),'runner must loop frozen arms');
  assert.ok(!src.includes('transferred-lossy')&&!src.includes("tag:'transferred'"),'turn-gated tags do not belong here');
});
