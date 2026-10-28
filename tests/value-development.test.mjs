import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync,mkdirSync,copyFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {valueFixtureProtocol,valueSyntheticRows} from '../scripts/value-development-fixtures.mjs';
import {VALUE_CONTRASTS,VALUE_BUDGET,validateValueProtocol,scoreValueRows} from '../learning/value-development.mjs';
import {valueInferenceRecord} from '../scripts/value-inference-engineering.mjs';

test('prospective value scorer retains every causal, skill, pressure and transfer gate with complete world budgets',()=>{
  const p=valueFixtureProtocol();validateValueProtocol(p);
  assert.equal(VALUE_CONTRASTS.length,26);assert.equal(VALUE_BUDGET.totalWorlds,24*33);
  assert.equal(VALUE_BUDGET.totalCollectionWorldSteps,24*(17*1792+16*256));
  for(const phase of ['development','confirmation']){
    const r=scoreValueRows(valueSyntheticRows(p,phase),p,phase);
    assert.equal(r.comparisons.length,26);assert.equal(r.survival.length,23);
    assert.equal(r.promising,phase==='development'?true:null);assert.equal(r.qualified,phase==='confirmation');
    assert.ok(r.support.every(v=>v.passed));
  }
  for(const c of VALUE_CONTRASTS){
    const rows=valueSyntheticRows(p,'development');
    for(const row of rows){
      if(c.main)row.arms[c.main].endpoint.budgetAdjustedEnergyPerFounder=200;
      else if(c.null)row.arms.nullCandidate.endpoint.budgetAdjustedEnergyPerFounder=1;
      else if(c.pressure==='aInterference'){
        const v=row.probes.find(v=>v.family==='A'&&v.version==='B');v.value=100;v.endpoint.budgetAdjustedEnergyPerFounder=100;
      }else if(c.pressure)row.probes.find(v=>v.family==='A'&&v.version==='B').endpoint.totals.beneficialEaten=10000;
      else{const[key,w]=c.terms[0],v=row.probes.find(v=>`${v.family}:${v.version}`===key);v.value=w>0?-10000:10000;v.endpoint.budgetAdjustedEnergyPerFounder=v.value;}
      row.sham=structuredClone(row.probes[0]);
    }
    const r=scoreValueRows(rows,p,'development');assert.equal(r.promising,false,c.id);
    assert.equal(r.comparisons.find(v=>v.id===c.id).developmentPass,false,c.id);
  }
});

test('exact-count survival, activity and nonempty bodies prevent unsupported advancement; malformed controls and probes fail',()=>{
  const p=valueFixtureProtocol();
  for(const change of [
    r=>{r.arms.candidate.endpoint.survivors=23;r.arms.candidate.endpoint.survival=23/24;},
    r=>{r.arms.candidate.activity.activeFounders=11;r.arms.candidate.activity.passed=false;},
    r=>{const v=r.probes.find(v=>v.family==='A'&&v.version==='B');v.survivors=v.endpoint.survivors=0;v.survival=0;},
  ]){const rows=valueSyntheticRows(p,'development');change(rows[0]);assert.equal(scoreValueRows(rows,p,'development').promising,false);}
  for(const change of [p=>p.contrasts.pop(),p=>p.survival.pop(),p=>p.probes.pop(),p=>{p.retentionFraction=.9;},
    p=>{p.confirmationHistories[0].seed=p.developmentHistories[0].seed;},p=>{p.reference.actorParameters={};},
    p=>{p.requireNonempty=false;},p=>{p.budget.totalWorlds=24;}]){const q=structuredClone(p);change(q);assert.throws(()=>validateValueProtocol(q));}
  for(const change of [r=>r.probes.pop(),r=>{r.probes[0].startWorldSha256='foreign';},r=>{r.arms.candidate.endpoint.founders=1;},
    r=>{r.probes[0].resetInitializationEnergyPerFounder=.001;},r=>{r.probes[0].inferenceOnlyCompaction=false;},
    r=>{r.probes[0].value++;},r=>{r.endCCheckpointSha256=null;},r=>r.probes.reverse()]){
    const rows=valueSyntheticRows(p,'development');change(rows[0]);assert.throws(()=>scoreValueRows(rows,p,'development'));
  }
});

