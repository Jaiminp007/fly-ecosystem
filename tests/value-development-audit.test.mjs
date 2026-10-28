import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,mkdirSync,copyFileSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname,sep} from 'node:path';
import {spawnSync} from 'node:child_process';
import {gunzipSync,gzipSync} from 'node:zlib';
import {writeValueDevelopmentFixture} from '../scripts/value-development-fixtures.mjs';
import {verifyValueStudy,valueSeedExclusions,checkValueReserve,createValueWorkMonitor,createCompressedTape} from '../scripts/value-development.mjs';
import {digest} from '../learning/intervention-study.mjs';
const root=resolve('.'),python=process.env.SARSA_AUDIT_PYTHON||resolve('.venv-research/Scripts/python.exe');
let directory,fixture,fixtureDir;
const script="import json,runpy,sys; from pathlib import Path; a=runpy.run_path(sys.argv[1]); f=json.load(open(sys.argv[2],encoding='utf8')); totals=[a['audit_trace'](Path(sys.argv[3])/x['tape'],x['p'],x['history'],x['row']) for x in f['physical']]; print(json.dumps(totals))";
const check=(file=join(fixtureDir,'fixture.json'),folder=fixtureDir,source=join(root,'scripts/audit-value-development.py'))=>
  spawnSync(python,['-B','-c',script,source,file,folder],{encoding:'utf8',cwd:directory});
test.before(()=>{directory=mkdtempSync(join(tmpdir(),'value-study-'));fixtureDir=join(directory,'fixture');fixture=writeValueDevelopmentFixture(fixtureDir);});
test.after(()=>{assert.equal(dirname(resolve(directory)),resolve(tmpdir()));rmSync(directory,{recursive:true,force:true});});

