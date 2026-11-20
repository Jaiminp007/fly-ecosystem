// TASTE-BACKWARD Phase-A replication instrument (FROZEN under docs/TASTE_BACKWARD_PLAN_V1B.md).
// V1-verbatim (standard phases, legacy nutrients, depletion-DiD scorer with
// frozen A-persistence control, tol = 10% pooled candidate A-rate):
// 2 histories x 3 arms = 6 mains (BT_TICKS=1792), ZERO probes. Same frozen bar
// on the new histories alone.
// Behavioral backward retention A->B->C->return-A with SAME agents:
// 2 histories x 3 arms (candidate/frozen/unlearned) = 6 mains (BT_TICKS=1792),
// ZERO probes, standard phases, legacy nutrients. Per-segment per-tick food
// rates differenced from consecutive phaseRows; depletion controlled by
// difference-in-differences (unlearned baseline) with frozen (A-weights held)
// isolating B/C-interference. GO iff drop(candidate) < drop(unlearned) AND
// retA-rate(candidate) > retA-rate(unlearned) AND drop(candidate) <=
// drop(frozen)+tol (tol = 10% pooled candidate A-rate). All-zero feeding ->
// INCOMPLETE-NOFEED (void). Else NOGO. Thin n=2 — licenses replication ONLY.
// Builds the missing backward scorer (DTR part iii) as a side effect.
// No distinct-task/DTR/population/RSI claim.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join,resolve,relative,sep} from 'node:path';
import {dirname as pathDirname} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {TasteExperiment} from '../learning/taste-experiment.mjs';
import {CONTINUAL_PHASES} from '../learning/continual-regimes.mjs';
import {bodyTransferExclusions,BT_LEARNER_OPTIONS,BT_PRICING,BT_TICKS,BT_FOUNDERS,
  BT_MAIN_OP_CAP,BT_ROW_WALL_SECONDS,BT_ROW_CPU_SECONDS} from './body-transfer.mjs';

