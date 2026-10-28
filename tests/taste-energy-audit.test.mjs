import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,mkdirSync,copyFileSync,rmSync} from 'node:fs';
import {join,dirname,resolve,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {tasteEnergyEngineeringRecord} from '../scripts/taste-energy-engineering.mjs';
const python=process.env.SARSA_AUDIT_PYTHON||resolve('.venv-research/Scripts/python.exe'),root=resolve('.');
let directory,record,path;
const check=(file=path,source=join(root,'scripts/audit-taste-energy.py'),output=null)=>spawnSync(python,['-B',source,file,...(output?['--output',output]:[])],{encoding:'utf8',cwd:root,maxBuffer:1024*1024});
test.before(()=>{directory=mkdtempSync(join(tmpdir(),'taste-energy-audit-'));path=join(directory,'record.json');record=tasteEnergyEngineeringRecord();writeFileSync(path,JSON.stringify(record));});
test.after(()=>{assert.equal(dirname(resolve(directory)),resolve(tmpdir()));rmSync(directory,{recursive:true,force:true});});

test('independent complete reconstruction covers both learners, bounded replay, terminal debt, masked/neutral control and refuses overwrite',()=>{
  const output=join(directory,'numeric.json'),r=check(path,undefined,output);assert.equal(r.status,0,r.stderr);
  const result=JSON.parse(readFileSync(output,'utf8'));assert.equal(result.passed,true);assert.equal(result.fixtures,10);assert.equal(result.contactCases,4);assert.equal(result.decisions,1025);
  assert.ok(result.tasteLiveUpdates>32&&result.motorUpdates>0&&result.replayUpdates>result.tasteLiveUpdates);assert.equal(result.terminalObservations,2);
  assert.notEqual(check(path,undefined,output).status,0);
});

test('captured complete source closure independently audits and cold-replays outside the checkout',()=>{
  const captured=join(directory,'captured');
  for(const name of Object.keys(record.sources)){const target=resolve(captured,name);assert.ok(target.startsWith(resolve(captured)+sep));mkdirSync(dirname(target),{recursive:true});copyFileSync(join(root,name),target);}
  const numeric=check(path,join(captured,'scripts/audit-taste-energy.py'));assert.equal(numeric.status,0,numeric.stderr);
  const output=join(directory,'replay.json'),r=spawnSync(process.execPath,[join(captured,'scripts/taste-energy-engineering.mjs'),'--replay',path,'--output',output],{encoding:'utf8',cwd:directory});
  assert.equal(r.status,0,r.stderr);assert.equal(JSON.parse(readFileSync(output,'utf8')).exactJsonReplay,true);
});

test('independent audit rejects corrupt feedback, choices, hold credit, normalized advantage, replay, state bytes and ledger',()=>{
  const event=(c,type,predicate=()=>true,fixture=0)=>c.fixtures[fixture].events.find(e=>e.type===type&&predicate(e));
  const changes={
    choice:c=>{event(c,'choose').action=(event(c,'choose').action+1)%4;},
    cue:c=>{event(c,'choose').own.cue[0]*=-1;},
    contact:c=>{event(c,'choose').own.contactPresent=false;},
    feedback:c=>{event(c,'observe').own.lastFood=.4;},
    motorDuration:c=>{event(c,'choose',e=>e.updates.some(u=>u.type==='motor-update')).updates[0].record.duration--;},
    normalized:c=>{event(c,'choose',e=>e.updates.some(u=>u.type==='motor-update')).updates[0].advantage=0;},
    tasteTarget:c=>{event(c,'observe',e=>e.updates.some(u=>u.type==='taste-update')).updates.find(u=>u.type==='taste-update').record.target=9;},
    replaySource:c=>{event(c,'observe',e=>e.updates.some(u=>u.mode==='replay')).updates.find(u=>u.mode==='replay').record.agentId++;},
    memory:c=>{event(c,'observe',e=>e.state.olderSeen>24).state.older[0].experience++;},
    rng:c=>{event(c,'choose').state.motorRngState++;},
    scale:c=>{event(c,'choose',e=>e.state.tdRms>0).state.tdRms++;},
    feature:c=>{event(c,'choose').state.motorPending.phi[0]=0;},
    storage:c=>{event(c,'charge').state.charge.storageBytes++;},
    work:c=>{event(c,'choose').state.work.scalarOperations++;},
    payment:c=>{event(c,'pay').paid++;},
    terminal:c=>{event(c,'observe',()=>true,1).own.terminal=false;},
    reset:c=>{event(c,'reset',()=>true,2).state.acquiredTasteExamples=1;},
    compaction:c=>{event(c,'compact',()=>true,9).state.hold.remaining=1;},
    contactGeometry:c=>{c.contacts[0].output.contactPresent=false;},
    missing:c=>{c.fixtures[0].events.pop();},
    role:c=>{c.fixtures.pop();},
    source:c=>{delete c.sources['learning/taste-energy.mjs'];}
  };
  const changed=join(directory,'changed.json');
  for(const[name,mutate] of Object.entries(changes)){
    const copy=structuredClone(record),before=JSON.stringify(copy);mutate(copy);assert.notEqual(JSON.stringify(copy),before,`${name} mutation was a no-op`);writeFileSync(changed,JSON.stringify(copy));
    const r=check(changed);assert.notEqual(r.status,0,`${name} accepted`);assert.match(r.stderr,/AssertionError/,`${name}: ${r.stderr}`);
  }
});
