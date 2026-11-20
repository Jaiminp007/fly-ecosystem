// Track-T1 instrument fixtures: collector/scorer/bank/caps.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {collectTurnChoice} from '../scripts/turn-gated-dev.mjs';
import {correctnessOf,pauseOf,scoreTasteKernel,tasteKernelDevBank,TK_ARMS,TK_HISTORIES,TK_EXPECT_MAINS,TK_FIXTURE_SEEDS,TK_OP_CAP,TK_WALL_CAP_SECONDS} from '../scripts/taste-kernel-dev.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const mkRow=(seed,tag,corr,survFrac=0.9,pauseRate=0.3,join=1)=>{
  const contact=100,turn=Math.round(contact*corr);
  return {history:{seed},tag,
    endpoint:{tick:1792,founders:24,survivors:Math.round(24*survFrac),scalarOperations:1e6,accountingResidual:0},
    summary:{decisions:100,joined:Math.round(100*join),joinRate:join,
      cues:{'1,1,-1,-1':{contact,pause:Math.round(contact*pauseRate),turn,beneficial:0,harmful:10,label:'harmful'},
        '1,-1,1,-1':{contact,pause:Math.round(contact*pauseRate),turn:contact-turn,beneficial:10,harmful:0,label:'beneficial'}}}}};
const six=(tag,corr,surv=0.9,pause=0.3,join=1)=>[0,1,2,3,4,5].map(i=>mkRow(452001+i*9,tag,corr,surv,pause,join));

test('taste-kernel collector joins synthetic decision+physical',()=>{
  const c=collectTurnChoice();
  const own={tick:5,agentId:1,cue:[1,1,-1,-1],contactPresent:true};
  c.emit({type:'decision',own,action:1,outputs:[0,0],requestedExtra:0});
  c.emit({type:'physical',tick:5,agentId:1,beneficialEaten:0,harmfulEaten:1});
  const s=c.summarize();
  assert.equal(s.joinRate,1);
  assert.ok(s.cues['1,1,-1,-1']);
  assert.equal(s.cues['1,1,-1,-1'].label,'harmful');
});
test('taste-kernel scorer GO branch (lift +0.15, survival ok, pause ok)',()=>{
  const rows=[...six('candidate',0.75,0.9,0.3),...six('tasteKernel',0.90,0.9,0.3)];
  const d=scoreTasteKernel(rows);
  assert.equal(d.g1,true);assert.equal(d.g0,true);
  assert.equal(d.g2a,true);assert.equal(d.g2b,true);
  assert.equal(d.verdict,'TK-GO');
});
test('taste-kernel scorer NOGO branch (lift +0.05)',()=>{
  const rows=[...six('candidate',0.75,0.9,0.3),...six('tasteKernel',0.80,0.9,0.3)];
  const d=scoreTasteKernel(rows);
  assert.equal(d.g2a,false);
  assert.equal(d.verdict,'TK-NOGO');
});
test('taste-kernel scorer collapse branch (survival <50% -> g2b false -> NOGO)',()=>{
  const rows=[...six('candidate',0.75,0.9,0.3),...six('tasteKernel',0.90,0.2,0.3)];
  const d=scoreTasteKernel(rows);
  assert.equal(d.g2b,false);
  assert.equal(d.verdict,'TK-NOGO');
});
test('taste-kernel scorer INVALID branch (join fail)',()=>{
  const rows=[...six('candidate',0.75,0.9,0.3,0.5),...six('tasteKernel',0.90,0.9,0.3)];
  const d=scoreTasteKernel(rows);
  assert.equal(d.g1,false);
  assert.equal(d.verdict,'TK-INVALID');
});
test('taste-kernel scorer INCOMPLETE branch (baseline <0.5)',()=>{
  const rows=[...six('candidate',0.30,0.9,0.3),...six('tasteKernel',0.45,0.9,0.3)];
  const d=scoreTasteKernel(rows);
  assert.equal(d.g0,false);
  assert.equal(d.verdict,'TK-INCOMPLETE-BASELINE');
});
test('taste-kernel bank refuses rebuild post-spend (452xxx in prior evidence)',()=>{
  const dir=mkdtempSync(join(tmpdir(),'tk-bank-'));
  assert.throws(()=>tasteKernelDevBank(join(dir,'bank.json')),/already used in prior evidence/);
});
test('taste-kernel mains-caps frozen-design + structural guard',()=>{
  assert.equal(TK_ARMS.length*TK_HISTORIES,TK_EXPECT_MAINS);
  assert.equal(TK_FIXTURE_SEEDS.length,54);
  const src=readFileSync(join(root,'scripts','taste-kernel-dev.mjs'),'utf8');
  assert.ok(src.includes('tasteKernel'),'runner must contain kernel arm block');
  assert.ok(src.includes('452001'),'runner/bank must reference fresh-01 range');
  assert.ok(TK_OP_CAP===10_000_000_000&&TK_WALL_CAP_SECONDS===10800);
});
