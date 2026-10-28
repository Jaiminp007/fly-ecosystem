import assert from 'node:assert/strict';
import {readFile,writeFile,readdir,mkdir} from 'node:fs/promises';
import {openSync,closeSync,writeSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {randomBytes,createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {digest} from '../learning/intervention-study.mjs';
import {PURSUIT_ARMS,simulatePursuitAuthority} from '../learning/pursuit-authority.mjs';

const writeNew=(path,value)=>writeFile(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
export function scorePursuitAuthority(rows,p){
  assert.equal(rows.length,16);assert.ok(Number.isFinite(p.critical)&&p.critical>0);
  const comparisons=['legacyFast','refuse','random'].map(control=>{
    const effects=rows.map(row=>row.arms.pursuit.endpoint.budgetAdjustedEnergyPerFounder-row.arms[control].endpoint.budgetAdjustedEnergyPerFounder),
      mean=effects.reduce((sum,value)=>sum+value,0)/16,se=Math.sqrt(effects.reduce((sum,value)=>sum+(value-mean)**2,0)/15/16),lower=mean-p.critical*se;
    return {control,effects,mean,se,lower,passed:lower>0};
  });
  const survival=comparisons.map(({control})=>{
    const founders=p.reference.founders;
    assert.ok(Number.isSafeInteger(founders)&&founders>0&&Number.isSafeInteger(founders*16));
    const survivorDifferences=rows.map(row=>{
      const target=row.arms.pursuit.endpoint,baseline=row.arms[control].endpoint;
      for(const endpoint of [target,baseline]){
        assert.equal(endpoint.founders,founders);assert.ok(Number.isInteger(endpoint.survivors)&&endpoint.survivors>=0&&endpoint.survivors<=founders);
        assert.equal(endpoint.survival,endpoint.survivors/founders);
      }
      return target.survivors-baseline.survivors;
    }),total=survivorDifferences.reduce((sum,value)=>sum+value,0),mean=total/(16*founders),
      effects=rows.map(row=>row.arms.pursuit.endpoint.survival-row.arms[control].endpoint.survival);
    assert.ok(Number.isSafeInteger(total));return {control,effects,survivorDifferences,founders,mean,passed:total>=0};
  });
  return {schema:1,histories:16,comparisons,survival,passed:comparisons.every(value=>value.passed)&&survival.every(value=>value.passed),learnerQualification:false};
}

async function initialize(directory,python){
  const inputFile='evidence/cue-learning/20261024-v1/protocol.json',inputBytes=await readFile(inputFile),input=JSON.parse(inputBytes);
  for(const file of ['engine.mjs','challenges.mjs'])assert.equal(digest(await readFile(file)),input.sourceSha256[file],'Keep original physics fixed');
  const sourceSha256={},sources={};
  for(const file of ['engine.mjs','challenges.mjs','scripts/pursuit-authority.mjs','scripts/audit-pursuit-authority.py','scripts/audit-transfer-authority.py','scripts/audit-cue-authority.py','docs/PURSUIT_ACTION_AUTHORITY.md',
    ...(await readdir('learning')).filter(name=>name.endsWith('.mjs')).map(name=>`learning/${name}`)]){
    sources[file]=await readFile(file);sourceSha256[file]=digest(sources[file]);
  }
  await mkdir(dirname(directory),{recursive:true});await mkdir(directory);await writeFile(join(directory,'reference-input.json'),inputBytes,{flag:'wx'});
  for(const[file,bytes]of Object.entries(sources)){const target=join(directory,'sources',file);await mkdir(dirname(target),{recursive:true});await writeFile(target,bytes,{flag:'wx'});}
  const excluded=new Set([41]),seedRegistries=[],engineeringSources=[];
  function visit(value,key=''){
    if(Array.isArray(value))for(const item of value)visit(item,key);
    else if(value&&typeof value==='object')for(const[field,item]of Object.entries(value))visit(item,/seed/i.test(key)?key:field);
    else if(/seed/i.test(key)&&Number.isInteger(value)&&value>0&&value<=0xffffffff)excluded.add(value);
  }
  async function scan(path){for(const entry of await readdir(path,{withFileTypes:true})){
    const file=join(path,entry.name);
    if(entry.isDirectory()&&!['sources','registries','engineering','authority-inputs'].includes(entry.name))await scan(file);
    else if(entry.isFile()&&entry.name==='protocol.json'){
      const bytes=await readFile(file);visit(JSON.parse(bytes));seedRegistries.push({path:file.replaceAll('\\','/'),sha256:digest(bytes)});
      const target=join(directory,'registries',file);await mkdir(dirname(target),{recursive:true});await writeFile(target,bytes,{flag:'wx'});
    }
  }}
  await scan('evidence');await mkdir(join(directory,'engineering'),{recursive:true});
  for(const name of(await readdir('tests')).filter(name=>name.endsWith('.mjs'))){
    const bytes=await readFile(join('tests',name));
    for(const match of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const value=Number(match[0].replaceAll('_',''));if(Number.isSafeInteger(value)&&value>0&&value<=0xffffffff)excluded.add(value);
    }
    engineeringSources.push({path:`tests/${name}`,sha256:digest(bytes)});await writeFile(join(directory,'engineering',name),bytes,{flag:'wx'});
  }
  const used=new Set(excluded),fresh=()=>{let seed;do{seed=randomBytes(4).readUInt32BE();}while(!seed||used.has(seed));used.add(seed);return seed;},
    histories=Array.from({length:16},()=>({seed:fresh(),cueSeed:fresh(),resourceSeeds:Array.from({length:4},fresh),shuffleSeed:fresh(),nullSeed:fresh(),transferSeed:fresh()})),
    critical=Number(execFileSync(python,['-c','from scipy.stats import t; print(float(t.ppf(1-.05/3,15)))'],{encoding:'utf8'}));
  const protocol={schema:1,experiment:'original-transfer-pursuit-authority-v1',createdAt:new Date().toISOString(),inputFile,inputSha256:digest(inputBytes),sourceSha256,seedRegistries,engineeringSources,
    excludedSeeds:[...excluded].sort((left,right)=>left-right),histories,arms:PURSUIT_ARMS,reference:input.reference,pricing:input.pricing,critical,alphaPerTest:.05/3,survivalArithmetic:'exact-founder-counts-v1',
    budget:{warmupWorlds:16,probeWorlds:64,totalWorlds:80,maximumWorldSteps:40960},
    rule:'Pursuit minus legacyFast/refuse/random must each have positive simultaneous one-sided t lower bounds and nonnegative observed mean-survival differences. Sixteen histories, no tuning, extension, replacement, promotion or learner qualification.',
    scope:'One source-motivated bearing/turn-in-place motor bundle, with exact semantics and declared work in captured docs/PURSUIT_ACTION_AUTHORITY.md. Matched refuse/random use the new interface. Oracle-prepared continuing states; all founders, unchanged physical engine/reference/prices, no refills. Mechanical superiority cannot replace learned-over-reset and learned-over-always-accept using the same new interface.'};
  await writeNew(join(directory,'protocol.json'),protocol);console.log(JSON.stringify({directory,protocolSha256:digest(await readFile(join(directory,'protocol.json'))),histories:16,worlds:80}));
}

async function verify(directory,p){
  assert.equal(p.schema,1);assert.equal(p.experiment,'original-transfer-pursuit-authority-v1');assert.deepEqual(p.arms,PURSUIT_ARMS);assert.equal(p.histories.length,16);
  const seeds=p.histories.flatMap(history=>[history.seed,history.cueSeed,...history.resourceSeeds,history.shuffleSeed,history.nullSeed,history.transferSeed]);
  assert.equal(seeds.length,144);assert.equal(new Set(seeds).size,144);assert.ok(seeds.every(seed=>Number.isInteger(seed)&&seed>0&&seed<=0xffffffff&&!p.excludedSeeds.includes(seed)));
  assert.equal(p.alphaPerTest,.05/3);assert.ok(Number.isFinite(p.critical)&&p.critical>0);
  assert.equal(p.survivalArithmetic,'exact-founder-counts-v1');
  assert.deepEqual(p.budget,{warmupWorlds:16,probeWorlds:64,totalWorlds:80,maximumWorldSteps:40960});
  for(const[file,hash]of Object.entries(p.sourceSha256))assert.equal(digest(await readFile(join(directory,'sources',file))),hash,file);
  for(const entry of p.seedRegistries)assert.equal(digest(await readFile(join(directory,'registries',entry.path))),entry.sha256);
  for(const entry of p.engineeringSources)assert.equal(digest(await readFile(join(directory,'engineering',entry.path.slice(6)))),entry.sha256);
  const inputBytes=await readFile(join(directory,'reference-input.json')),input=JSON.parse(inputBytes);assert.equal(digest(inputBytes),p.inputSha256);
  assert.deepEqual(p.reference,input.reference);assert.deepEqual(p.pricing,input.pricing);
  for(const file of ['engine.mjs','challenges.mjs'])assert.equal(p.sourceSha256[file],input.sourceSha256[file]);
  assert.equal(resolve(process.argv[1]),join(directory,'sources/scripts/pursuit-authority.mjs'),'Execute captured entrypoint');
}
function validate(row,p,history){
  assert.equal(row.schema,1);assert.deepEqual(row.history,history);assert.deepEqual(Object.keys(row.arms),p.arms);assert.equal(row.warmup.endpoint.founders,p.reference.founders);
  assert.ok(row.warmup.endpoint.tick===1536||row.warmup.endpoint.survivors===0);assert.equal(new Set(Object.values(row.arms).map(arm=>arm.initialWorldSha256)).size,1);
  for(const arm of Object.values(row.arms)){
    assert.equal(arm.endpoint.founders,p.reference.founders);assert.ok(arm.endpoint.survivors>=0&&arm.endpoint.survivors<=p.reference.founders);
    assert.ok(Math.abs(arm.endpoint.accountingResidual)<1e-6&&Number.isFinite(arm.endpoint.budgetAdjustedEnergyPerFounder));
  }
}

export async function main(){
  const[command,dir,python='.venv-research/Scripts/python.exe']=process.argv.slice(2),directory=resolve(dir);
  if(command==='init')return initialize(directory,python);assert.ok(['collect','score','audit'].includes(command));
  const bytes=await readFile(join(directory,'protocol.json')),p=JSON.parse(bytes),protocolSha256=digest(bytes);await verify(directory,p);
  await mkdir(join(directory,'rows'),{recursive:true});await mkdir(join(directory,'numerics'),{recursive:true});
  if(command==='collect'){
    for(const history of p.histories){
      const target=join(directory,'rows',`${history.seed}.json`),trace=join(directory,'numerics',`${history.seed}.jsonl`);
      try{const old=JSON.parse(await readFile(target));validate(old,p,history);assert.equal(old.protocolSha256,protocolSha256);assert.equal(old.numericsSha256,digest(await readFile(trace)));continue;}catch(error){if(error.code!=='ENOENT')throw error;}
      const start=performance.now(),cpu=process.cpuUsage(),fd=openSync(trace,'wx'),hash=createHash('sha256');let row;
      try{row=simulatePursuitAuthority(p,history,event=>{const line=JSON.stringify(event)+'\n';writeSync(fd,line);hash.update(line);});}finally{closeSync(fd);}
      validate(row,p,history);const runtime={wallSeconds:(performance.now()-start)/1000,cpuMicroseconds:process.cpuUsage(cpu),node:process.version,platform:process.platform};
      await writeNew(target,{...row,protocolSha256,numericsSha256:hash.digest('hex'),runtime});console.log(JSON.stringify({seed:history.seed,...runtime}));
    }return;
  }
  const rows=[];
  for(const history of p.histories){const row=JSON.parse(await readFile(join(directory,'rows',`${history.seed}.json`)));validate(row,p,history);assert.equal(row.protocolSha256,protocolSha256);assert.equal(row.numericsSha256,digest(await readFile(join(directory,'numerics',`${history.seed}.jsonl`))));rows.push(row);}
  const scored=scorePursuitAuthority(rows,p),rowSha256=await Promise.all(p.histories.map(async history=>digest(await readFile(join(directory,'rows',`${history.seed}.json`)))));
  if(command==='score'){await writeNew(join(directory,'results.json'),{...scored,protocolSha256,rowSha256});console.log(JSON.stringify(scored));return;}
  const resultBytes=await readFile(join(directory,'results.json'));assert.deepEqual(JSON.parse(resultBytes),{...scored,protocolSha256,rowSha256});
  for(const[index,history]of p.histories.entries()){
    const hash=createHash('sha256'),regenerated=simulatePursuitAuthority(p,history,event=>hash.update(JSON.stringify(event)+'\n')),
      {runtime,protocolSha256:oldProtocol,numericsSha256,...old}=rows[index];
    assert.equal(oldProtocol,protocolSha256);assert.equal(hash.digest('hex'),numericsSha256);assert.deepEqual(JSON.parse(JSON.stringify(regenerated)),old);
    console.log(JSON.stringify({coldReplayed:history.seed,completed:index+1}));
  }
  await writeNew(join(directory,'physical-audit.json'),{schema:1,passed:true,protocolSha256,resultsSha256:digest(resultBytes),warmupWorlds:16,probeWorlds:64});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
