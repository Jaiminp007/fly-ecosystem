import test from 'node:test';
import assert from 'node:assert/strict';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {unlinkSync} from 'node:fs';
import {blockOf,collectMarginEvents,actorAlignment,motorGoNoGo,motorAnchorDevBank} from '../scripts/motor-anchor-dev.mjs';
import {bodyTransferExclusions} from '../scripts/body-transfer.mjs';

// Motor-anchor dev instrument: synthetic checks only. No worlds, no banks.

const phi96=(block,val=.5)=>Array.from({length:96},(_,j)=>(j>>4)===block?val:0);

test('blockOf finds the dominant 16-wide block, -1 when all zero',()=>{
  assert.equal(blockOf(phi96(1)),1);
  assert.equal(blockOf(phi96(4)),4);
  assert.equal(blockOf(new Array(96).fill(0)),-1);
  const mixed=phi96(0,.1);for(let j=32;j<48;j++)mixed[j]=.9;
  assert.equal(blockOf(mixed),2);
});

test('margin collector summarizes probe events and attributes mains by phase',()=>{
  const c=collectMarginEvents();
  const prog=(p,tick,block)=>({probe:'A:current',
    event:{type:'update',event:{type:'motor-progress',record:{cruise:true,baseProbability:p,phi:phi96(block),tick}}}});
  c.emit(prog(.62,10,1));c.emit(prog(.9,11,1));c.emit(prog(.45,12,2));
  // Non-cruise and non-motor events are ignored.
  c.emit({probe:'A:current',event:{type:'update',event:{type:'motor-progress',record:{cruise:false,baseProbability:.1,phi:phi96(0),tick:13}}}});
  c.emit({probe:'A:current',event:{type:'decision',action:0}});
  const s=c.summarize(c.perProbe['A:current']);
  assert.equal(s.n,3);
  assert.ok(Math.abs(s.meanMargin-((.12+.4+.05)/3))<1e-12);
  assert.ok(Math.abs(s.threshFrac-1/3)<1e-12); // strict <.1: only .45 counts
  assert.deepEqual(s.blocks,{1:2,2:1});
  // Raw main-run events carry ticks for phase attribution.
  const m=collectMarginEvents();
  m.emit({type:'update',event:{type:'motor-progress',record:{cruise:true,baseProbability:.7,phi:phi96(1),tick:100}}});
  m.emit({type:'update',event:{type:'motor-progress',record:{cruise:true,baseProbability:.3,phi:phi96(3),tick:900}}});
  const phases=m.attributeMain([{phase:'A',tick:512},{phase:'B',tick:1024}]);
  assert.equal(phases.A.n,1);assert.deepEqual(phases.A.blocks,{1:1});
  assert.equal(phases.B.n,1);assert.deepEqual(phases.B.blocks,{3:1});
});

test('motor go-bar needs all six conditions; best lambda wins on A-retention',()=>{
  const base={meanBret:0,meanLevel:5,meanAlign:.7,meanMargin:.3,meanThreshFrac:.2};
  const ctl={lambda:0,meanAret:.2,...base};
  const good={lambda:.02,meanAret:.4,...base,meanAlign:.75};
  assert.equal(motorGoNoGo([ctl,good]).verdict,'DEV-GO');
  const nogo=(over)=>motorGoNoGo([ctl,{...good,...over}]).verdict;
  assert.equal(nogo({meanAret:.3}),'DEV-NOGO'); // dA=+.10 < +.15
  assert.equal(nogo({meanBret:-.11}),'DEV-NOGO');
  assert.equal(nogo({meanLevel:4.7}),'DEV-NOGO'); // dL=-.30
  assert.equal(nogo({meanAlign:.69}),'DEV-NOGO');
  assert.equal(nogo({meanMargin:.24}),'DEV-NOGO'); // -.06 < -.05
  assert.equal(nogo({meanThreshFrac:.26}),'DEV-NOGO'); // +.06 > +.05
  const tie={lambda:.08,meanAret:.35,...base,meanAlign:.72};
  assert.equal(motorGoNoGo([ctl,good,tie]).bestLambda,.02);
});

test('actor alignment is cosine over shared-alive actor weights',()=>{
  const mk=w=>({state:{learners:[
    {agentId:0,dead:false,weights:{actor:w}},
    {agentId:1,dead:true,weights:{actor:[9,9]}}]}});
  assert.ok(Math.abs(actorAlignment(mk([1,0]),mk([1,0])).cos-1)<1e-12);
  assert.ok(Math.abs(actorAlignment(mk([1,0]),mk([0,1])).cos)<1e-12);
  assert.equal(actorAlignment(mk([1,0]),mk([1,0])).n,1);
});

test('motor dev bank draws 36 unique seeds disjoint from union exclusions',()=>{
  const path=join(tmpdir(),`motor-bank-synth-${process.pid}.json`);
  const p=motorAnchorDevBank(path);
  assert.equal(p.experiment,'motor-anchor-dev');assert.equal(p.histories.length,4);
  const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,36);
  const {excluded}=bodyTransferExclusions();
  assert.ok(flat.every(s=>!excluded.has(s)));
  unlinkSync(path);
});