test('independent Python recomputes 26 contrasts, uncertainty, exact sign-flips, 23 guards and nonempty support; rejects corruptions',()=>{
  const dir=mkdtempSync(join(tmpdir(),'value-inference-')),python=process.env.SARSA_AUDIT_PYTHON||'python';
  const p=valueFixtureProtocol(),fixture={schema:1,kind:'value-study-inference-engineering',p,banks:['development','confirmation'].map(phase=>{
    const rows=valueSyntheticRows(p,phase);return{phase,rows,result:scoreValueRows(rows,p,phase)};
  })};
  const invoke=(f,out)=>{const path=join(dir,'fixture.json');writeFileSync(path,JSON.stringify(f));return spawnSync(python,['-B','scripts/audit-value-statistics.py',path,...(out?['--output',out]:[])],{encoding:'utf8',maxBuffer:1024*1024});};
  try{
    const output=join(dir,'audit.json'),r=invoke(fixture,output);assert.equal(r.status,0,r.stderr||r.error?.message);
    assert.equal(JSON.parse(readFileSync(output)).passed,true);assert.notEqual(invoke(fixture,output).status,0,'Exclusive output');
    const dev={...fixture,banks:[fixture.banks[0]]};
    for(const [label,change]of Object.entries({
      missingComparison:f=>f.banks[0].result.comparisons.pop(),missingSurvival:f=>f.banks[0].result.survival.pop(),
      effect:f=>f.banks[0].result.comparisons[0].effects[0]++,pValue:f=>{f.banks[0].result.comparisons[0].pOneSided=0;},
      critical:f=>{f.p.critical.development=1;},bounds:f=>f.banks[0].result.comparisons[0].lower++,
      support:f=>{f.banks[0].result.support[0].passed=false;},survival:f=>f.banks[0].result.survival[0].counts[0]--,
      reference:f=>{f.p.reference.actorParameters={};},multiplicity:f=>{f.p.alphaPerTest=.05/22;},
      reset:f=>{f.banks[0].rows[0].probes[3].resetInitializationEnergyPerFounder=.001;},
      pairing:f=>{f.banks[0].rows[0].probes[0].startWorldSha256='other';},
      gate:f=>{f.banks[0].result.promising=false;},reusedSeed:f=>{f.p.confirmationHistories[0].seed=f.p.developmentHistories[0].seed;},
    })){const altered=structuredClone(dev);change(altered);const a=invoke(altered);assert.notEqual(a.status,0,label);assert.match(a.stderr,/AssertionError/,`${label}: ${a.stderr}`);}
  }finally{assert.equal(dirname(resolve(dir)),resolve(tmpdir()));rmSync(dir,{recursive:true,force:true});}
});

test('captured inference source closure independently checks and exactly replays outside the checkout',()=>{
  const dir=mkdtempSync(join(tmpdir(),'value-inference-captured-')),record=valueInferenceRecord();
  const python=process.env.SARSA_AUDIT_PYTHON||'python';
  try{
    const path=join(dir,'record.json');writeFileSync(path,JSON.stringify(record));
    for(const name of Object.keys(record.sources)){const target=join(dir,'sources',name);mkdirSync(dirname(target),{recursive:true});copyFileSync(name,target);}
    const independent=spawnSync(python,['-B',join(dir,'sources/scripts/audit-value-statistics.py'),path,'--output',join(dir,'numeric.json')],{encoding:'utf8',cwd:dir});
    assert.equal(independent.status,0,independent.stderr);assert.equal(JSON.parse(readFileSync(join(dir,'numeric.json'))).passed,true);
    const replay=spawnSync(process.execPath,[join(dir,'sources/scripts/value-inference-engineering.mjs'),'--replay',path,'--output',join(dir,'replay.json')],{encoding:'utf8',cwd:dir});
    assert.equal(replay.status,0,replay.stderr);assert.equal(JSON.parse(readFileSync(join(dir,'replay.json'))).exactJsonReplay,true);
  }finally{assert.equal(dirname(resolve(dir)),resolve(tmpdir()));rmSync(dir,{recursive:true,force:true});}
});
