import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,readdirSync,openSync,writeSync,closeSync,statSync,statfsSync} from 'node:fs';
import {dirname,resolve,join,relative,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes,createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import {digest} from '../learning/intervention-study.mjs';
import {CONTINUAL_PHASES} from '../learning/continual-regimes.mjs';
import {TICK_AC_DEFAULTS} from '../learning/tick-actor-critic.mjs';
import {TICK_CUE_ARMS} from '../learning/tick-cue-experiment.mjs';
import {TICK_STUDY_PROBES,TICK_CONTRASTS,TICK_SURVIVAL,TICK_BUDGET,validateTickProtocol,simulateTickHistory,validateTickRow,scoreTickRows} from '../learning/tick-development.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)), readJson=path => JSON.parse(readFileSync(path,'utf8'));
const writeNew=(path,value) => writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag: 'wx'});
export const TICK_SOURCE_ROOTS=['scripts/tick-development.mjs','scripts/audit-tick-development.py','scripts/audit-tick-statistics.py',
  'scripts/audit-tick-cue.py','scripts/audit-tick-actor-critic.py','docs/TICK_LEARNING_DEVELOPMENT.md',
  'tests/tick-development.test.mjs','tests/tick-development-audit.test.mjs'];
export function tickSourceHashes() {
  const found={},visit=path => {
    const name=relative(root,path).split(sep).join('/'); assert.ok(name && !name.startsWith('../') && !name.startsWith('/'));
    if (found[name]) return;
    const bytes=readFileSync(path); found[name]=digest(bytes);
    if (/\.m?js$/.test(name)) for (const m of bytes.toString('utf8').matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g)) visit(resolve(dirname(path),m[1]));
  };
  TICK_SOURCE_ROOTS.forEach(name => visit(resolve(root,name)));
  return Object.fromEntries(Object.entries(found).sort(([a],[b]) => a.localeCompare(b,'en')));
}
export function createCompressedTape(path,budget,consume = () => {}) {
  const fd=openSync(path,'wx'), compressed=createHash('sha256'),raw=createHash('sha256');
  let chunks=[],bufferBytes=0,rawBytes=0,compressedBytes=0,closed=false;
  const flush=() => {
    if (!bufferBytes) return;
    const bytes=gzipSync(Buffer.concat(chunks),{level: 6}); compressedBytes+=bytes.length;
    assert.ok(compressedBytes<=budget.maxCompressedTraceBytesPerHistory,'Compressed trace ceiling');
    writeSync(fd,bytes); compressed.update(bytes); chunks=[]; bufferBytes=0;
  };
  return {
    emit(event) {
      assert.ok(!closed); consume(event);
      const bytes=Buffer.from(JSON.stringify(event)+'\n'); rawBytes+=bytes.length;
      assert.ok(rawBytes<=budget.maxUncompressedTraceBytesPerHistory,'Uncompressed trace ceiling');
      raw.update(bytes); chunks.push(bytes); bufferBytes+=bytes.length; if (bufferBytes>=2097152) flush();
    },
    close() {assert.ok(!closed); closed=true; try {flush();} finally {closeSync(fd);} return {numericsSha256: compressed.digest('hex'),
      uncompressedSha256: raw.digest('hex'),uncompressedBytes: rawBytes,compressedBytes};},
    abort() {if (!closed) {closed=true; closeSync(fd);}}
  };
}
function scanFiles(path,visit) {
  for (const entry of readdirSync(path,{withFileTypes: true})) {
    const file=join(path,entry.name);
    if (entry.isDirectory() && !['sources','registries','engineering','authority-inputs'].includes(entry.name)) scanFiles(file,visit);
    else if (entry.isFile()) visit(file,entry.name);
  }
}
export function initializeTickStudy(directory,python) {
  assert.ok(statfsSync(root).bavail*statfsSync(root).bsize>TICK_BUDGET.maxEvidenceBytes+2147483648,'Need budget plus 2 GiB free');
  const authority=readJson(join(root,'evidence/cue-authority/20261024-v1/protocol.json'));
  mkdirSync(dirname(directory),{recursive: true}); mkdirSync(directory);
  const sourceSha256=tickSourceHashes();
  for (const name of Object.keys(sourceSha256)) {const target=join(directory,'sources',name); mkdirSync(dirname(target),{recursive: true}); writeFileSync(target,readFileSync(join(root,name)),{flag: 'wx'});}
  const excluded=new Set([41,...Array.from({length: 512},(_,i) => 250001+i)]),seedRegistries=[],engineeringSources=[];
  function visit(value,key='') {
    if (Array.isArray(value)) value.forEach(v => visit(v,key));
    else if (value && typeof value==='object') for (const [k,v] of Object.entries(value)) visit(v,/seed/i.test(key) ? key : k);
    else if (/seed/i.test(key) && Number.isInteger(value) && value>0 && value<=0xffffffff) excluded.add(value);
  }
  scanFiles(join(root,'evidence'),(path,name) => {
    if (name!=='protocol.json') return;
    const bytes=readFileSync(path),nameInRepo=relative(root,path).split(sep).join('/'); visit(JSON.parse(bytes));
    seedRegistries.push({path: nameInRepo,sha256: digest(bytes)});
    const target=join(directory,'registries',nameInRepo); mkdirSync(dirname(target),{recursive: true}); writeFileSync(target,bytes,{flag: 'wx'});
  });
  const engineering=[...readdirSync(join(root,'tests')).filter(n => n.endsWith('.mjs')).map(n => `tests/${n}`),
    ...readdirSync(join(root,'scripts')).filter(n => /(?:engineering|fixtures).*\.mjs$/.test(n)).map(n => `scripts/${n}`)];
  for (const name of engineering) {
    const bytes=readFileSync(join(root,name));
    for (const m of bytes.toString('utf8').matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)) {
      const v=Number(m[0].replaceAll('_','')); if (Number.isSafeInteger(v) && v>0 && v<=0xffffffff) excluded.add(v);
    }
    engineeringSources.push({path: name,sha256: digest(bytes)});
    const target=join(directory,'engineering',name); mkdirSync(dirname(target),{recursive: true}); writeFileSync(target,bytes,{flag: 'wx'});
  }
  const used=new Set(excluded),fresh=() => {let seed; do {seed=randomBytes(4).readUInt32BE();} while (!seed || used.has(seed)); used.add(seed); return seed;};
  const histories=Array.from({length: 24},() => ({seed: fresh(),cueSeed: fresh(),resourceSeeds: Array.from({length: 4},fresh),
    shuffleSeed: fresh(),nullSeed: fresh(),probeSeeds: {A: fresh(),B: fresh(),C: fresh(),transfer: fresh()}}));
  const critical=JSON.parse(execFileSync(python,['-c',"import json; from scipy.stats import t; print(json.dumps({kind:{phase:float(t.ppf(q,n-1)) for phase,n in [('development',8),('confirmation',16)]} for kind,q in [('critical',1-.05/22),('equivalenceCritical',1-.05/44),('descriptiveCritical',.975)]}))"],{encoding: 'utf8'}));
  const p={schema: 1,experiment: 'fixed-tick-actor-critic-development-v1',createdAt: new Date().toISOString(),sourceSha256,seedRegistries,engineeringSources,
    excludedSeeds: [...excluded].sort((a,b) => a-b),learner: TICK_AC_DEFAULTS,phases: CONTINUAL_PHASES,
    reference: authority.reference,pricing: {operationEnergy: 5e-6/17,byteEnergyPerSecond: 1e-5/(17*8)},
    developmentHistories: histories.slice(0,8),confirmationHistories: histories.slice(8),arms: TICK_CUE_ARMS,probes: TICK_STUDY_PROBES,
    contrasts: TICK_CONTRASTS,survival: TICK_SURVIVAL,budget: TICK_BUDGET,...critical,alphaPerTest: .05/22,nullMargin: .5,
    interferenceFraction: .05,retentionFraction: .95,resetConstructionNeutral: true,
    hypothesis: 'One fixed human-proposed tick-aligned shared actor-critic, own trajectories only. No parameter search. All prospective development gates must pass before the immutable sixteen-history reserve is opened. No unchanged rerun, sample extension, bank replacement or RSI claim.',
    statisticalAssumptions: 'Independent seed histories; directional Student-t lower bounds and exact sign-flip tests assume appropriate mean uncertainty and symmetric paired effects. Bonferroni family of 22 tests. Equivalence uses the stricter two-sided .05/44 critical. Development is a mean screen, not qualification.',
    collection: 'Thirteen continuing main worlds, fifteen unique frozen probes and one identical A:A sham per history. Full compressed factual tapes; same captured-source hash enforcement for collection/scoring/replay. Partial/failed outputs preserved. Ceiling failure closes this bank without a scientific success claim.'};
  validateTickProtocol(p); writeNew(join(directory,'protocol.json'),p);
  return {directory,protocolSha256: digest(readFileSync(join(directory,'protocol.json'))),histories: 24,contrasts: 22};
}
export function verifyTickStudy(directory,p,{enforceEntrypoint = true} = {}) {
  validateTickProtocol(p);
  assert.deepEqual(tickSourceHashes(),p.sourceSha256,'Executed source closure differs');
  for (const [name,hash] of Object.entries(p.sourceSha256)) assert.equal(digest(readFileSync(join(directory,'sources',name))),hash,name);
  for (const r of p.seedRegistries) assert.equal(digest(readFileSync(join(directory,'registries',r.path))),r.sha256);
  for (const r of p.engineeringSources) assert.equal(digest(readFileSync(join(directory,'engineering',r.path))),r.sha256);
  if (enforceEntrypoint) assert.equal(fileURLToPath(import.meta.url),join(directory,'sources','scripts','tick-development.mjs'),'Run the captured entrypoint');
}
function checkReserve(directory,protocolSha256) {
  const bytes=readFileSync(join(directory,'development','results.json')); assert.equal(JSON.parse(bytes).promising,true,'Failed development: confirmation closed');
  for (const name of ['physical-audit.json','numeric-audit.json']) {const a=readJson(join(directory,'development',name)); assert.equal(a.passed,true); assert.equal(a.protocolSha256,protocolSha256); assert.equal(a.resultsSha256,digest(bytes));}
}
const evidenceSize=directory => {let bytes=0; const visit=path => {for (const entry of readdirSync(path,{withFileTypes: true})) {const target=join(path,entry.name); if (entry.isDirectory()) visit(target); else if (entry.isFile()) bytes+=statSync(target).size;}}; visit(directory); return bytes;};
const rowOperations=row => Object.values(row.arms).reduce((n,r) => n+r.endpoint.scalarOperations,0)+
  row.probes.reduce((n,r) => n+(r.endpoint?.additionalScalarOperations ?? 0),0)+(row.sham.endpoint?.additionalScalarOperations ?? 0);
