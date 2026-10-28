import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,mkdirSync,copyFileSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname,join,resolve,sep} from 'node:path';
import {spawnSync} from 'node:child_process';
import {gunzipSync,gzipSync} from 'node:zlib';
import {writeTickDevelopmentFixture} from '../scripts/tick-development-fixtures.mjs';
import {verifyTickStudy} from '../scripts/tick-development.mjs';
const root=resolve('.'),python=process.env.SARSA_AUDIT_PYTHON || resolve('.venv-research/Scripts/python.exe');
let directory,fixture,fixtureDir;
const script="import json,runpy,sys; from pathlib import Path; a=runpy.run_path(sys.argv[1]); f=json.load(open(sys.argv[2],encoding='utf8')); x=f['physical']; a['audit_trace'](Path(sys.argv[3]),x['p'],x['history'],x['row']); [a['STATS']['audit_score'](b['rows'],f['inference']['p'],b['phase'],b['result']) for b in f['inference']['banks']]; print('independent stream and inference passed')";
const check=(file=join(fixtureDir,'fixture.json'),trace=join(fixtureDir,'events.jsonl.gz'),source=join(root,'scripts/audit-tick-development.py')) =>
  spawnSync(python,['-B','-c',script,source,file,trace],{encoding: 'utf8',cwd: directory});
test.before(() => {directory=mkdtempSync(join(tmpdir(),'tick-study-')); fixtureDir=join(directory,'fixture'); fixture=writeTickDevelopmentFixture(fixtureDir);});
test.after(() => {assert.equal(dirname(resolve(directory)),resolve(tmpdir())); rmSync(directory,{recursive: true,force: true});});

test('complete artificial collector stream independently reconstructs all roles, probes and both inference phases', () => {
  const result=check(); assert.equal(result.status,0,result.stderr);
  assert.ok(fixture.physical.row.endCCheckpointSha256); assert.equal(fixture.physical.row.probes.length,15);
});

test('captured full collector closure independently audits and replays outside the checkout', () => {
  const captured=join(directory,'sources');
  for (const name of Object.keys(fixture.sources)) {const target=resolve(captured,name); assert.ok(target.startsWith(resolve(captured)+sep)); mkdirSync(dirname(target),{recursive: true}); copyFileSync(join(root,name),target);}
  const result=check(undefined,undefined,join(captured,'scripts/audit-tick-development.py')); assert.equal(result.status,0,result.stderr);
  const replay=spawnSync(process.execPath,[join(captured,'scripts/tick-development-fixtures.mjs'),'--replay',fixtureDir,'--output',join(directory,'replay.json')],{encoding: 'utf8',cwd: directory});
  assert.equal(replay.status,0,replay.stderr); assert.equal(JSON.parse(readFileSync(join(directory,'replay.json'),'utf8')).exactEventAndRowReplay,true);
  const fake={...fixture.inference.p,sourceSha256: fixture.sources,seedRegistries: [],engineeringSources: []};
  for (const name of Object.keys(fixture.sources)) {const target=join(directory,'fake-study','sources',name); mkdirSync(dirname(target),{recursive: true}); copyFileSync(join(root,name),target);}
  assert.throws(() => verifyTickStudy(join(directory,'fake-study'),fake),/captured entrypoint/);
  const fakeDir=join(directory,'fake-study');
  writeFileSync(join(fakeDir,'protocol.json'),JSON.stringify(fake)); mkdirSync(join(fakeDir,'development'));
  writeFileSync(join(fakeDir,'development/results.json'),JSON.stringify({promising: false}));
  const closed=spawnSync(process.execPath,[join(fakeDir,'sources/scripts/tick-development.mjs'),'collect',fakeDir,'confirmation'],{encoding: 'utf8',cwd: directory});
  assert.notEqual(closed.status,0); assert.match(closed.stderr,/confirmation closed/); assert.equal(existsSync(join(fakeDir,'confirmation')),false);
});

test('independent statistics rejects changed effects, criticals, missing tests, survivor arithmetic and false qualification', () => {
  const source=join(root,'scripts/audit-tick-statistics.py');
  const checkStats=copy => spawnSync(python,['-B','-c',"import json,runpy,sys; a=runpy.run_path(sys.argv[1]); f=json.load(sys.stdin); [a['audit_score'](b['rows'],f['p'],b['phase'],b['result']) for b in f['banks']]",source],{input: JSON.stringify(copy),encoding: 'utf8'});
  for (const mutate of [f => {f.banks[0].result.comparisons[0].effects[0]++;},f => {f.p.critical.confirmation=1;},
    f => {f.banks[0].result.comparisons.pop();},f => {f.banks[0].result.survival[0].counts[0]++;},
    f => {f.banks[0].result.qualified=true;},f => {f.banks[1].result.comparisons[0].pOneSided=0;},
    f => {f.banks[0].rows[0].probes[0].founders=1;},f => {f.banks[0].result.activity[0].activeFounders=1;},
    f => {f.p.budget.totalWorlds=29;},f => {f.p.learner.actorRate=.02;}]) {
    const copy=structuredClone(fixture.inference); mutate(copy); const result=checkStats(copy);
    assert.notEqual(result.status,0,'Altered inference accepted'); assert.match(result.stderr,/AssertionError/);
  }
});

test('stream audit rejects early changed choices and truncated/missing probe coverage', () => {
  const bytes=gunzipSync(readFileSync(join(fixtureDir,'events.jsonl.gz'))),lines=bytes.toString().trimEnd().split('\n');
  const choice=lines.findIndex(line => line.includes('"type":"decision"'));
  const changed=JSON.parse(lines[choice]); changed.event.choice=(changed.event.choice+1)%4;
  const altered=join(directory,'altered.gz'); writeFileSync(altered,gzipSync(Buffer.from([...lines.slice(0,choice),JSON.stringify(changed)].join('\n')+'\n')));
  const result=check(undefined,altered); assert.notEqual(result.status,0); assert.match(result.stderr,/AssertionError/);
  writeFileSync(altered,gzipSync(Buffer.from(lines.slice(0,10).join('\n')+'\n')));
  const missing=check(undefined,altered); assert.notEqual(missing.status,0); assert.match(missing.stderr,/AssertionError/);
  const end=lines.findIndex(line => line.startsWith('{"type":"main-end","arm":"candidate"')),
    refill=JSON.parse(lines[end]); refill.checkpoint.atC.world.world.flies[0].energy++;
  writeFileSync(altered,gzipSync(Buffer.from([...lines.slice(0,end),JSON.stringify(refill)].join('\n')+'\n')));
  const sourceRefill=check(undefined,altered); assert.notEqual(sourceRefill.status,0); assert.match(sourceRefill.stderr,/end-C source body energy/);
  writeFileSync(altered,gzipSync(Buffer.from(lines.filter(line => !line.startsWith('{"role":"probe:A:B",')).join('\n')+'\n')));
  const absentProbe=check(undefined,altered); assert.notEqual(absentProbe.status,0); assert.match(absentProbe.stderr,/AssertionError/);
});
