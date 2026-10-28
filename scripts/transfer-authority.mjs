import assert from 'node:assert/strict';
import {readFile,writeFile,readdir,mkdir} from 'node:fs/promises';
import {openSync,closeSync,writeSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {randomBytes,createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {digest} from '../learning/intervention-study.mjs';
import {TRANSFER_AUTHORITY_ARMS,simulateTransferAuthority} from '../learning/transfer-authority.mjs';
const writeNew=(path,value)=>writeFile(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
export function scoreTransferAuthority(rows,p){assert.equal(rows.length,16);assert.ok(Number.isFinite(p.critical)&&p.critical>0);const comparisons=['fast','slow','randomSpeed'].map(control=>{
  const effects=rows.map(r=>r.arms.tasteSpeed.endpoint.budgetAdjustedEnergyPerFounder-r.arms[control].endpoint.budgetAdjustedEnergyPerFounder),n=effects.length,mean=effects.reduce((s,v)=>s+v,0)/n,
    se=Math.sqrt(effects.reduce((s,v)=>s+(v-mean)**2,0)/(n-1)/n),lower=mean-p.critical*se;
  return {control,effects,mean,se,lower,passed:lower>0};});
  const survival=comparisons.map(c=>{const effects=rows.map(r=>r.arms.tasteSpeed.endpoint.survival-r.arms[c.control].endpoint.survival),mean=effects.reduce((s,v)=>s+v,0)/effects.length;return {control:c.control,effects,mean,passed:mean>=0};});
  return {schema:1,histories:rows.length,comparisons,survival,passed:comparisons.every(v=>v.passed)&&survival.every(v=>v.passed),learnerQualification:false};}
async function initialize(directory,python){
  const inputFile='evidence/cue-learning/20261024-v1/protocol.json',inputBytes=await readFile(inputFile),input=JSON.parse(inputBytes);
  for(const file of ['engine.mjs','challenges.mjs'])assert.equal(digest(await readFile(file)),input.sourceSha256[file],'Keep original physical engine fixed');
  await mkdir(dirname(directory),{recursive:true});await mkdir(directory);await writeFile(join(directory,'reference-input.json'),inputBytes,{flag:'wx'});
  const sourceSha256={};for(const file of ['engine.mjs','challenges.mjs','scripts/transfer-authority.mjs','scripts/audit-transfer-authority.py','scripts/audit-cue-authority.py','docs/TRANSFER_ACTION_AUTHORITY.md',
    ...(await readdir('learning')).filter(n=>n.endsWith('.mjs')).map(n=>`learning/${n}`)]){const bytes=await readFile(file),target=join(directory,'sources',file);sourceSha256[file]=digest(bytes);await mkdir(dirname(target),{recursive:true});await writeFile(target,bytes,{flag:'wx'});}
  const excluded=new Set([41]),seedRegistries=[],engineeringSources=[];
  function visit(v,key=''){if(Array.isArray(v)){for(const x of v)visit(x,key);}else if(v&&typeof v==='object'){for(const[k,x]of Object.entries(v))visit(x,/seed/i.test(key)?key:k);}else if(/seed/i.test(key)&&Number.isInteger(v)&&v>0&&v<=0xffffffff)excluded.add(v);}
  async function scan(path){for(const e of await readdir(path,{withFileTypes:true})){const file=join(path,e.name);if(e.isDirectory()&&!['sources','registries','engineering','authority-inputs'].includes(e.name))await scan(file);else if(e.isFile()&&e.name==='protocol.json'){const bytes=await readFile(file),portable=file.replaceAll('\\','/');visit(JSON.parse(bytes));seedRegistries.push({path:portable,sha256:digest(bytes)});const target=join(directory,'registries',file);await mkdir(dirname(target),{recursive:true});await writeFile(target,bytes,{flag:'wx'});}}}await scan('evidence');
  for(const file of(await readdir('tests')).filter(n=>n.endsWith('.mjs'))){const bytes=await readFile(join('tests',file));for(const match of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){const x=Number(match[0].replaceAll('_',''));if(Number.isSafeInteger(x)&&x>0&&x<=0xffffffff)excluded.add(x);}engineeringSources.push({path:`tests/${file}`,sha256:digest(bytes)});await mkdir(join(directory,'engineering'),{recursive:true});await writeFile(join(directory,'engineering',file),bytes,{flag:'wx'});}
  const used=new Set(excluded),fresh=()=>{let s;do{s=randomBytes(4).readUInt32BE();}while(!s||used.has(s));used.add(s);return s;},histories=Array.from({length:16},()=>({seed:fresh(),cueSeed:fresh(),resourceSeeds:Array.from({length:4},fresh),shuffleSeed:fresh(),nullSeed:fresh(),transferSeed:fresh()})),
    critical=Number(execFileSync(python,['-c','from scipy.stats import t; print(float(t.ppf(1-.05/3,15)))'],{encoding:'utf8'}));
  const p={schema:1,experiment:'original-transfer-speed-authority-v1',createdAt:new Date().toISOString(),inputFile,inputSha256:digest(inputBytes),sourceSha256,seedRegistries,engineeringSources,excludedSeeds:[...excluded].sort((a,b)=>a-b),
    histories,arms:TRANSFER_AUTHORITY_ARMS,reference:input.reference,pricing:input.pricing,critical,alphaPerTest:.05/3,budget:{warmupWorlds:16,probeWorlds:64,totalWorlds:80,maximumWorldSteps:40960},
    rule:'A fixed own-experienced-taste speed reflex must have positive simultaneous one-sided Bonferroni t lower bounds over fast, slow and random-speed controls, and nonnegative observed mean-survival guards against each. Sixteen histories; no replacement, extension, tuning or learner outcomes. Failure is not proof of zero headroom or unlearnability. No learner qualification or motor promotion follows the diagnostic alone.',
    scope:'Evaluation-only original-ecology transfer affordance. Warm each fixed value-oracle cue body to tick1536 (or extinction), then copy the identical physical world into four original all-beneficial, odor-free 256-tick probes. No body/food/energy refill. All original founders remain denominator; warmup-dead founders receive zero new bodies. Only speed changes: .15 or .5, with common approach/feed/wall steering. tasteSpeed chooses .15 when previous own intake >0, otherwise .5, holding eight ticks. It is a pre-existing feeding-reflex idea, not a learned policy. randomSpeed chooses uniformly from a separate per-body stream. Prior warmup cost is common and excluded from probe deltas; probe controller storage/work is fully charged. Original task resource seed is shared across probes. Oracle warmup reachability by a learned policy remains unproved.'};
  await writeNew(join(directory,'protocol.json'),p);console.log(JSON.stringify({directory,protocolSha256:digest(await readFile(join(directory,'protocol.json'))),histories:16,worlds:80}));
}
async function verify(directory,p){assert.equal(p.experiment,'original-transfer-speed-authority-v1');assert.equal(p.histories.length,16);assert.deepEqual(p.arms,TRANSFER_AUTHORITY_ARMS);const seeds=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.shuffleSeed,h.nullSeed,h.transferSeed]);assert.equal(new Set(seeds).size,144);assert.ok(seeds.every(s=>s>0&&!p.excludedSeeds.includes(s)));
  assert.ok(seeds.every(s=>Number.isInteger(s)&&s<=0xffffffff));assert.equal(p.alphaPerTest,.05/3);
  assert.deepEqual(p.budget,{warmupWorlds:16,probeWorlds:64,totalWorlds:80,maximumWorldSteps:40960});
  const input=JSON.parse(await readFile(join(directory,'reference-input.json')));assert.deepEqual(p.reference,input.reference);assert.deepEqual(p.pricing,input.pricing);
  for(const[file,hash]of Object.entries(p.sourceSha256))assert.equal(digest(await readFile(join(directory,'sources',file))),hash,file);
  for(const r of p.seedRegistries)assert.equal(digest(await readFile(join(directory,'registries',r.path))),r.sha256);for(const r of p.engineeringSources)assert.equal(digest(await readFile(join(directory,'engineering',r.path.slice(6)))),r.sha256);
  assert.equal(digest(await readFile(join(directory,'reference-input.json'))),p.inputSha256);assert.equal(resolve(process.argv[1]),join(directory,'sources/scripts/transfer-authority.mjs'),'Execute captured entrypoint');}
function validate(row,p,h){assert.deepEqual(row.history,h);assert.deepEqual(Object.keys(row.arms),p.arms);assert.equal(row.warmup.endpoint.founders,p.reference.founders);assert.ok(row.warmup.endpoint.tick===1536||row.warmup.endpoint.survivors===0);
  assert.equal(new Set(Object.values(row.arms).map(v=>v.initialWorldSha256)).size,1);for(const v of Object.values(row.arms)){assert.equal(v.endpoint.founders,p.reference.founders);assert.ok(Math.abs(v.endpoint.accountingResidual)<1e-6&&Number.isFinite(v.endpoint.budgetAdjustedEnergyPerFounder));}}
export async function main(){const[command,dir,python='.venv-research/Scripts/python.exe']=process.argv.slice(2),directory=resolve(dir);if(command==='init')return initialize(directory,python);assert.ok(['collect','score','audit'].includes(command));
  const bytes=await readFile(join(directory,'protocol.json')),p=JSON.parse(bytes),protocolSha256=digest(bytes);await verify(directory,p);await mkdir(join(directory,'rows'),{recursive:true});await mkdir(join(directory,'numerics'),{recursive:true});
  if(command==='collect'){for(const h of p.histories){const target=join(directory,'rows',`${h.seed}.json`),trace=join(directory,'numerics',`${h.seed}.jsonl`);try{const old=JSON.parse(await readFile(target));validate(old,p,h);assert.equal(old.protocolSha256,protocolSha256);assert.equal(old.numericsSha256,digest(await readFile(trace)));continue;}catch(e){if(e.code!=='ENOENT')throw e;}
    const start=performance.now(),cpu=process.cpuUsage(),fd=openSync(trace,'wx'),hash=createHash('sha256');let row;try{row=simulateTransferAuthority(p,h,e=>{const line=JSON.stringify(e)+'\n';writeSync(fd,line);hash.update(line);});}finally{closeSync(fd);}validate(row,p,h);
    const runtime={wallSeconds:(performance.now()-start)/1000,cpuMicroseconds:process.cpuUsage(cpu),node:process.version,platform:process.platform};await writeNew(target,{...row,protocolSha256,numericsSha256:hash.digest('hex'),runtime});console.log(JSON.stringify({seed:h.seed,...runtime}));}return;}
  const rows=[];for(const h of p.histories){const r=JSON.parse(await readFile(join(directory,'rows',`${h.seed}.json`)));validate(r,p,h);assert.equal(r.protocolSha256,protocolSha256);assert.equal(r.numericsSha256,digest(await readFile(join(directory,'numerics',`${h.seed}.jsonl`))));rows.push(r);}
  const scored=scoreTransferAuthority(rows,p),rowSha256=await Promise.all(p.histories.map(async h=>digest(await readFile(join(directory,'rows',`${h.seed}.json`)))));
  if(command==='score'){await writeNew(join(directory,'results.json'),{...scored,protocolSha256,rowSha256});console.log(JSON.stringify(scored));return;}
  const resultBytes=await readFile(join(directory,'results.json'));assert.deepEqual(JSON.parse(resultBytes),{...scored,protocolSha256,rowSha256});
  for(const[i,h]of p.histories.entries()){const hash=createHash('sha256'),r=simulateTransferAuthority(p,h,e=>hash.update(JSON.stringify(e)+'\n')),{runtime,protocolSha256:oldP,numericsSha256,...old}=rows[i];assert.equal(oldP,protocolSha256);assert.equal(hash.digest('hex'),numericsSha256);assert.deepEqual(JSON.parse(JSON.stringify(r)),old);console.log(JSON.stringify({coldReplayed:h.seed,completed:i+1}));}
  await writeNew(join(directory,'physical-audit.json'),{schema:1,passed:true,protocolSha256,resultsSha256:digest(resultBytes),warmupWorlds:16,probeWorlds:64});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
