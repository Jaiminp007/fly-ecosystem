// Explicitly exploratory development. Reuse is allowed; never qualification/RSI.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,readdirSync,existsSync} from 'node:fs';
import {dirname,resolve,relative,join,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes} from 'node:crypto';
import {digest} from '../learning/intervention-study.mjs';
import {TasteExperiment,runTasteProbe,TASTE_ARMS} from '../learning/taste-experiment.mjs';
import {runTastePressureBattery,tastePressureEffects} from '../learning/taste-pressure.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const write=(file,value)=>{mkdirSync(dirname(file),{recursive:true});writeFileSync(file,JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const read=file=>JSON.parse(readFileSync(file,'utf8'));
const mean=xs=>xs.reduce((n,v)=>n+v,0)/xs.length;
function walk(directory,visit){if(!existsSync(directory))return;for(const item of readdirSync(directory,{withFileTypes:true})){
  const path=join(directory,item.name);if(item.isDirectory()&&!['sources','registries','engineering','authority-inputs','prospective'].includes(item.name))walk(path,visit);else if(item.isFile())visit(path,item.name);
}}
function bank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,'exploratory-taste-energy-development-v1');return p;}
  const excluded=new Set([41,...Array.from({length:512},(_,i)=>250001+i),...Array.from({length:512},(_,i)=>252001+i),...Array.from({length:3072},(_,i)=>253001+i)]),registries=[],engineering=[];
  function visit(value,key=''){
    if(Array.isArray(value))for(const x of value)visit(x,key);else if(value&&typeof value==='object')for(const[k,v]of Object.entries(value))visit(v,/seed/i.test(key)?key:k);
    else if(/seed/i.test(key)&&Number.isInteger(value)&&value>0&&value<=0xffffffff)excluded.add(value);
  }
  walk(join(root,'evidence'),(file,name)=>{if(name==='protocol.json'){const bytes=readFileSync(file);visit(JSON.parse(bytes));registries.push({path:relative(root,file).split(sep).join('/'),sha256:digest(bytes)});}});
  for(const dir of ['tests','scripts'])for(const name of readdirSync(join(root,dir))){
    if(!(dir==='tests'?name.endsWith('.mjs'):/(?:engineering|fixtures).*\.mjs$/.test(name)))continue;
    const file=join(root,dir,name),bytes=readFileSync(file);for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)excluded.add(n);
    }engineering.push({path:`${dir}/${name}`,sha256:digest(bytes)});
  }
  const used=new Set(excluded),fresh=()=>{let seed;do{seed=randomBytes(4).readUInt32BE();}while(!seed||used.has(seed));used.add(seed);return seed;};
  const histories=Array.from({length:8},()=>({seed:fresh(),cueSeed:fresh(),resourceSeeds:Array.from({length:4},fresh),probeSeeds:{A:fresh(),B:fresh(),transfer:fresh()}}));
  const p={schema:1,experiment:'exploratory-taste-energy-development-v1',createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,
    scope:'Reusable exploratory development bank authorized by user. No confirmation reserve, qualification or RSI. Every attempt preserves sources/results; old locked studies remain unchanged.'};
  write(path,p);return p;
}
export function tasteDevelopmentSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(dirname(path),m[1]));
  };
  for(const name of ['scripts/taste-development.mjs','docs/TASTE_ENERGY_DESIGN.md','docs/DEVELOPMENT_WORKFLOW.md','docs/TASTE_RETENTION_TRANSFER.md','docs/TASTE_ENERGY_BALANCE.md','tests/taste-experiment.test.mjs','tests/taste-energy.test.mjs'])visit(resolve(root,name));
  return found;
}
function summary(run){
  const states=Object.values(run.learners);
  return {endpoint:run.endpoint(),phases:run.phaseRows,statistics:run.statistics,
    updates:states.reduce((n,s)=>n+s.work.liveUpdates,0),tasteExamples:states.reduce((n,s)=>n+(s.tasteExamples??0),0),
    weights:Object.fromEntries(['taste','actor','critic'].map(key=>[key,states.reduce((n,s)=>n+(s.weights?.[key]?.reduce((m,w)=>m+Math.abs(w),0)??0),0)])),
    savedModels:run.savedModels,finalModels:Object.fromEntries(Object.entries(run.learners).filter(([,s])=>s.weights).map(([id,s])=>[id,s.weights]))};
}
export function runTasteDevelopment({bankPath,output,ticks=512,start=0,count=4,feedingRule='matching',tasteRepresentation='pairwise',tasteRate=.1,capacity=32,recent=8,replayStrata=1,replayPasses=1,consolidationRate=0,motorConsolidationRate=0,streams=1,streamHysteresis=0,surpriseGain=0,surpriseWindow=0,phaseSlots=1,slotRate=.05,marginWidth=0,marginBoost=0,replayTournament=1,replayRate=1,replaySkip=0,replaySurpriseGain=0,evictBias=0,motorRepresentation='shared',holdTicks=16,criticWarmStart=false,cruiseSpeed=0,motorRule='td',renewalRate=.1,greedyInference=false,arms=['candidate','unlearned','acceptCruise']}){
  assert.ok([512,1792].includes(ticks)&&count>=1&&start>=0&&start+count<=8);assert.ok(!existsSync(output),'Attempt output already exists; preserve it');
  assert.ok(arms.every(arm=>TASTE_ARMS.includes(arm))&&new Set(arms).size===arms.length&&['candidate','unlearned','acceptCruise'].every(arm=>arms.includes(arm)));
  const p=bank(bankPath),sources=tasteDevelopmentSources();mkdirSync(output,{recursive:true});
  for(const name of Object.keys(sources)){const target=join(output,'sources',name);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,readFileSync(join(root,name)),{flag:'wx'});}
  write(join(output,'protocol.json'),p);
  const attempt={schema:1,kind:'exploratory-taste-development-attempt',createdAt:new Date().toISOString(),bankSha256:digest(readFileSync(bankPath)),sourceSha256:sources,
    ticks,start,count,learnerOptions:{feedingRule,tasteRepresentation,tasteRate,capacity,recent,replayStrata,replayPasses,consolidationRate,motorConsolidationRate,streams,streamHysteresis,surpriseGain,surpriseWindow,phaseSlots,slotRate,marginWidth,marginBoost,replayTournament,replayRate,replaySkip,replaySurpriseGain,evictBias,motorRepresentation,holdTicks,criticWarmStart,motorRule,renewalRate,greedyInference},cruiseSpeed,arms,developmentSignalRule:'Both mean energy contrasts positive, at least 75% of histories positive for each, nonnegative summed survivor differences. Extended controls use the same rule against frozen-after-A and reset-at-B/C. Descriptive development signal only; no statistical qualification.',
    scope:'Exploratory development; reusable/tunable. Full original costs, deaths and denominators. No retention/pressure/transfer or RSI qualification.'};
  write(join(output,'attempt.json'),attempt);
  const began=performance.now(),cpu=process.cpuUsage(),rows=[];
  for(const history of p.histories.slice(start,start+count)){
    const row={history,arms:{},probes:{}};let candidate;
    for(const arm of attempt.arms){
      const run=new TasteExperiment({history,arm,learnerOptions:attempt.learnerOptions,cruiseSpeed});run.advance(ticks);const result=summary(run);
      assert.ok(Math.abs(result.endpoint.accountingResidual)<1e-7,'Physical conservation failed');row.arms[arm]=result;if(arm==='candidate')candidate=run;
      console.log(JSON.stringify({stage:'world',seed:history.seed,arm,tick:run.world.tick,energy:result.endpoint.budgetAdjustedEnergyPerFounder,survivors:result.endpoint.survivors,tasteExamples:result.tasteExamples}));
      assert.ok((performance.now()-began)/1000<600,'Development attempt exceeded ten-minute runtime cap');
    }
    if(candidate.atC)write(join(output,'anchors',`${history.seed}-C.json`),candidate.atC);
    for(const version of ['current','reset'])row.probes[`early-A:${version}`]=runTasteProbe(candidate.atA,{family:'A',version,seed:history.probeSeeds.A});
    if(ticks===1792){
      for(const version of ['current','reset'])row.probes[`early-B:${version}`]=runTasteProbe(candidate.atB,{family:'B',version,seed:history.probeSeeds.B});
      for(const family of ['A','B','transfer'])for(const version of ['current','reset',...(family==='transfer'?['acceptCruise','acceptStationary']:[family])]){
        row.probes[`${family}:${version}`]=runTasteProbe(candidate.atC,{family,version,seed:history.probeSeeds[family]});
      }
      const pressure=runTastePressureBattery(candidate.atC,history,{existing:row.probes});row.pressure={...pressure,effects:tastePressureEffects(pressure)};
    }
    const early=row.probes['early-A:current'],reset=row.probes['early-A:reset'];
    row.effects={sequence:row.arms.candidate.endpoint.budgetAdjustedEnergyPerFounder-row.arms.unlearned.endpoint.budgetAdjustedEnergyPerFounder,
      acquiredA:early.value-reset.value,sequenceSurvivors:row.arms.candidate.endpoint.survivors-row.arms.unlearned.endpoint.survivors,acquiredASurvivors:early.survivors-reset.survivors};
    write(join(output,'rows',`${history.seed}.json`),row);rows.push(row);console.log(JSON.stringify({stage:'history',seed:history.seed,effects:row.effects}));
  }
  assert.deepEqual(tasteDevelopmentSources(),sources,'Sources changed during development attempt');
  const effect=key=>rows.map(row=>row.effects[key]),sequence=effect('sequence'),acquiredA=effect('acquiredA'),survival=effect('sequenceSurvivors').reduce((a,b)=>a+b,0),probeSurvival=effect('acquiredASurvivors').reduce((a,b)=>a+b,0);
  const used=process.cpuUsage(cpu),result={schema:1,kind:attempt.kind,bankSha256:attempt.bankSha256,sourceSha256:sources,histories:rows.length,ticks,
    sequence:{effects:sequence,mean:mean(sequence),positive:sequence.filter(v=>v>0).length,survivorDifference:survival},
    acquiredA:{effects:acquiredA,mean:mean(acquiredA),positive:acquiredA.filter(v=>v>0).length,survivorDifference:probeSurvival},
    developmentSignal:mean(sequence)>0&&mean(acquiredA)>0&&sequence.filter(v=>v>0).length>=Math.ceil(count*.75)&&acquiredA.filter(v=>v>0).length>=Math.ceil(count*.75)&&survival>=0&&probeSurvival>=0,
    qualified:false,runtime:{wallSeconds:(performance.now()-began)/1000,cpuSeconds:(used.user+used.system)/1e6},scope:attempt.scope};
  result.controlComparisons=Object.fromEntries(arms.filter(arm=>arm!=='candidate').map(arm=>{
    const effects=rows.map(r=>r.arms.candidate.endpoint.budgetAdjustedEnergyPerFounder-r.arms[arm].endpoint.budgetAdjustedEnergyPerFounder);
    const survivorDifference=rows.reduce((n,r)=>n+r.arms.candidate.endpoint.survivors-r.arms[arm].endpoint.survivors,0);
    return [arm,{effects,mean:mean(effects),positive:effects.filter(v=>v>0).length,survivorDifference}];
  }));
  if(arms.includes('frozen')&&arms.includes('reset'))result.extendedDevelopmentSignal=result.developmentSignal&&['frozen','reset'].every(arm=>{
    const c=result.controlComparisons[arm];return c.mean>0&&c.positive>=Math.ceil(count*.75)&&c.survivorDifference>=0;
  });
  if(ticks===1792){
    result.retention=Object.fromEntries(['A','B'].map(family=>{
      const retained=rows.map(r=>r.probes[`${family}:current`].value-r.probes[`${family}:reset`].value);
      const saved=rows.map(r=>r.probes[`${family}:${family}`].value-r.probes[`${family}:reset`].value);
      return [family,{retainedEffects:retained,savedEffects:saved,retainedMean:mean(retained),savedMean:mean(saved),
        descriptive95Percent:mean(saved)>0&&mean(retained)>=.95*mean(saved),
        survivorDifference:rows.reduce((n,r)=>n+r.probes[`${family}:current`].survivors-r.probes[`${family}:${family}`].survivors,0)}];
    }));
    const transfer=rows.map(r=>r.probes['transfer:current'].value-r.probes['transfer:reset'].value);
    result.transfer={effects:transfer,mean:mean(transfer),positive:transfer.filter(v=>v>0).length,
      survivorDifference:rows.reduce((n,r)=>n+r.probes['transfer:current'].survivors-r.probes['transfer:reset'].survivors,0)};
    result.transferControls=Object.fromEntries(['reset','acceptCruise','acceptStationary'].map(version=>{
      const effects=rows.map(r=>r.probes['transfer:current'].value-r.probes[`transfer:${version}`].value);
      return [version,{effects,mean:mean(effects),positive:effects.filter(v=>v>0).length,survivorDifference:rows.reduce((n,r)=>n+r.probes['transfer:current'].survivors-r.probes[`transfer:${version}`].survivors,0)}];
    }));
    result.pressure=Object.fromEntries(Object.keys(rows[0].pressure.effects).map(key=>{
      const effects=rows.map(row=>row.pressure.effects[key]);return [key,{effects,mean:mean(effects),positive:effects.filter(v=>v>0).length}];
    }));
  }
  write(join(output,'results.json'),result);console.log(JSON.stringify(result));return result;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2),value=name=>{const i=args.indexOf(name);return i<0?undefined:args[i+1];};
  assert.ok(value('--output'),'Supply a new --output directory');runTasteDevelopment({bankPath:resolve(value('--bank')??'evidence/taste-development/dev-bank-v1/protocol.json'),output:resolve(value('--output')),
    ticks:Number(value('--ticks')??512),start:Number(value('--start')??0),count:Number(value('--count')??4),feedingRule:value('--feeding')??'matching',
    tasteRepresentation:value('--taste')??'pairwise',tasteRate:Number(value('--taste-rate')??.1),capacity:Number(value('--capacity')??32),recent:Number(value('--recent')??8),replayStrata:Number(value('--replay-strata')??1),replayPasses:Number(value('--replay-passes')??1),consolidationRate:Number(value('--consolidation-rate')??0),motorConsolidationRate:Number(value('--motor-consolidation-rate')??0),streams:Number(value('--streams')??1),streamHysteresis:Number(value('--stream-hysteresis')??0),surpriseGain:Number(value('--surprise-gain')??0),surpriseWindow:Number(value('--surprise-window')??0),phaseSlots:Number(value('--phase-slots')??1),slotRate:Number(value('--slot-rate')??.05),marginWidth:Number(value('--margin-width')??0),marginBoost:Number(value('--margin-boost')??0),replayTournament:Number(value('--replay-tournament')??1),replayRate:Number(value('--replay-rate')??1),replaySkip:Number(value('--replay-skip')??0),replaySurpriseGain:Number(value('--replay-surprise-gain')??0),evictBias:Number(value('--evict-bias')??0),motorRepresentation:value('--motor')??'shared',holdTicks:Number(value('--hold')??16),
    criticWarmStart:args.includes('--warm-critic'),cruiseSpeed:Number(value('--cruise-speed')??0),
    motorRule:value('--motor-rule')??'td',renewalRate:Number(value('--renewal-rate')??.1),
    greedyInference:args.includes('--greedy-inference'),
    arms:(value('--arms')??'candidate,unlearned,acceptCruise').split(',')});
}