test('independent complete collector stream covers 17 arms, 15 probes and sham, partial/full extinction and compact inference',()=>{
  const r=check();assert.equal(r.status,0,r.stderr);
  assert.ok(fixture.physical[0].row.endCCheckpointSha256);assert.equal(fixture.physical[0].row.probes.length,15);
  assert.equal(fixture.physical[2].row.endCCheckpointSha256,null);
  assert.ok(fixture.physical[2].row.probes.every(v=>v.value===0&&v.skippedAllDead));
});
test('captured full collector closure independently audits and cold-replays; failed development cannot open reserve',()=>{
  const captured=join(directory,'sources');
  for(const name of Object.keys(fixture.sources)){const target=resolve(captured,name);assert.ok(target.startsWith(resolve(captured)+sep));mkdirSync(dirname(target),{recursive:true});copyFileSync(join(root,name),target);}
  const r=check(undefined,undefined,join(captured,'scripts/audit-value-development.py'));assert.equal(r.status,0,r.stderr);
  const replay=spawnSync(process.execPath,[join(captured,'scripts/value-development-fixtures.mjs'),'--replay',fixtureDir,'--output',join(directory,'replay.json')],{encoding:'utf8',cwd:directory});
  assert.equal(replay.status,0,replay.stderr);assert.equal(JSON.parse(readFileSync(join(directory,'replay.json'))).exactEventAndRowReplay,true);
  const fake={...fixture.inference.p,sourceSha256:fixture.sources,seedRegistries:[],engineeringSources:[],excludedSeeds:valueSeedExclusions([],[])},fakeDir=join(directory,'fake-study');
  const shift=value=>typeof value==='number'?value+1000000:Array.isArray(value)?value.map(shift):Object.fromEntries(Object.entries(value).map(([k,v])=>[k,shift(v)]));
  fake.developmentHistories=fake.developmentHistories.map(shift);fake.confirmationHistories=fake.confirmationHistories.map(shift);
  for(const name of Object.keys(fixture.sources)){const target=join(fakeDir,'sources',name);mkdirSync(dirname(target),{recursive:true});copyFileSync(join(root,name),target);}
  assert.throws(()=>verifyValueStudy(fakeDir,fake),/captured entrypoint/);
  writeFileSync(join(fakeDir,'protocol.json'),JSON.stringify(fake));mkdirSync(join(fakeDir,'development'));
  writeFileSync(join(fakeDir,'development/results.json'),JSON.stringify({promising:false}));
  const closed=spawnSync(process.execPath,[join(fakeDir,'sources/scripts/value-development.mjs'),'collect',fakeDir,'confirmation'],{encoding:'utf8',cwd:directory});
  assert.notEqual(closed.status,0);assert.match(closed.stderr,/confirmation closed/);assert.equal(existsSync(join(fakeDir,'confirmation')),false);
});
test('exclusions, physical-work ceiling, tape ceilings and result-bound audit approvals enforce preflight limits',()=>{
  const excluded=valueSeedExclusions([{seed:777001,history:{probeSeeds:{A:777002}},ordinary:777003}],["const seed=777004; const other=0xabcde;"]);
  for(const n of [41,250001,250512,252001,252288,252512,777001,777002,777004,0xabcde])assert.ok(excluded.includes(n));assert.ok(!excluded.includes(777003));
  const m=createValueWorkMonitor({maxPolicyScalarOperations:6},1);
  m.emit({type:'main-start',arm:'candidate',checkpoint:{state:{founderIds:[1]}}});
  const event=n=>({role:'main:candidate',event:{type:'decision',own:{agentId:1},scalarOperations:n}});
  m.emit(event(3));assert.equal(m.operations(),4);assert.throws(()=>m.emit(event(2)),/Monotonic/);assert.throws(()=>m.emit(event(6)),/ceiling/);
  const p=createValueWorkMonitor({maxPolicyScalarOperations:5});
  p.emit({role:'probe:A:C',event:{type:'probe-start',learners:{1:{work:{scalarOperations:100}}}}});
  p.emit({role:'probe:A:C',event:{type:'observe',own:{agentId:1},scalarOperations:104}});assert.equal(p.operations(),4);
  const folder=join(directory,'limits');mkdirSync(folder);
  for(const [label,budget]of Object.entries({raw:{maxUncompressedTraceBytesPerHistory:1,maxCompressedTraceBytesPerHistory:10000},compressed:{maxUncompressedTraceBytesPerHistory:10000,maxCompressedTraceBytesPerHistory:1}})){
    const path=join(folder,`${label}.gz`),t=createCompressedTape(path,budget);
    assert.throws(()=>{t.emit({event:'some data'});t.close();},/ceiling/);t.abort();assert.ok(existsSync(path));assert.throws(()=>createCompressedTape(path,budget));
  }
  const dev=join(folder,'development');mkdirSync(dev);const results=join(dev,'results.json');writeFileSync(results,JSON.stringify({promising:true}));
  assert.throws(()=>checkValueReserve(folder,'protocol'));
  for(const name of ['physical-audit.json','numeric-audit.json'])writeFileSync(join(dev,name),JSON.stringify({passed:true,protocolSha256:'protocol',resultsSha256:digest(readFileSync(results))}));
  checkValueReserve(folder,'protocol');assert.throws(()=>checkValueReserve(folder,'foreign'));
  writeFileSync(results,JSON.stringify({promising:false}));assert.throws(()=>checkValueReserve(folder,'protocol'),/confirmation closed/);
  writeFileSync(results,JSON.stringify({promising:true,changed:true}));assert.throws(()=>checkValueReserve(folder,'protocol'));
});
test('stream checker rejects changed choice, missing observations/roles, source refill and malformed compact probe starts',()=>{
  const source=fixture.physical[0],lines=gunzipSync(readFileSync(join(fixtureDir,source.tape))).toString().trimEnd().split('\n');
  const fakeDir=join(directory,'altered');mkdirSync(fakeDir);
  const alteredFile=join(fakeDir,'fixture.json');writeFileSync(alteredFile,JSON.stringify({...fixture,physical:[source]}));
  const testLines=(label,alter)=>{
    writeFileSync(join(fakeDir,source.tape),gzipSync(Buffer.from(alter.join('\n')+'\n')));
    const r=check(alteredFile,fakeDir);assert.notEqual(r.status,0,label);assert.match(r.stderr,/AssertionError/,`${label}: ${r.stderr}`);
  };
  const choice=lines.findIndex(line=>line.includes('"type":"decision"')),changed=JSON.parse(lines[choice]);changed.event.choice=(changed.event.choice+1)%4;
  testLines('choice',[...lines.slice(0,choice),JSON.stringify(changed)]);
  testLines('truncated',lines.slice(0,10));
  const end=lines.findIndex(line=>line.startsWith('{"type":"main-end","arm":"candidate"')),refill=JSON.parse(lines[end]);refill.checkpoint.atC.world.world.flies[0].energy++;
  testLines('end-C refill',[...lines.slice(0,end),JSON.stringify(refill)]);
  testLines('missing pressure role',lines.filter(line=>!line.startsWith('{"role":"probe:A:B",')));
  const start=lines.findIndex(line=>line.startsWith('{"role":"probe:A:A",')&&line.includes('"type":"probe-start"'));
  for(const[label,mutate]of Object.entries({history:e=>{e.learners['1'].previous={foreign:true};},memory:e=>{e.learners['1'].older=[{foreign:true}];},debt:e=>{e.startingDebt++;},weights:e=>{e.learners['1'].weights[0][0]+=.1;},body:e=>{e.world.world.flies[0].x++;}})){
    const e=JSON.parse(lines[start]);mutate(e.event);
    const input={event:e.event,checkpoint:JSON.parse(lines[end]).checkpoint.atC,spec:{family:'A',version:'A'},p:source.p,h:source.history};
    const r=spawnSync(python,['-B','-c',"import json,runpy,sys; a=runpy.run_path(sys.argv[1]); x=json.load(sys.stdin); a['start_probe'](x['event'],x['checkpoint'],x['spec'],x['p'],x['h'])",join(root,'scripts/audit-value-development.py')],{input:JSON.stringify(input),encoding:'utf8'});
    assert.notEqual(r.status,0,label);assert.match(r.stderr,/AssertionError/,`${label}: ${r.stderr}`);
  }
});
