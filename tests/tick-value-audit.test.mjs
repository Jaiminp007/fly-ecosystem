import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,mkdirSync,copyFileSync,rmSync} from 'node:fs';
import {join,dirname,resolve,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {valueEngineeringRecord,valueSourceHashes} from '../scripts/tick-value-engineering.mjs';
const python=process.env.SARSA_AUDIT_PYTHON || resolve('.venv-research/Scripts/python.exe'),root=resolve('.');
let directory,record,path;
const check=(file=path,source='scripts/audit-tick-value.py',output=null)=>spawnSync(python,['-B',source,file,...(output?['--output',output]:[])],{encoding:'utf8',cwd:root});
test.before(()=>{directory=mkdtempSync(join(tmpdir(),'tick-value-audit-'));path=join(directory,'record.json');record=valueEngineeringRecord();writeFileSync(path,JSON.stringify(record));});
test.after(()=>{assert.equal(dirname(resolve(directory)),resolve(tmpdir()));rmSync(directory,{recursive:true,force:true});});
test('independent reconstruction covers all fixed value/history/replay/ledger/terminal roles and refuses overwrite',()=>{
  const output=join(directory,'numeric.json'),result=check(path,undefined,output);assert.equal(result.status,0,result.stderr);
  const audit=JSON.parse(readFileSync(output,'utf8'));assert.equal(audit.passed,true);assert.equal(audit.fixtures,7);
  assert.ok(audit.decisions>0&&audit.liveUpdates===audit.replayUpdates&&audit.reservoirDraws>0&&audit.terminalObservations===2);
  assert.notEqual(check(path,undefined,output).status,0);
});
test('complete captured import closure independently reconstructs and exactly replays outside the checkout',()=>{
  const captured=join(directory,'captured');assert.deepEqual(record.sources,valueSourceHashes());
  for(const name of Object.keys(record.sources)){
    const target=resolve(captured,name);assert.ok(target.startsWith(resolve(captured)+sep));mkdirSync(dirname(target),{recursive:true});copyFileSync(name,target);
  }
  const numeric=check(path,join(captured,'scripts/audit-tick-value.py'));assert.equal(numeric.status,0,numeric.stderr);
  const output=join(directory,'replay.json'),replay=spawnSync(process.execPath,[join(captured,'scripts/tick-value-engineering.mjs'),'--replay',path,'--output',output],{encoding:'utf8',cwd:directory});
  assert.equal(replay.status,0,replay.stderr);assert.equal(JSON.parse(readFileSync(output,'utf8')).exactJsonReplay,true);
});
test('independent checker rejects changed policy, features, targets, replay ownership, streams, costs and lifecycle coverage',()=>{
  const event=(copy,kind,index=0,fixture=0)=>copy.fixtures[fixture].events.filter(v=>v.type===kind)[index];
  const changes={
    choice:c=>{event(c,'choose').action=(event(c,'choose').action+1)%4;},
    ownEnergy:c=>{event(c,'choose').own.energy+=1;},
    observation:c=>{event(c,'choose').own.observation[12]=1;},
    phi:c=>{event(c,'choose').state.pending.phi[0]+=.1;},
    privateRng:c=>{event(c,'choose').state.rngState++;},
    liveTarget:c=>{event(c,'choose',1).transitions[0].target+=1;},
    replaySerial:c=>{event(c,'choose',1).transitions[0].replay.experience++;},
    liveTrace:c=>{event(c,'choose',1).state.eligibility[0][0]+=.1;},
    work:c=>{event(c,'choose').state.work.scalarOperations++;},
    storage:c=>{event(c,'charge').state.charge.storageBytes++;},
    requestedCost:c=>{event(c,'charge').energyCost+=.1;},
    payment:c=>{event(c,'pay').paid+=.1;},
    replayOwner:c=>{event(c,'choose',1).state.recent[0].agentId++;},
    reservoirStream:c=>{event(c,'choose',70).state.retentionRngState++;},
    reservoirRecord:c=>{event(c,'choose',70).state.older[0].experience++;},
    reset:c=>{event(c,'reset',0,2).state.acquiredTransitions=1;},
    terminal:c=>{event(c,'observe',0,4).own.terminal=false;},
    contactCue:c=>{event(c,'contact',0,6).cue[0]*=-1;},
    contactWork:c=>{event(c,'contact',0,6).state.work.scalarOperations++;},
    missingEvent:c=>{c.fixtures[0].events.pop();},
    missingFixture:c=>{c.fixtures.pop();},
    source:c=>{delete c.sources['learning/tick-value.mjs'];}
  };
  const altered=join(directory,'altered.json');
  for(const [name,mutate]of Object.entries(changes)){
    const copy=structuredClone(record);mutate(copy);writeFileSync(altered,JSON.stringify(copy));
    const result=check(altered);assert.notEqual(result.status,0,`${name} accepted`);assert.match(result.stderr,/AssertionError/,`${name}: ${result.stderr}`);
  }
});
