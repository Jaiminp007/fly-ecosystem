import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,mkdirSync,copyFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname,resolve,sep} from 'node:path';
import {spawnSync} from 'node:child_process';
import {valueWorldEngineeringRecord,valueWorldSourceHashes} from '../scripts/value-cue-engineering.mjs';
const python=process.env.SARSA_AUDIT_PYTHON||resolve('.venv-research/Scripts/python.exe'),root=resolve('.');
let directory,record,path;
const check=(file=path,script='scripts/audit-value-cue.py',output=null)=>spawnSync(python,['-B',script,file,...(output?['--output',output]:[])],{encoding:'utf8',cwd:root});
test.before(()=>{directory=mkdtempSync(join(tmpdir(),'value-cue-world-'));path=join(directory,'record.json');record=valueWorldEngineeringRecord();writeFileSync(path,JSON.stringify(record));});
test.after(()=>{assert.equal(dirname(resolve(directory)),resolve(tmpdir()));rmSync(directory,{recursive:true,force:true});});
test('independent wrapper reconstruction checks every program, phase, contact query, native charge, death and compact probe role',()=>{
  const output=join(directory,'numeric.json'),result=check(path,undefined,output);assert.equal(result.status,0,result.stderr);
  const audit=JSON.parse(readFileSync(output,'utf8'));assert.equal(audit.passed,true);assert.equal(audit.cases,24);assert.equal(audit.probes,25);
  assert.ok(audit.decisions>0&&audit.physicalReceipts===audit.decisions&&audit.transitions>0&&audit.terminalObservations>0&&audit.contactQueries>0);
  const bytes=readFileSync(output,'utf8');assert.notEqual(check(path,undefined,output).status,0);assert.equal(readFileSync(output,'utf8'),bytes);
});
test('captured full import closure independently checks and exactly replays all named worlds and paired probes outside the checkout',()=>{
  const captured=join(directory,'sources');assert.deepEqual(record.sources,valueWorldSourceHashes());
  for(const name of Object.keys(record.sources)){const target=resolve(captured,name);assert.ok(target.startsWith(resolve(captured)+sep));mkdirSync(dirname(target),{recursive:true});copyFileSync(name,target);}
  const numeric=check(path,join(captured,'scripts/audit-value-cue.py'));assert.equal(numeric.status,0,numeric.stderr);
  const output=join(directory,'replay.json'),replay=spawnSync(process.execPath,[join(captured,'scripts/value-cue-engineering.mjs'),'--replay',path,'--output',output],{encoding:'utf8',cwd:directory});
  assert.equal(replay.status,0,replay.stderr);assert.equal(JSON.parse(readFileSync(output,'utf8')).exactJsonReplay,true);
});
test('wrapper audit rejects altered choices, sensory geometry, work/storage, receipts, program identities, deaths and probe compaction/pairing',()=>{
  const event=(copy,kind)=>copy.cases[0].events.find(e=>e.type===kind),
    main=(copy,name)=>copy.cases.find(c=>c.name===name),
    probe=(copy,family='transfer',version='C')=>copy.probes.find(p=>p.parent==='phase-candidate'&&p.role==='probe'&&p.spec.family===family&&p.spec.version===version);
  const changes={
    choice:c=>{event(c,'decision').choice=(event(c,'decision').choice+1)%4;},
    program:c=>{event(c,'decision').program='actor';},
    ownEnergy:c=>{event(c,'decision').own.energy++;},
    nativeCue:c=>{event(c,'decision').nativeSourceCue=[9,9,9,9];},
    selectedCue:c=>{event(c,'decision').selectedCue[0]*=-1;},
    observation:c=>{event(c,'decision').own.observation[0]=0;},
    sensorPosition:c=>{event(c,'decision').sensorPosition.x++;},
    contactWork:c=>{event(c,'decision').contactOperations++;},
    scalarWork:c=>{event(c,'decision').scalarOperations++;},
    bytes:c=>{event(c,'decision').storageBytes++;},
    nextTarget:c=>{event(c,'transition').target+=1;},
    replayOwner:c=>{event(c,'transition').record.agentId++;},
    appliedMotor:c=>{event(c,'native-cost').outputs[1]=1;},
    nativeCharge:c=>{event(c,'native-cost').nativeMemoryRecords++;},
    physicalPosition:c=>{event(c,'physical').physicalPosition.x++;},
    cost:c=>{event(c,'physical').cost+=1;},
    paid:c=>{event(c,'physical').paidExtra+=1;},
    intake:c=>{event(c,'physical').beneficialEaten+=1;},
    terminal:c=>{main(c,'age-extinction').events.find(e=>e.type==='observe').own.terminal=false;},
    terminalDebt:c=>{main(c,'age-extinction').events.find(e=>e.type==='observe').outstandingEnergy=0;},
    discarded:c=>{main(c,'age-extinction').events.find(e=>e.type==='observe').discardedEnergy=0;},
    missingReceipt:c=>{const rows=c.cases[0].events;rows.splice(rows.findIndex(e=>e.type==='physical'),1);},
    missingCase:c=>{c.cases.pop();},
    missingProbe:c=>{c.probes.pop();},
    source:c=>{delete c.sources['learning/value-cue-experiment.mjs'];},
    denominator:c=>{c.cases[0].endpoint.founders=1;},
    residual:c=>{c.cases[0].endpoint.accountingResidual=1e-7;},
    savedWeights:c=>{main(c,'phase-candidate').finalCheckpoint.state.savedModels.A['1'][0][0]+=.1;},
    endCBody:c=>{main(c,'phase-candidate').finalCheckpoint.atC.world.world.flies[0].energy++;},
    probeBody:c=>{probe(c).events[0].world.world.flies[0].energy++;},
    probeWeights:c=>{probe(c).events.at(-1).learners['1'].weights[0][0]+=.1;},
    compactMemory:c=>{probe(c).events[0].learners['1'].acquiredTransitions=1;},
    compactHistory:c=>{probe(c).events[0].learners['1'].previous={inputs:[],action:0,tick:1};},
    unusedCircuit:c=>{probe(c,'transfer','accept').events[0].learners['1'].weights=[];},
    resetCost:c=>{probe(c,'transfer','reset').result.resetInitializationOperations=1;},
    probeDebt:c=>{c.probes.find(p=>p.parent==='partial-mortality').events[0].startingDebt=0;},
    pairedWorld:c=>{probe(c).events[0].world.world.food[0].x++;},
    sham:c=>{c.probes.find(p=>p.role==='sham').result.value+=1;}
  };
  const altered=join(directory,'altered.json');
  for(const [name,mutate]of Object.entries(changes)){
    const copy=structuredClone(record);mutate(copy);writeFileSync(altered,JSON.stringify(copy));const result=check(altered);
    assert.notEqual(result.status,0,`${name} accepted`);assert.match(result.stderr,/AssertionError/,`${name}: ${result.stderr}`);
  }
});
