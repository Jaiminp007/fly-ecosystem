import assert from 'node:assert/strict';
import {readFile,writeFile,readdir,mkdir} from 'node:fs/promises';
import {openSync,writeSync,closeSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {randomBytes,createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {digest} from '../learning/intervention-study.mjs';
import {CUE_ARMS,CUE_PROBES} from '../learning/cue-foraging.mjs';
import {CUE_CONTRASTS,validateCueProtocol,simulateCueHistory,validateCueRow,scoreCueRows} from '../learning/cue-development.mjs';
const writeNew=(path,data)=>writeFile(path,JSON.stringify(data,null,2)+'\n',{flag:'wx'});

async function initialize(directory,python){
  const authorityDirectory='evidence/cue-authority/20261024-v1',authorityBytes=await readFile(join(authorityDirectory,'protocol.json')),
    resultBytes=await readFile(join(authorityDirectory,'results.json')),authorityProtocol=JSON.parse(authorityBytes),authorityResult=JSON.parse(resultBytes);
  assert.equal(authorityResult.passed,true,'Action headroom must pass before learning qualification');
  assert.equal(authorityResult.protocolSha256,digest(authorityBytes));
  for(const file of ['physical-audit.json','numeric-audit.json']){const a=JSON.parse(await readFile(join(authorityDirectory,file)));assert.equal(a.passed,true);assert.equal(a.protocolSha256,digest(authorityBytes));assert.equal(a.resultsSha256,digest(resultBytes));}
  for(const file of ['engine.mjs','challenges.mjs','learning/mushroom-body.mjs'])assert.equal(digest(await readFile(file)),authorityProtocol.sourceSha256[file],'No environment/learner tuning after headroom');
  await mkdir(dirname(directory),{recursive:true});await mkdir(directory);
  const sources=['engine.mjs','challenges.mjs','docs/CUE_LEARNING_DEVELOPMENT.md','scripts/cue-development.mjs','scripts/audit-cue-development.py',
    'scripts/audit-mushroom-body.py','scripts/audit-sarsa-screen.py','scripts/audit-cue-authority.py',...(await readdir('learning')).filter(n=>n.endsWith('.mjs')).map(n=>`learning/${n}`)],sourceSha256={};
  for(const file of sources){const bytes=await readFile(file),target=join(directory,'sources',file);sourceSha256[file]=digest(bytes);await mkdir(dirname(target),{recursive:true});await writeFile(target,bytes,{flag:'wx'});}
  await mkdir(join(directory,'authority-inputs'));for(const file of ['protocol.json','results.json','physical-audit.json','numeric-audit.json'])await writeFile(join(directory,'authority-inputs',file),await readFile(join(authorityDirectory,file)),{flag:'wx'});
  const excluded=new Set([41]),seedRegistries=[],engineeringSources=[];
  function visit(v,key=''){if(Array.isArray(v)){for(const x of v)visit(x,key);}else if(v&&typeof v==='object'){for(const[k,x]of Object.entries(v))visit(x,/seed/i.test(key)?key:k);}else if(/seed/i.test(key)&&Number.isInteger(v)&&v>0&&v<=0xffffffff)excluded.add(v);}
  async function scan(path){for(const entry of await readdir(path,{withFileTypes:true})){const file=join(path,entry.name);if(entry.isDirectory()&&!['sources','registries','engineering','authority-inputs'].includes(entry.name))await scan(file);
    else if(entry.isFile()&&entry.name==='protocol.json'){const bytes=await readFile(file),portable=file.replaceAll('\\','/');visit(JSON.parse(bytes));seedRegistries.push({path:portable,sha256:digest(bytes)});const target=join(directory,'registries',file);await mkdir(dirname(target),{recursive:true});await writeFile(target,bytes,{flag:'wx'});}}}
  await scan('evidence');
  for(const name of(await readdir('tests')).filter(n=>n.endsWith('.mjs'))){const bytes=await readFile(join('tests',name));for(const match of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){const v=Number(match[0].replaceAll('_',''));if(Number.isSafeInteger(v)&&v>0&&v<=0xffffffff)excluded.add(v);}
    engineeringSources.push({path:`tests/${name}`,sha256:digest(bytes)});await mkdir(join(directory,'engineering'),{recursive:true});await writeFile(join(directory,'engineering',name),bytes,{flag:'wx'});}
  const used=new Set(excluded),fresh=()=>{let s;do{s=randomBytes(4).readUInt32BE();}while(!s||used.has(s));used.add(s);return s;};
  const histories=Array.from({length:24},()=>({seed:fresh(),cueSeed:fresh(),resourceSeeds:Array.from({length:4},fresh),shuffleSeed:fresh(),nullSeed:fresh(),probeSeeds:{A:fresh(),B:fresh(),C:fresh(),transfer:fresh()}}));
  const k=CUE_CONTRASTS.length,critical=JSON.parse(execFileSync(python,['-c',`import json; from scipy.stats import t; k=${k}; print(json.dumps({kind:{phase:float(t.ppf(q,n-1)) for phase,n in [('development',8),('confirmation',16)]} for kind,q in [('critical',1-.05/k),('equivalenceCritical',1-.05/(2*k)),('descriptiveCritical',.975)]}))`],{encoding:'utf8'}));
  const p={schema:1,experiment:'fixed-cue-learning-development-v1',createdAt:new Date().toISOString(),sourceSha256,seedRegistries,engineeringSources,excludedSeeds:[...excluded].sort((a,b)=>a-b),
    authorityDirectory,authorityProtocolSha256:digest(authorityBytes),authorityResultsSha256:digest(resultBytes),reference:authorityProtocol.reference,pricing:authorityProtocol.pricing,
    developmentHistories:histories.slice(0,8),confirmationHistories:histories.slice(8),arms:CUE_ARMS,probes:CUE_PROBES,contrasts:CUE_CONTRASTS,...critical,alphaPerTest:.05/k,minimumReuse:.5,nullMargin:.5,
    budget:{developmentWorlds:224,confirmationWorlds:448,totalWorlds:672,totalCollectionWorldSteps:24*(15*1792+13*256)},
    hypothesis:'Unchanged sparse dopamine-gated fast/slow policy from the failed original-ecology study, now on the independently headroom-validated fixed cue environment. One human-proposed environmental hypothesis, not autonomous algorithm improvement. No oracle codebook, valence, phase ID, cross-body experience or counterfactual labels reach learning. Actual own net-energy rewards only.',
    developmentRule:'Eight fresh histories; require positive means on all nineteen required directional energy contrasts, null mean within +/-0.5, all twelve observed mean-survival guards nonnegative, >=50% A and B active-synapse reuse, >=half original bodies exceeding sixteen completed receipts, >=half nonzero dopamine updates and positive slow-synapse transfer in every history. Failure closes all sixteen confirmation histories; no tuning, resampling, extension, replacement or promotion.',
    confirmationRule:'Only after development and exact full physical/independent numerical audits pass. Sixteen reserved histories; same unchanged source/prices/configuration. All nineteen required directional contrasts must have simultaneous lower bound >0 AND exact paired sign-flip p <= .05/21. Null entire two-sided interval within +/-0.5. All survival, synapse-pressure and activity guards also required. Optional trace comparison cannot repair a required failure.',
    retention:'A and B each first outperform reset on the common frozen end-C physical bodies; separately retain at least 95% of their original acquired advantage. C acquisition compares end-C with saved end-B, B acquisition compares saved end-B with end-A on common B bodies. Probe acquisition disabled; same physical state and RNG per family; all founders remain denominators. No training feedback. If no end-C survivor checkpoint exists, every probe value/survival is zero, so required skill gates cannot pass.',
    transfer:'Original all-beneficial resource ecology, no odor, on common post-C physical bodies, with unchanged two motor primitives. Require end-C advantage over reset and always-accept. This tests transfer of this controller, not recovery of the earlier speed-only experiment. End-A transfer is recorded descriptively. No gate may be dropped if transfer fails.',
    auditing:'Full JSON/trace cold replay of every main world and frozen probe. Independent sparse/linear inference/plasticity, own energy minus debt observations, matured rewards, per-body and global physical ledgers, actuator arithmetic, compute and recorded byte-time billing, synapse overlap/overflow, all effects and gates. Independent audit discloses that intermediate object shapes are not independently recreated; exact full physical replay verifies the complete simulator/pricing behavior. No numeric tolerance substitutes for exact replay.'};
  validateCueProtocol(p);await writeNew(join(directory,'protocol.json'),p);console.log(JSON.stringify({directory,protocolSha256:digest(await readFile(join(directory,'protocol.json'))),developmentWorlds:224,reservedWorlds:448,contrasts:k}));
}
async function verify(directory,p){validateCueProtocol(p);for(const[file,hash]of Object.entries(p.sourceSha256))assert.equal(digest(await readFile(join(directory,'sources',file))),hash,file);
  for(const r of p.seedRegistries)assert.equal(digest(await readFile(join(directory,'registries',r.path))),r.sha256);
  for(const r of p.engineeringSources)assert.equal(digest(await readFile(join(directory,'engineering',r.path.slice(6)))),r.sha256);
  assert.equal(resolve(process.argv[1]),join(directory,'sources','scripts','cue-development.mjs'),'Execute captured entrypoint');
  assert.equal(digest(await readFile(join(directory,'authority-inputs','protocol.json'))),p.authorityProtocolSha256);assert.equal(digest(await readFile(join(directory,'authority-inputs','results.json'))),p.authorityResultsSha256);
}
export async function main(){const[command,dir,phase='development',python='.venv-research/Scripts/python.exe']=process.argv.slice(2),directory=resolve(dir);
  if(command==='init')return initialize(directory,phase);assert.ok(['collect','score','audit'].includes(command));assert.ok(['development','confirmation'].includes(phase));
  const bytes=await readFile(join(directory,'protocol.json')),p=JSON.parse(bytes),protocolSha256=digest(bytes);await verify(directory,p);
  const folder=join(directory,phase),histories=phase==='development'?p.developmentHistories:p.confirmationHistories;
  if(phase==='confirmation'){const resultBytes=await readFile(join(directory,'development','results.json'));assert.equal(JSON.parse(resultBytes).promising,true,'Failed development: reserve closed');
    for(const file of ['physical-audit.json','numeric-audit.json']){const a=JSON.parse(await readFile(join(directory,'development',file)));assert.equal(a.passed,true);assert.equal(a.protocolSha256,protocolSha256);assert.equal(a.resultsSha256,digest(resultBytes));}}
  if(command==='collect'){await mkdir(join(folder,'rows'),{recursive:true});await mkdir(join(folder,'numerics'),{recursive:true});
    for(const h of histories){const target=join(folder,'rows',`${h.seed}.json`),trace=join(folder,'numerics',`${h.seed}.jsonl`);
      try{const old=JSON.parse(await readFile(target));validateCueRow(old,h,p,phase);assert.equal(old.protocolSha256,protocolSha256);assert.equal(old.numericsSha256,digest(await readFile(trace)));continue;}catch(e){if(e.code!=='ENOENT')throw e;}
      const start=performance.now(),cpu=process.cpuUsage(),fd=openSync(trace,'wx'),hash=createHash('sha256');let row;
      try{row=simulateCueHistory(p,h,phase,e=>{const line=JSON.stringify(e)+'\n';writeSync(fd,line);hash.update(line);});}finally{closeSync(fd);}
      validateCueRow(row,h,p,phase);const runtime={wallSeconds:(performance.now()-start)/1000,cpuMicroseconds:process.cpuUsage(cpu),node:process.version,platform:process.platform};
      await writeNew(target,{...row,protocolSha256,numericsSha256:hash.digest('hex'),runtime});console.log(JSON.stringify({phase,seed:h.seed,...runtime}));}return;}
  const rows=[];for(const h of histories){const row=JSON.parse(await readFile(join(folder,'rows',`${h.seed}.json`)));validateCueRow(row,h,p,phase);assert.equal(row.protocolSha256,protocolSha256);assert.equal(row.numericsSha256,digest(await readFile(join(folder,'numerics',`${h.seed}.jsonl`))));rows.push(row);}
  const scored=scoreCueRows(rows,p,phase),rowSha256=await Promise.all(histories.map(async h=>digest(await readFile(join(folder,'rows',`${h.seed}.json`)))));
  if(command==='score'){await writeNew(join(folder,'results.json'),{...scored,protocolSha256,rowSha256});console.log(JSON.stringify({promising:scored.promising,qualified:scored.qualified,comparisons:scored.comparisons.map(c=>({id:c.id,mean:c.mean,developmentPass:c.developmentPass,confirmationPass:c.confirmationPass}))}));return;}
  const resultBytes=await readFile(join(folder,'results.json'));assert.deepEqual(JSON.parse(resultBytes),{...scored,protocolSha256,rowSha256});const start=performance.now(),cpu=process.cpuUsage();
  for(const[i,h]of histories.entries()){const hash=createHash('sha256'),regenerated=simulateCueHistory(p,h,phase,e=>hash.update(JSON.stringify(e)+'\n')),
    {runtime,protocolSha256:oldP,numericsSha256,...original}=rows[i];assert.equal(oldP,protocolSha256);assert.equal(hash.digest('hex'),numericsSha256);assert.deepEqual(JSON.parse(JSON.stringify(regenerated)),original);console.log(JSON.stringify({phase,coldReplayed:h.seed,completed:i+1}));}
  await writeNew(join(folder,'physical-audit.json'),{schema:1,passed:true,phase,protocolSha256,resultsSha256:digest(resultBytes),histories:histories.length,mainWorlds:histories.length*15,probes:histories.length*13,runtime:{wallSeconds:(performance.now()-start)/1000,cpuMicroseconds:process.cpuUsage(cpu)}});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
