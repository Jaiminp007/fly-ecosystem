import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync,mkdirSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname,join,resolve} from 'node:path';
import {gzipSync,gunzipSync} from 'node:zlib';
import {spawnSync} from 'node:child_process';
import {digest} from '../learning/intervention-study.mjs';
import {ValueCueExperiment} from '../learning/value-cue-experiment.mjs';
import {VALUE_REFERENCE,valueActivity} from '../learning/value-development.mjs';
const python=process.env.SARSA_AUDIT_PYTHON||'python';
const history={seed:253001,cueSeed:253002,resourceSeeds:[253003,253004,253005,253006],shuffleSeed:253007,nullSeed:253008};
let directory;const fixtures={};
const check=(fixture)=>spawnSync(python,['-B','-c',"import json,runpy,sys; from pathlib import Path; a=runpy.run_path(sys.argv[1]); r=json.load(open(sys.argv[2],encoding='utf8')); print(json.dumps(a['describe_stream'](Path(sys.argv[3]),r)))",'scripts/describe-value-development.py',fixture.rowPath,fixture.tape],{encoding:'utf8',maxBuffer:1024*1024});
function fixture(profile){
  const events=[],reference={...structuredClone(VALUE_REFERENCE),founders:2};
  const run=new ValueCueExperiment({history,arm:'candidate',reference,pricing:{operationEnergy:5e-6/17,byteEnergyPerSecond:1e-5/(17*8)},emit:event=>events.push({role:'main:candidate',event})});
  for(const[index,fly]of run.world.flies.entries()){
    Object.assign(fly,{energy:120,x:100+400*index,y:100,age:0});
    Object.assign(fly.genome.traits,{speed:0,metabolism:0,lifespan:profile==='extinct'||profile==='partial'&&index===0?.01:1000});
  }
  for(const patch of run.world.food)Object.assign(patch,{x:950,y:600,amount:0,regrowth:0});
  if(profile==='mixed'){
    for(const[index,valence]of [1,-1].entries()){
      const cue=run.codebook.A.find(c=>c.valence===valence);
      Object.assign(run.world.food[index],{x:100,y:100+index,amount:.8,capacity:1,cueId:cue.id,cue:[...cue.bits],valence});
    }
  }
  run.world.initialEnergy=run.world.energy();run.startingEnergy=240;
  events.push({type:'main-start',arm:'candidate',checkpoint:run.checkpoint(false)});
  run.advance(profile==='mixed'?12:1792);
  const endpoint=run.endpoint();events.push({type:'main-end',arm:'candidate',checkpoint:run.checkpoint(),endpoint});
  const row={history,arms:{candidate:{endpoint,activity:valueActivity(run.learners)}}};
  const bytes=Buffer.from(events.map(e=>JSON.stringify(e)+'\n').join('')),compressed=gzipSync(bytes),tape=join(directory,`${profile}.gz`),rowPath=join(directory,`${profile}.json`);
  Object.assign(row,{numericsSha256:digest(compressed),compressedBytes:compressed.length,uncompressedSha256:digest(bytes),uncompressedBytes:bytes.length});
  writeFileSync(tape,compressed);writeFileSync(rowPath,JSON.stringify(row));return {row,rowPath,tape};
}
test.before(()=>{directory=mkdtempSync(join(tmpdir(),'value-exposure-'));for(const profile of ['full','partial','extinct','mixed'])fixtures[profile]=fixture(profile);});
test.after(()=>{assert.equal(dirname(resolve(directory)),resolve(tmpdir()));rmSync(directory,{recursive:true,force:true});});

test('read-only description attributes boundary rewards to source ticks, bills terminal work, retains dead states and describes mixed receipts',()=>{
  const descriptions={};
  for(const[name,f]of Object.entries(fixtures)){const r=check(f);assert.equal(r.status,0,r.stderr);descriptions[name]=JSON.parse(r.stdout);}
  const full=descriptions.full;
  assert.equal(full.phases.A.decisions,1024);assert.equal(full.phases.A.transitions,1024,'Tick 512 matures in the next phase but belongs to A');
  assert.equal(full.phases['return-A'].decisions,512);assert.equal(full.phases['return-A'].transitions,510,'Final live decisions remain pending');
  assert.equal(full.initializationOperations,4);assert.equal(full.weightChangesFromInitialization.C.present,true);
  assert.ok(full.retainedMemory.C.every(v=>v.recent+v.older===64));
  assert.equal(descriptions.partial.phases.A.terminalTransitions,1);assert.equal(descriptions.partial.retainedMemory.final.filter(v=>v.dead).length,1);
  assert.equal(descriptions.extinct.phases.A.terminalTransitions,2);assert.ok(descriptions.extinct.phases.A.terminalNewCharge>0);
  assert.equal(descriptions.extinct.retainedMemory.C,null);assert.equal(descriptions.extinct.weightChangesFromInitialization.A.present,false);
  assert.ok(descriptions.mixed.phases.A.mixedReceipts>0);assert.ok(descriptions.mixed.phases.A.nativeCueDifferences>0);
});

test('description rejects altered raw/compressed identity, corrupted reward/cost receipts and false update totals',()=>{
  const f=fixtures.mixed,original=gunzipSync(readFileSync(f.tape)),lines=original.toString().trimEnd().split('\n');
  const exercise=(label,mutateLines,mutateRow)=>{
    const altered=lines.map(v=>JSON.parse(v));mutateLines?.(altered);const raw=Buffer.from(altered.map(e=>JSON.stringify(e)+'\n').join('')),bytes=gzipSync(raw);
    const row=structuredClone(f.row);Object.assign(row,{numericsSha256:digest(bytes),compressedBytes:bytes.length,uncompressedSha256:digest(raw),uncompressedBytes:raw.length});mutateRow?.(row);
    const copy={tape:join(directory,`altered-${label}.gz`),rowPath:join(directory,`altered-${label}.json`)};
    writeFileSync(copy.tape,bytes);writeFileSync(copy.rowPath,JSON.stringify(row));const r=check(copy);assert.notEqual(r.status,0,label);assert.match(r.stderr,/AssertionError/,r.stderr);
  };
  exercise('compressed',null,row=>{row.numericsSha256='foreign';});exercise('raw',null,row=>{row.uncompressedSha256='foreign';});
  exercise('cost',v=>{v.find(x=>x.event?.type==='physical').event.cost++;});
  exercise('reward',v=>{v.find(x=>x.event?.type==='transition').event.record.reward++;});
  exercise('updates',null,row=>{row.arms.candidate.activity.updates++;});
});

test('real-bank entrypoint requires both successful protocol/result-bound audits before any description output',()=>{
  const study=join(directory,'unapproved'),development=join(study,'development');mkdirSync(development,{recursive:true});
  writeFileSync(join(study,'protocol.json'),JSON.stringify({experiment:'fixed-contact-value-development-v1',developmentHistories:[]}));
  writeFileSync(join(development,'results.json'),JSON.stringify({promising:false}));
  const output=join(directory,'unapproved-output.json'),invoke=()=>spawnSync(python,['-B','scripts/describe-value-development.py',study,'--output',output],{encoding:'utf8'});
  assert.notEqual(invoke().status,0);assert.equal(existsSync(output),false);
  for(const name of ['physical-audit.json','numeric-audit.json'])writeFileSync(join(development,name),JSON.stringify({passed:true,protocolSha256:'foreign',resultsSha256:'foreign',histories:0}));
  const r=invoke();assert.notEqual(r.status,0);assert.match(r.stderr,/AssertionError/);assert.equal(existsSync(output),false);
});
