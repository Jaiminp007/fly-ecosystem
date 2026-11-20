// MEMORY-RESET V1 fixtures (FROZEN docs/MEMORY_RESET_PLAN_V1.md).
// 7 tests, zero worlds: bank tmp-mint shape/exclusion, zeroWeights,
// clearStore, applyReset dispatch, engine full-wipe distinction, scorer
// GO/NOGO/NOBENEFIT branches.
import assert from 'node:assert/strict';
import {describe,it} from 'node:test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {resetTasteEnergyBody} from '../learning/taste-energy.mjs';
import {mrBank,scoreMemoryResetRows,zeroWeights,clearStore,applyReset,MR_FIXTURE_SEEDS,MR_ARMS,MR_MARGIN} from '../scripts/memory-reset-dev.mjs';

const synthHistory=(seed)=>({seed,cueSeed:seed+1,resourceSeeds:[seed+2,seed+3,seed+4,seed+5],probeSeeds:{A:seed+6,B:seed+7,transfer:seed+8}});
const row=(seed,arm,retA)=>({history:{seed},arm,
  seg:{A:{rate:2.0,ticks:512},retA:{rate:retA,ticks:256}},phaseRows:[{phase:'A'},{phase:'return-A'}],
  endpoint:{tick:1792,budgetAdjustedEnergyPerFounder:-60.0,survivors:3}});

describe('memory-reset-dev fixtures',()=>{
  it('bank builds deterministic 2-history/18-unique-seed protocol to tmp (cleaned)',()=>{
    const dir=join(tmpdir(),'memreset-bank-test');
    rmSync(dir,{recursive:true,force:true});
    const p=mrBank(join(dir,'protocol.json'));
    assert.equal(p.experiment,'memory-reset-dev');
    assert.equal(p.histories.length,2);
    const flat=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
    assert.equal(new Set(flat).size,18);
    assert.deepEqual([...MR_FIXTURE_SEEDS].sort((a,b)=>a-b),flat.slice().sort((a,b)=>a-b));
    assert.equal(MR_FIXTURE_SEEDS[0],474181);
    assert.deepEqual([...MR_ARMS],['intact','wreset','sreset','both','unlearned']);
    rmSync(dir,{recursive:true,force:true});
  });
  it('zeroWeights zeroes weights only (store kept)',()=>{
    const run=new TasteExperiment({history:synthHistory(7),arm:'candidate'});
    const st=run.learners[run.founderIds[0]];
    st.weights.taste.fill(1.5);st.weights.actor.fill(2.5);
    st.recent.push({phi:[0.1],target:0});st.older.push({phi:[0.2],target:0});st.olderSeen=5;
    zeroWeights(st);
    assert.ok(st.weights.taste.every(v=>v===0));
    assert.ok(st.weights.actor.every(v=>v===0));
    assert.equal(st.recent.length,1);assert.equal(st.older.length,1);assert.equal(st.olderSeen,5);
  });
  it('clearStore clears store only (weights kept)',()=>{
    const run=new TasteExperiment({history:synthHistory(7),arm:'candidate'});
    const st=run.learners[run.founderIds[0]];
    st.weights.taste.fill(1.5);
    st.recent.push({phi:[0.1],target:0});st.olderSeen=5;
    clearStore(st);
    assert.equal(st.recent.length,0);assert.equal(st.older.length,0);assert.equal(st.olderSeen,0);
    assert.ok(st.weights.taste.every(v=>v===1.5));
  });
  it('engine full wipe clears both (distinction from singles)',()=>{
    const run=new TasteExperiment({history:synthHistory(7),arm:'candidate'});
    const st=run.learners[run.founderIds[0]];
    st.weights.taste.fill(1.5);st.recent.push({phi:[0.1],target:0});st.olderSeen=5;
    resetTasteEnergyBody(st);
    assert.ok(st.weights.taste.every(v=>v===0));
    assert.equal(st.recent.length,0);assert.equal(st.olderSeen,0);
  });
  it('applyReset dispatches per arm (intact/unlearned no-op)',()=>{
    const run=new TasteExperiment({history:synthHistory(7),arm:'candidate'});
    assert.equal(applyReset(run,'intact'),'intact');
    assert.equal(applyReset(run,'unlearned'),'unlearned');
    assert.equal(applyReset(run,'wreset'),'wreset');
    assert.equal(applyReset(run,'sreset'),'sreset');
    assert.equal(applyReset(run,'both'),'both');
    assert.throws(()=>applyReset(run,'nope'));
  });
  it('scorer GO/NOGO/NOBENEFIT branches on synthetic rows',()=>{
    const mk=(inte,wr,sr,bo,un)=>{const rows=[];for(const s of [474181,474190]){rows.push(row(s,'intact',inte));rows.push(row(s,'wreset',wr));rows.push(row(s,'sreset',sr));rows.push(row(s,'both',bo));rows.push(row(s,'unlearned',un));}return rows;};
    const go=scoreMemoryResetRows(mk(2.0,0.5,0.5,0.5,0.5));
    assert.equal(go.g1,true);assert.equal(go.go,true);assert.equal(go.verdict,'MEMORY-RESET-GO-V1');
    const no=scoreMemoryResetRows(mk(2.0,0.5,0.5,2.0,0.5));
    assert.equal(no.go,false);assert.equal(no.verdict,'MEMORY-RESET-NOGO-V1');
    const nb=scoreMemoryResetRows(mk(0.5,0.5,0.5,0.5,0.5));
    assert.equal(nb.go,false);assert.equal(nb.verdict,'INCOMPLETE-NOBENEFIT');
    assert.ok(MR_MARGIN===1.1);
  });
  it('scorer INVALID on malformed rows',()=>{
    const rows=[row(474181,'intact',2.0)];
    const v=scoreMemoryResetRows(rows);
    assert.equal(v.verdict,'INVALID');
  });
});
