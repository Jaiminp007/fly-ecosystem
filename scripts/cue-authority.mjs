import assert from 'node:assert/strict';
import {readFile,writeFile,readdir,mkdir} from 'node:fs/promises';
import {openSync,writeSync,closeSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash,randomBytes} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {digest} from '../learning/intervention-study.mjs';
import {AUTHORITY_ARMS,simulateAuthorityHistory} from '../learning/cue-foraging.mjs';

const writeNew=(path,data)=>writeFile(path,JSON.stringify(data,null,2)+'\n',{flag:'wx'});
export const AUTHORITY_CONTRASTS=[
  ...['valueOracle','cueOracle'].flatMap(a=>['accept','refuse','random'].map(b=>({id:`${a}-${b}`,a,b}))),
  {id:'cueOracle-shuffledOracle',a:'cueOracle',b:'shuffledOracle'},
  {id:'null-equivalence',a:'nullCueOracle',b:'nullRandom',equivalence:true}
];
export function scoreAuthority(rows,p){
  const comparisons=p.contrasts.map(c=>{const effects=rows.map(r=>r.arms[c.a].endpoint.budgetAdjustedEnergyPerFounder-r.arms[c.b].endpoint.budgetAdjustedEnergyPerFounder),
    mean=effects.reduce((s,v)=>s+v,0)/effects.length,se=Math.sqrt(effects.reduce((s,v)=>s+(v-mean)**2,0)/(effects.length-1)/effects.length),
    lower=mean-p.critical*se,upper=mean+p.critical*se;
    return {...c,effects,mean,se,lower,upper,passed:c.equivalence?lower>-p.nullMargin&&upper<p.nullMargin:lower>0};});
  const survivalGuards=p.contrasts.filter(c=>!c.equivalence&&c.b!=='shuffledOracle').map(c=>{
    const effects=rows.map(r=>r.arms[c.a].endpoint.survival-r.arms[c.b].endpoint.survival),mean=effects.reduce((s,v)=>s+v,0)/effects.length;
    return {id:c.id,effects,mean,passed:mean>=0};});
  return {schema:1,histories:rows.length,worlds:rows.length*p.arms.length,comparisons,survivalGuards,
    passed:comparisons.every(c=>c.passed)&&survivalGuards.every(c=>c.passed),learnerQualification:false};
}
async function initialize(directory,python){
  await mkdir(dirname(directory),{recursive:true});await mkdir(directory);
  const sourceFiles=['engine.mjs','challenges.mjs','scripts/cue-authority.mjs','scripts/audit-cue-authority.py','docs/CUE_ACTION_AUTHORITY.md',
    ...(await readdir('learning')).filter(n=>n.endsWith('.mjs')).map(n=>`learning/${n}`)],sourceSha256={};
  for(const file of sourceFiles){const bytes=await readFile(file);sourceSha256[file]=digest(bytes);const target=join(directory,'sources',file);await mkdir(dirname(target),{recursive:true});await writeFile(target,bytes,{flag:'wx'});}
  const excluded=new Set([41]),seedRegistries=[],engineeringSources=[];
  function visit(x,key=''){if(Array.isArray(x)){for(const v of x)visit(v,key);}else if(x&&typeof x==='object'){for(const [k,v]of Object.entries(x))visit(v,/seed/i.test(key)?key:k);}else if(/seed/i.test(key)&&Number.isInteger(x)&&x>0&&x<=0xffffffff)excluded.add(x);}
  async function scan(path){for(const entry of await readdir(path,{withFileTypes:true})){const file=join(path,entry.name);if(entry.isDirectory()&&!['sources','registries','engineering'].includes(entry.name))await scan(file);
    else if(entry.isFile()&&entry.name==='protocol.json'){const bytes=await readFile(file),portable=file.replaceAll('\\','/');visit(JSON.parse(bytes));seedRegistries.push({path:portable,sha256:digest(bytes)});
      const target=join(directory,'registries',file);await mkdir(dirname(target),{recursive:true});await writeFile(target,bytes,{flag:'wx'});}}}
  await scan('evidence');
  for(const name of(await readdir('tests')).filter(n=>n.endsWith('.mjs'))){const bytes=await readFile(join('tests',name));
    for(const match of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){const value=Number(match[0].replaceAll('_',''));if(Number.isSafeInteger(value)&&value>0&&value<=0xffffffff)excluded.add(value);}
    engineeringSources.push({path:`tests/${name}`,sha256:digest(bytes)});await mkdir(join(directory,'engineering'),{recursive:true});await writeFile(join(directory,'engineering',name),bytes,{flag:'wx'});}
  const used=new Set(excluded),fresh=()=>{let s;do{s=randomBytes(4).readUInt32BE();}while(!s||used.has(s));used.add(s);return s;};
  const histories=Array.from({length:16},()=>({seed:fresh(),cueSeed:fresh(),resourceSeeds:Array.from({length:4},fresh),shuffleSeed:fresh(),nullSeed:fresh()}));
  const referenceFile='evidence/option-outcome/ae62a9d3-1415-4234-bd99-210ad26e4caf/reference-protocol.json',refBytes=await readFile(referenceFile),ref=JSON.parse(refBytes);
  const manifest=JSON.parse(await readFile('handoff/evidence-manifest.json'));
  assert.equal(digest(refBytes),manifest.files.find(r=>r.path===referenceFile)?.sha256,'Verify original reference before freezing');
  await mkdir(join(directory,'inputs'));await writeFile(join(directory,'inputs','reference-protocol.json'),refBytes,{flag:'wx'});
  const critical=Number(execFileSync(python,['-c','from scipy.stats import t; print(float(t.ppf(1-.05/(2*8),15)))'],{encoding:'utf8'}));
  const p={schema:1,experiment:'cue-action-authority-v1',createdAt:new Date().toISOString(),sourceSha256,seedRegistries,engineeringSources,excludedSeeds:[...excluded].sort((a,b)=>a-b),
    histories,arms:AUTHORITY_ARMS,contrasts:AUTHORITY_CONTRASTS,critical,alpha:.05,intervalTail:.05/(2*8),nullMargin:.5,
    referenceFile,referenceSha256:digest(refBytes),reference:{founders:ref.founders,parameters:ref.parameters,actorParameters:ref.actorParameters},
    pricing:{byteEnergyPerSecond:1e-5/(17*8),operationEnergy:5e-6/17},
    budget:{worlds:128,worldSteps:128*1792,probes:0,learnedWorlds:0},
    rule:'All seven simultaneous two-sided Bonferroni t lower bounds must exceed zero. Null cue-oracle minus null-random confidence interval must lie strictly within +/-0.5 energy/founder (less than one 0.8 patch bite and <1% of starting body energy). All six observed survival mean guards must be nonnegative. Fixed 16 histories, eight arms. No candidate outcomes, tuning, resampling, extension or learner promotion. Failure keeps learner qualification closed; any next environmental hypothesis needs a new prospective protocol.',
    scope:'Action headroom and cue accessibility only. Privileged value oracle reads current sensed valence; cue oracle has the frozen arbitrary cue codebook. No oracle trains a body. Shuffled observations are independent of true cues. Null patch valence is balanced within each cue (155 patches/cue gives one unavoidable extra positive per cue). Geometry, initial inventory and continuing A512/B512/C512/return-A256 bodies are unchanged; all arms start from the same applicable physical world. No energy refill. All-founder denominator. Physical toxins dissipate consumed toxin energy plus actual body damage, capped by available body energy.',
    accounting:'Ambient sensory/scaffold physics is shared and charged by the engine. External primitive arithmetic uses six work units per approach tick and nine per avoid tick; fixed policy comparisons, lookup comparisons and RNG arithmetic are counted separately. Constants and assignments unpriced. Full fixed policy state including cue codebook, RNG, counters and actuator is byte-second priced. Paid work enters energy, unpaid bills remain endpoint debt. Actual wall/CPU separate. Audit computation is repeat work, not new samples.'};
  await writeNew(join(directory,'protocol.json'),p);console.log(JSON.stringify({directory,protocolSha256:digest(await readFile(join(directory,'protocol.json'))),histories:16,worlds:128}));
}
async function verify(directory,p){
  assert.equal(p.experiment,'cue-action-authority-v1');assert.equal(p.histories.length,16);assert.deepEqual(p.arms,AUTHORITY_ARMS);assert.deepEqual(p.contrasts,AUTHORITY_CONTRASTS);
  for(const [file,hash]of Object.entries(p.sourceSha256))assert.equal(digest(await readFile(join(directory,'sources',file))),hash,file);
  for(const r of p.seedRegistries)assert.equal(digest(await readFile(join(directory,'registries',r.path))),r.sha256);
  for(const r of p.engineeringSources)assert.equal(digest(await readFile(join(directory,'engineering',r.path.slice(6)))),r.sha256);
  assert.equal(digest(await readFile(join(directory,'inputs','reference-protocol.json'))),p.referenceSha256);
  const seeds=p.histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.shuffleSeed,h.nullSeed]);assert.equal(new Set(seeds).size,128);assert.ok(seeds.every(s=>!p.excludedSeeds.includes(s)));
  assert.equal(resolve(process.argv[1]),join(directory,'sources','scripts','cue-authority.mjs'),'Run the captured entrypoint');
}
function validate(row,h,p){assert.deepEqual(row.history,h);assert.deepEqual(Object.keys(row.arms),p.arms);
  for(const v of Object.values(row.arms)){assert.equal(v.endpoint.founders,p.reference.founders);assert.ok(v.endpoint.tick===1792||v.endpoint.survivors===0);assert.ok(Math.abs(v.endpoint.accountingResidual)<1e-6);}
  assert.equal(new Set(p.arms.filter(a=>!a.startsWith('null')).map(a=>row.arms[a].initialWorldSha256)).size,1);
}
export async function main(){const[command,dir,python='.venv-research/Scripts/python.exe']=process.argv.slice(2),directory=resolve(dir);
  if(command==='init')return initialize(directory,python);
  assert.ok(['collect','score','audit'].includes(command));const bytes=await readFile(join(directory,'protocol.json')),p=JSON.parse(bytes),protocolSha256=digest(bytes);await verify(directory,p);
  await mkdir(join(directory,'rows'),{recursive:true});await mkdir(join(directory,'numerics'),{recursive:true});
  if(command==='collect'){for(const h of p.histories){const target=join(directory,'rows',`${h.seed}.json`),trace=join(directory,'numerics',`${h.seed}.jsonl`);
    try{const row=JSON.parse(await readFile(target));validate(row,h,p);assert.equal(row.protocolSha256,protocolSha256);assert.equal(row.numericsSha256,digest(await readFile(trace)));continue;}catch(e){if(e.code!=='ENOENT')throw e;}
    const start=performance.now(),cpu=process.cpuUsage(),fd=openSync(trace,'wx'),hash=createHash('sha256');let row;
    try{row=simulateAuthorityHistory(p,h,event=>{const line=JSON.stringify(event)+'\n';writeSync(fd,line);hash.update(line);});}finally{closeSync(fd);}
    validate(row,h,p);const runtime={wallSeconds:(performance.now()-start)/1000,cpuMicroseconds:process.cpuUsage(cpu),node:process.version,platform:process.platform};
    await writeNew(target,{...row,protocolSha256,numericsSha256:hash.digest('hex'),runtime});console.log(JSON.stringify({seed:h.seed,...runtime}));}return;}
  const rows=[];for(const h of p.histories){const r=JSON.parse(await readFile(join(directory,'rows',`${h.seed}.json`)));validate(r,h,p);assert.equal(r.protocolSha256,protocolSha256);assert.equal(r.numericsSha256,digest(await readFile(join(directory,'numerics',`${h.seed}.jsonl`))));rows.push(r);}
  const scores=scoreAuthority(rows,p),rowSha256=await Promise.all(p.histories.map(async h=>digest(await readFile(join(directory,'rows',`${h.seed}.json`)))));
  if(command==='score'){await writeNew(join(directory,'results.json'),{...scores,protocolSha256,rowSha256});console.log(JSON.stringify(scores));return;}
  const resultBytes=await readFile(join(directory,'results.json')),result=JSON.parse(resultBytes);assert.deepEqual(result,{...scores,protocolSha256,rowSha256});
  const start=performance.now(),cpu=process.cpuUsage();
  for(const[i,h]of p.histories.entries()){const hash=createHash('sha256'),regenerated=simulateAuthorityHistory(p,h,e=>hash.update(JSON.stringify(e)+'\n'));
    const{runtime,protocolSha256:oldP,numericsSha256,...original}=rows[i];assert.equal(oldP,protocolSha256);assert.equal(hash.digest('hex'),numericsSha256);assert.deepEqual(JSON.parse(JSON.stringify(regenerated)),original);
    console.log(JSON.stringify({coldReplayed:h.seed,completed:i+1}));}
  await writeNew(join(directory,'physical-audit.json'),{schema:1,passed:true,protocolSha256,resultsSha256:digest(resultBytes),histories:16,worlds:128,
    runtime:{wallSeconds:(performance.now()-start)/1000,cpuMicroseconds:process.cpuUsage(cpu)}});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