export const TB_EXPERIMENT='taste-backward-dev';
export const TB_HISTORIES=2;
export const TB_ARMS=Object.freeze(['candidate','frozen','unlearned']);
export const TB_PHASE_IDS=Object.freeze(['A','B','C','return-A']);
export const TB_EXPECT_MAINS=6, TB_EXPECT_PROBES=0;
export const TB_OP_CAP=20_000_000_000, TB_WALL_CAP_SECONDS=3600;
export const TB_FIXTURE_SEEDS=Object.freeze(Array.from({length:18},(_,j)=>473046+j));
const TB_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054],[395001,395018],[395019,395072],[396001,396036],[397001,397036],[398001,398036],[400001,400072],[401001,401036],[402001,402036],[403001,403036],[404001,404036],[405001,405054],[407001,407054],[408001,408054],[409001,409054],[410001,410054],[411001,411054],[412001,412054],[413001,413054],[414001,414054],[415001,415054],[416001,416054],[417001,417054],[421001,421054],[422001,422054],[423001,423054],[424001,424054],[426001,426054],[427001,427054],[428001,428054],[429001,429054],[430001,430054],[431001,431054],[432001,432054],[433001,433054],[434001,434054],[435001,435054],[436001,436054],[437001,437054],[438001,438054],[439001,439054],[440001,440054],[441001,441054],[418001,418054],[442001,442054],[443001,443054],[444001,444054],[445001,445054],[446001,446054],[447001,447054],[448001,448054],[449001,449054],[450001,450054],[452001,452054],[453001,453054],[454001,454054],[455001,455054],[456001,456054],[457001,457054],[458001,458054],[459001,459054],[460001,460054],[461001,461054],[462001,462054],[463001,463054],[464001,464054],[465001,465054],[466001,466054],[467001,467054],[468001,468054],[469001,469054],[470001,470054],[471001,471054],[472001,472054],[473001,473009],[473010,473027],[473028,473045]];
export const TB_SPENT_SEEDS=Object.freeze([381001,...TB_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

function tasteBackwardExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/taste-backward-v1b.mjs','docs/TASTE_BACKWARD_PLAN_V1B.md','tests/taste-backward-dev.test.mjs']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function tasteBackwardSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/taste-backward-v1b.mjs','learning/taste-experiment.mjs','learning/taste-energy.mjs',
    'learning/taste-pressure.mjs','learning/continual-regimes.mjs','docs/TASTE_BACKWARD_PLAN_V1B.md'])visit(resolve(root,name));
  return found;
}
function priorEvidenceSeeds(){
  const into=new Set();
  const seedWalk=(v,k)=>{if(Array.isArray(v))for(const x of v)seedWalk(x,k);
    else if(v&&typeof v==='object')for(const[kk,vv]of Object.entries(v))seedWalk(vv,/seed/i.test(kk)?kk:k);
    else if(/seed/i.test(k)&&Number.isInteger(v)&&v>0&&v<=0xffffffff)into.add(v);};
  const walkFs=dir=>{for(const e of readdirSync(dir,{withFileTypes:true})){const p=join(dir,e.name);
    if(e.isDirectory())walkFs(p);else if(p.endsWith('.json')){try{seedWalk(JSON.parse(readFileSync(p,'utf8')),'');}catch{}}}};
  walkFs(join(root,'evidence'));return into;
}
export function tasteBackwardBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,TB_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of tasteBackwardExtraTokens())excluded.add(t);
  for(const s of TB_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of TB_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=TB_FIXTURE_SEEDS.length/TB_HISTORIES===9?Array.from({length:TB_HISTORIES},(_,h)=>{
    const s=TB_FIXTURE_SEEDS.slice(h*9,h*9+9);
    return {seed:s[0],cueSeed:s[1],resourceSeeds:s.slice(2,6),probeSeeds:{A:s[6],B:s[7],transfer:s[8]}};
  }):null;
  assert.ok(histories);
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.probeSeeds.A,h.probeSeeds.B,h.probeSeeds.transfer]);
  assert.equal(new Set(flat).size,TB_HISTORIES*9,'Dev bank draws must be 18 unique seeds');
  const p={schema:1,experiment:TB_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'TASTE-BACKWARD V1b dev bank (deterministic fresh 473046-473063, 18 seeds, 2 histories). Spend: 6 mains (3 arms x 2 histories). First use is the single V1b run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
  write(path,p);return p;
}
function checkMainIntegrity(endpoint,label){
  assert.ok(Math.abs(endpoint.accountingResidual)<1e-7,`${label}: physical conservation failed`);
  assert.ok(endpoint.scalarOperations<=BT_MAIN_OP_CAP,`${label}: main op ceiling breached`);
}
export function runTasteBackward({bankPath,output,resume=false}){
  const sources=tasteBackwardSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=tasteBackwardBank(bankPathAbs);
  assert.equal(p.histories.length,TB_HISTORIES);
  const fixturePath=join(pathDirname(bankPathAbs),'fixture-seeds-01.json');
  const fixture={seeds:[...TB_FIXTURE_SEEDS]};
  if(existsSync(fixturePath))assert.deepEqual(read(fixturePath),fixture,'Fixture seeds file already exists with different content; will not overwrite');
  else write(fixturePath,fixture);
  let rows=[],ledger={mains:0,probes:0,worldTicks:0,founderSlots:0,scalarOperations:0},runtimes={},redone=[];
  const t0=Date.now();
  if(existsSync(join(outputAbs,'dev-results.json'))&&!resume)throw new Error(`Dev output already exists; preserve it: ${outputAbs}`);
  mkdirSync(join(outputAbs,'rows'),{recursive:true});
  if(resume){
    rows=readdirSync(join(outputAbs,'rows')).filter(f=>f.endsWith('.json')).map(f=>read(join(outputAbs,'rows',f)));
    const l=read(join(outputAbs,'ledger.json'));ledger=l.ledger;runtimes=l.runtimes;redone=l.redone;
  }else{
    for(const name of Object.keys(sources)){const t=join(outputAbs,'sources',name);mkdirSync(pathDirname(t),{recursive:true});writeFileSync(t,readFileSync(join(root,name)),{flag:'wx'});}
    write(join(outputAbs,'protocol.json'),p);
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'taste-backward-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:BT_TICKS,founders:BT_FOUNDERS,
      baseLearnerOptions:{...BT_LEARNER_OPTIONS},arms:[...TB_ARMS],phases:CONTINUAL_PHASES.map(q=>({id:q.id,ticks:q.ticks,nutrient:q.nutrient})),
      caps:{executions:300,aggregateScalarOperations:TB_OP_CAP,wallSeconds:TB_WALL_CAP_SECONDS},
      scope:'TASTE-BACKWARD V1b replication; same arms/conditions/scorer. GO iff drop(candidate)<drop(unlearned) AND retA-rate(candidate)>retA-rate(unlearned) AND drop(candidate)<=drop(frozen)+tol on V1b histories; all-zero -> INCOMPLETE-NOFEED; else NOGO. No distinct-task/DTR/population/RSI claim.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*BT_TICKS+probes*256)*BT_FOUNDERS;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=TB_OP_CAP,'Dev aggregate op cap breached');};
  const timed=(label,fn)=>{
    const began=performance.now(),cpu=process.cpuUsage();const out=fn();
    const wall=(performance.now()-began)/1000,used=process.cpuUsage(cpu),cpuS=(used.user+used.system)/1e6;
    assert.ok(wall<BT_ROW_WALL_SECONDS,`${label}: exceeded wall cap`);assert.ok(cpuS<BT_ROW_CPU_SECONDS,`${label}: exceeded CPU cap`);
    return {out,wall,cpuS};
  };
  for(const arm of TB_ARMS){
    const {wall,cpuS}=timed(arm,()=>{
      for(const history of p.histories){
        let row=rows.find(r=>r.history.seed===history.seed&&r.arm===arm);
        if(row&&Array.isArray(row.phaseRows)&&row.phaseRows.length===4){
          console.log(JSON.stringify({stage:'skip',arm,seed:history.seed,reason:'complete on disk'}));continue;
        }
        if(resume)redone.push(`${history.seed}:${arm}`);
        row=row??{history:{seed:history.seed},arm,phaseRows:null,endpoint:null};
        const run=new TasteExperiment({history,arm,learnerOptions:{...BT_LEARNER_OPTIONS},cruiseSpeed:0,body:'N',pricing:{...BT_PRICING},emit:null});
        run.advance(BT_TICKS);
        const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${arm}/${history.seed}`);
        row.phaseRows=run.phaseRows;row.endpoint=endpoint;
        assert.equal(run.world.flies.length+run.world.totals.deaths,BT_FOUNDERS+run.world.totals.births,'Founder accounting broken for '+arm+'/'+history.seed);
        note(1,0,BT_TICKS,endpoint.scalarOperations);
        if(!rows.includes(row))rows.push(row);
        writeOver(join(outputAbs,'rows',`${history.seed}-${arm}.json`),row);
        checkpointLedger();
        console.log(JSON.stringify({stage:'world',arm,seed:history.seed,energy:endpoint.budgetAdjustedEnergyPerFounder,survivors:endpoint.survivors}));
      }
    });
    runtimes[arm]=wall;checkpointLedger();
  }
  assert.deepEqual(tasteBackwardSources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=TB_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  assert.equal(ledger.mains,TB_EXPECT_MAINS,'Dev mains count wrong');
  assert.equal(ledger.probes,TB_EXPECT_PROBES,'Dev probes count wrong');
  const verdict=scoreTasteBackwardRows(rows);
  writeOver(join(outputAbs,'dev-results.json'),{...verdict,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return verdict;
}
export function segmentRates(phaseRows){
  // Per-segment per-tick food rates differenced from consecutive cumulative
  // phaseRows: {A:{rate,ticks},B:...,C:...,retA:...}. Null on malformed.
  const byId={};for(const r of phaseRows)byId[r.phase]=r;
  const out={};let prev=null;
  for(const id of TB_PHASE_IDS){
    const r=byId[id];
    if(!r||!r.totals||!Number.isFinite(r.totals.foodEaten))return null;
    const ticks=CONTINUAL_PHASES.find(q=>q.id===id).ticks;
    const food=r.totals.foodEaten-(prev?prev.totals.foodEaten:0);
    out[id==='return-A'?'retA':id]={rate:food/ticks,ticks,food};
    prev=r;
  }
  return out;
}
export function scoreTasteBackwardRows(rows){
  // Backward retention via depletion-DiD. Pooled over histories; per-history
  // table descriptive. GO iff drop(candidate)<drop(unlearned) AND
  // retA-rate(candidate)>retA-rate(unlearned) AND drop(candidate)<=
  // drop(frozen)+tol, tol = 10% pooled candidate A-rate.
  const byArmSeed={};for(const r of rows)byArmSeed[r.arm+':'+r.history.seed]=r;
  const seeds=[...new Set(rows.map(r=>r.history.seed))];
  const perArm={};
  for(const arm of TB_ARMS)perArm[arm]=seeds.map(seed=>{
    const r=byArmSeed[arm+':'+seed];
    if(!r||!Array.isArray(r.phaseRows))return null;
    const seg=segmentRates(r.phaseRows);
    if(!seg)return null;
    return {seed,seg};
  });
  const complete=perArmAll=>perArmAll.every(x=>x!==null);
  const g1=rows.length===TB_EXPECT_MAINS&&TB_ARMS.every(a=>rows.filter(r=>r.arm===a).length===TB_HISTORIES)&&
    rows.every(r=>Array.isArray(r.phaseRows)&&TB_PHASE_IDS.every(id=>r.phaseRows.some(q=>q.phase===id)))&&
    rows.every(r=>r.endpoint&&Number.isFinite(r.endpoint.budgetAdjustedEnergyPerFounder)&&Number.isFinite(r.endpoint.survivors));
  const poolFood=arm=>{let f=0,t=0;for(const x of perArm[arm]){if(!x)return null;for(const id of ['A','B','C','retA']){f+=x.seg[id].food;t+=x.seg[id].ticks;}}return {f,t};};
  const pooled={};
  for(const arm of TB_ARMS){
    if(!complete(perArm[arm])){pooled[arm]=null;continue;}
    let fA=0,tA=0,fR=0,tR=0,fTot=0;
    for(const x of perArm[arm]){fA+=x.seg.A.food;tA+=x.seg.A.ticks;fR+=x.seg.retA.food;tR+=x.seg.retA.ticks;fTot+=x.seg.A.food+x.seg.B.food+x.seg.C.food+x.seg.retA.food;}
    pooled[arm]={rateA:fA/tA,rateRet:fR/tR,drop:fA/tA-fR/tR,totalFood:fTot};
  }
  const g2=g1&&TB_ARMS.every(a=>pooled[a]!==null)&&TB_ARMS.every(a=>pooled[a].totalFood>0);
  const tol=g2?0.10*pooled.candidate.rateA:null;
  const gate=!g1?{go:false,verdict:'INVALID',reason:'integrity failed (mains/phaseRows/endpoint)'}
    :!g2?{go:false,verdict:'INCOMPLETE-NOFEED',reason:'an arm never fed — depletion baseline void (not NOGO)'}
    :(pooled.candidate.drop<pooled.unlearned.drop&&pooled.candidate.rateRet>pooled.unlearned.rateRet&&pooled.candidate.drop<=pooled.frozen.drop+tol)
    ?{go:true,verdict:'TASTE-BACKWARD-GO-V1',reason:`candidate drop ${pooled.candidate.drop.toFixed(4)} < unlearned ${pooled.unlearned.drop.toFixed(4)}, retA-rate above naive, within frozen+tol — behavioral backward retention (thin n=2, licenses replication only)`}
    :{go:false,verdict:'TASTE-BACKWARD-NOGO-V1',reason:`candidate drop ${pooled.candidate.drop.toFixed(4)} vs unlearned ${pooled.unlearned.drop.toFixed(4)} vs frozen ${pooled.frozen.drop.toFixed(4)} — no backward retention signal at this scale`};
  return {perArm:Object.fromEntries(TB_ARMS.map(a=>[a,(perArm[a]||[]).map(x=>x===null?null:{seed:x.seed,A:+x.seg.A.rate.toFixed(4),retA:+x.seg.retA.rate.toFixed(4),drop:+(x.seg.A.rate-x.seg.retA.rate).toFixed(4)})])),pooled:Object.fromEntries(TB_ARMS.map(a=>[a,pooled[a]===null?null:{rateA:+pooled[a].rateA.toFixed(4),rateRet:+pooled[a].rateRet.toFixed(4),drop:+pooled[a].drop.toFixed(4),totalFood:Math.round(pooled[a].totalFood)}])),tol:tol===null?null:+tol.toFixed(4),g1,g2,go:gate.go,verdict:gate.verdict,reason:gate.reason};
}