export function runTickStudy(command,directory,phase='development') {
  assert.ok(['collect','score','audit'].includes(command)); assert.ok(['development','confirmation'].includes(phase));
  const protocolBytes=readFileSync(join(directory,'protocol.json')),p=JSON.parse(protocolBytes),protocolSha256=digest(protocolBytes);
  verifyTickStudy(directory,p); if (phase==='confirmation') checkReserve(directory,protocolSha256);
  const folder=join(directory,phase),histories=p[`${phase}Histories`];
  mkdirSync(join(folder,'rows'),{recursive: true}); mkdirSync(join(folder,'numerics'),{recursive: true});
  const prior=phase==='confirmation' ? readJson(join(directory,'development','results.json')) : null;
  const priorReplay=phase==='confirmation' && command==='audit' ? readJson(join(directory,'development','physical-audit.json')) : null;
  let cpuUsed=prior?.runtimeTotals?.cpuMicroseconds ?? 0,wallUsed=prior?.runtimeTotals?.wallSeconds ?? 0;
  if (command==='collect') {
    for (const h of histories) {
      const target=join(folder,'rows',`${h.seed}.json`),trace=join(folder,'numerics',`${h.seed}.jsonl.gz`);
      let old; try {old=readJson(target);} catch (e) {if (e.code!=='ENOENT') throw e;}
      if (old) {validateTickRow(old,h,p,phase); assert.equal(old.protocolSha256,protocolSha256); assert.equal(old.numericsSha256,digest(readFileSync(trace))); cpuUsed+=old.runtime.cpuMicroseconds; wallUsed+=old.runtime.wallSeconds; assert.ok(cpuUsed<=p.budget.maxCollectionCpuMicroseconds && wallUsed<=p.budget.maxCollectionWallSeconds); continue;}
      assert.ok(evidenceSize(directory)<p.budget.maxEvidenceBytes,'Evidence ceiling');
      const start=performance.now(),cpu=process.cpuUsage(),tape=createCompressedTape(trace,p.budget); let row,hashes;
      let events=0;
      try {row=simulateTickHistory(p,h,phase,event => {tape.emit(event); if (++events%2048===0) {const used=process.cpuUsage(cpu); assert.ok(wallUsed+(performance.now()-start)/1000<=p.budget.maxCollectionWallSeconds && cpuUsed+used.user+used.system<=p.budget.maxCollectionCpuMicroseconds,'Collection runtime ceiling');}}); hashes=tape.close();} catch (e) {tape.abort(); throw e;}
      const used=process.cpuUsage(cpu),runtime={wallSeconds: (performance.now()-start)/1000,cpuMicroseconds: used.user+used.system,node: process.version,platform: process.platform};
      validateTickRow(row,h,p,phase); writeNew(target,{...row,protocolSha256,...hashes,runtime});
      cpuUsed+=runtime.cpuMicroseconds; wallUsed+=runtime.wallSeconds;
      assert.ok(cpuUsed<=p.budget.maxCollectionCpuMicroseconds && wallUsed<=p.budget.maxCollectionWallSeconds,'Collection runtime ceiling');
      console.log(JSON.stringify({phase,seed: h.seed,...runtime,compressedBytes: hashes.compressedBytes}));
    } return;
  }
  const rows=histories.map(h => {const r=readJson(join(folder,'rows',`${h.seed}.json`)); validateTickRow(r,h,p,phase); assert.equal(r.protocolSha256,protocolSha256);
    assert.equal(r.numericsSha256,digest(readFileSync(join(folder,'numerics',`${h.seed}.jsonl.gz`)))); return r;});
  const scored=scoreTickRows(rows,p,phase),rowSha256=histories.map(h => digest(readFileSync(join(folder,'rows',`${h.seed}.json`)))),
    runtimeTotals={wallSeconds: rows.reduce((n,r) => n+r.runtime.wallSeconds,0)+(prior?.runtimeTotals?.wallSeconds ?? 0),
      cpuMicroseconds: rows.reduce((n,r) => n+r.runtime.cpuMicroseconds,0)+(prior?.runtimeTotals?.cpuMicroseconds ?? 0)};
  const result={...scored,protocolSha256,rowSha256,runtimeTotals};
  result.policyScalarOperations=rows.reduce((n,row) => n+rowOperations(row),0)+(prior?.policyScalarOperations ?? 0);
  assert.ok(result.policyScalarOperations<=p.budget.maxPolicyScalarOperations,'Policy work ceiling');
  if (command==='score') {assert.ok(runtimeTotals.wallSeconds<=p.budget.maxCollectionWallSeconds && runtimeTotals.cpuMicroseconds<=p.budget.maxCollectionCpuMicroseconds); writeNew(join(folder,'results.json'),result); console.log(JSON.stringify({promising: scored.promising,qualified: scored.qualified,comparisons: scored.comparisons.map(c => ({id: c.id,mean: c.mean,developmentPass: c.developmentPass,confirmationPass: c.confirmationPass}))})); return;}
  // Replay compares the full uncompressed event stream and canonical row. Gzip
  // framing is a bounded transport detail; its recorded bytes are hashed above.
  const resultBytes=readFileSync(join(folder,'results.json'));
  const storedResult=JSON.parse(resultBytes); assert.deepEqual(storedResult,result);
  const start=performance.now(),cpu=process.cpuUsage(); let operations=priorReplay?.operations ?? 0;
  for (const [i,h] of histories.entries()) {
    const hash=createHash('sha256'),regenerated=simulateTickHistory(p,h,phase,event => hash.update(JSON.stringify(event)+'\n'));
    const {protocolSha256: _,numericsSha256,uncompressedSha256,uncompressedBytes,compressedBytes,runtime,...original}=rows[i];
    assert.equal(hash.digest('hex'),uncompressedSha256); assert.deepEqual(JSON.parse(JSON.stringify(regenerated)),original);
    operations+=rowOperations(regenerated);
    console.log(JSON.stringify({phase,coldReplayed: h.seed,completed: i+1}));
  }
  const used=process.cpuUsage(cpu),replayRuntime={wallSeconds: (performance.now()-start)/1000+(priorReplay?.runtimeTotals?.wallSeconds ?? 0),cpuMicroseconds: used.user+used.system+(priorReplay?.runtimeTotals?.cpuMicroseconds ?? 0)};
  assert.ok(replayRuntime.wallSeconds<=p.budget.maxReplayWallSeconds && replayRuntime.cpuMicroseconds<=p.budget.maxReplayCpuMicroseconds);
  assert.ok(operations<=p.budget.maxPolicyScalarOperations && evidenceSize(directory)<=p.budget.maxEvidenceBytes);
  writeNew(join(folder,'physical-audit.json'),{schema: 1,passed: true,phase,protocolSha256,resultsSha256: digest(resultBytes),histories: histories.length,
    mainWorlds: histories.length*13,probes: histories.length*16,operations,runtimeTotals: replayRuntime,exactEventAndRowReplay: true});
}
if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const [command,path,phase='development']=process.argv.slice(2),directory=resolve(path);
  if (command==='init') console.log(JSON.stringify(initializeTickStudy(directory,phase)));
  else runTickStudy(command,directory,phase);
}
