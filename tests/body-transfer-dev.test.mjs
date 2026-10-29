import test from 'node:test';
import assert from 'node:assert/strict';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {unlinkSync} from 'node:fs';
import {devGoNoGo,tasteAlignment,bodyTransferDevBank} from '../scripts/body-transfer-dev.mjs';
import {bodyTransferExclusions} from '../scripts/body-transfer.mjs';

test('dev go-bar passes only when all four conditions hold',()=>{
  const base=[{lambda:0,meanAret:1,meanBret:2,meanLevel:3,meanAlign:.5}];
  const go=[...base,{lambda:.08,meanAret:1.2,meanBret:1.95,meanLevel:2.9,meanAlign:.6}];
  const d=devGoNoGo(go);assert.equal(d.verdict,'DEV-GO');assert.equal(d.bestLambda,.08);
  assert.ok(Math.abs(d.dA-.2)<1e-12&&Math.abs(d.dB+.05)<1e-12&&Math.abs(d.dL+.1)<1e-12&&d.alignUp);
  for(const bad of [{meanAret:1.14},{meanBret:1.89},{meanLevel:2.79},{meanAlign:.5}]){
    const r=devGoNoGo([...base,{lambda:.02,meanAret:1.2,meanBret:1.95,meanLevel:2.9,meanAlign:.6,...bad}]);
    assert.equal(r.verdict,'DEV-NOGO');
  }
});
test('alignment is cosine over shared-alive taste weights',()=>{
  const mk=(w,id,dead=false)=>({agentId:id,dead,weights:{taste:w}});
  const A={state:{learners:{a:mk([1,0,0],7),b:mk([0,1,0],8),c:mk([1,1,0],9,true)}}};
  const C={state:{learners:{a:mk([1,0,0],7),b:mk([1,0,0],8),c:mk([9,9,0],9)}}};
  const {cos,n}=tasteAlignment(A,C);assert.equal(n,2);assert.ok(Math.abs(cos-.5)<1e-12);
});
test('dev bank draws 36 unique seeds disjoint from union exclusions',()=>{
  const path=join(tmpdir(),`dev-bank-synth-${process.pid}.json`);
  const p=bodyTransferDevBank(path);
  assert.equal(p.experiment,'body-transfer-v3-dev');assert.equal(p.histories.length,4);
  const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,36);
  const {excluded}=bodyTransferExclusions();
  assert.ok(flat.every(s=>!excluded.has(s)));
  unlinkSync(path);
});
