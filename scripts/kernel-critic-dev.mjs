// KERNEL-CRITIC Phase-1 dev instrument (FROZEN under docs/KERNEL_CRITIC_PLAN_V1A.md
// + V1 (capacity-64 amendment). Matched-history superiority test on a fresh
// bank: baseline tick-AC ('candidate') vs kernel-critic ('kernelCritic'),
// 6 histories x 2 arms = 12 mains, ZERO probes, 1792 ticks (full phase cycle).
// New learner kind 'tick-kernel-critic-v1' (learning/tick-kernel-critic.mjs);
// tick-cue-experiment dispatches on arm (null-default: existing arms byte-identical).
// Gates (V1A-corrected): G1 join+integrity; G0 baseline mean gap >=0.5;
// G2a-MET PRIMARY (pooled critic - pooled baseline >= +0.1); G2b no-collapse
// (survival >=50% AND pause <= baseline+0.2); G2c fixture-level (see plan).
// Verdict GO/NOGO/INCOMPLETE-BASELINE/INVALID (KC-*).
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join,resolve,relative,sep} from 'node:path';
import {dirname as pathDirname} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {TickCueExperiment} from '../learning/tick-cue-experiment.mjs';
import {bodyTransferExclusions} from './body-transfer.mjs';

export const KC_EXPERIMENT='kernel-critic-dev';
export const KC_HISTORIES=6;
export const KC_ARMS=Object.freeze(['candidate','kernelCritic']);
export const KC_FIXTURE_SEEDS=Object.freeze(Array.from({length:54},(_,j)=>451001+j));
const KC_SPENT_RANGES=[[379001,379009],[380001,380009],[380011,380019],[380021,380029],[382001,382036],[383001,383036],[384001,384054],[385001,385054],[386001,386054],[387001,387054],[388001,388054],[395001,395018],[395019,395072],[396001,396036],[397001,397036],[398001,398036],[400001,400072],[401001,401036],[402001,402036],[403001,403036],[404001,404036],[405001,405054],[407001,407054],[408001,408054],[409001,409054],[410001,410054],[411001,411054],[412001,412054],[413001,413054],[414001,414054],[415001,415054],[416001,416054],[417001,417054],[418001,418054],[421001,421054],[422001,422054],[423001,423054],[424001,424054],[426001,426054],[427001,427054],[428001,428054],[429001,429054],[430001,430054],[431001,431054],[432001,432054],[433001,433054],[434001,434054],[435001,435054],[436001,436054],[437001,437054],[438001,438054],[439001,439054],[440001,440054],[441001,441054],[442001,442054],[443001,443054],[444001,444054],[445001,445054],[446001,446054],[447001,447054],[448001,448054],[449001,449054],[450001,450054],[451001,451054]];
export const KC_SPENT_SEEDS=Object.freeze([381001,...KC_SPENT_RANGES.flatMap(([a,b])=>Array.from({length:b-a+1},(_,j)=>a+j))]);
export const KC_EXPECT_MAINS=12, KC_EXPECT_PROBES=0;
export const KC_TICKS=1792, KC_FOUNDERS=24;
export const KC_OP_CAP=8_000_000_000, KC_WALL_CAP_SECONDS=10800;
export const KC_JOIN_MIN=0.99, KC_BASE_GAP=0.5, KC_MET_TOL=0.1, KC_SURV_MIN=0.5, KC_PAUSE_TOL=0.2;
export const KC_REFERENCE=Object.freeze({founders:24,actorParameters:{},parameters:Object.freeze({actuator:'move',moveMode:'levels',slowSpeed:.15,fastSpeed:.5,decisionTicks:8,creditTicks:8,returnMode:'td',discount:.99})});
export const KC_PRICING=Object.freeze({operationEnergy:5e-6/17,byteEnergyPerSecond:1e-5/(17*8)});
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const writeOver=(p,v)=>{mkdirSync(pathDirname(p),{recursive:true});writeFileSync(p,JSON.stringify(v));};
const digest=b=>createHash('sha256').update(b).digest('hex');

function kernelCriticExtraTokens(){
  const into=new Set();
  for(const name of ['scripts/kernel-critic-dev.mjs','learning/tick-kernel-critic.mjs','learning/tick-cue-experiment.mjs',
    'docs/KERNEL_CRITIC_PLAN_V1.md','docs/KERNEL_CRITIC_PLAN_V1A.md','docs/EMBODIED_KERNEL_FEASIBILITY_V1.md',
    'tests/kernel-critic-dev.test.mjs']){
    const bytes=readFileSync(join(root,name));
    for(const token of bytes.toString().matchAll(/\b(?:0x[\da-f]+|\d[\d_]*)\b/gi)){
      const n=Number(token[0].replaceAll('_',''));if(Number.isInteger(n)&&n>0&&n<=0xffffffff)into.add(n);
    }
  }
  return into;
}
export function kernelCriticDevSources(){
  const found={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(found,name))return;const bytes=readFileSync(path);found[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString().matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(pathDirname(path),m[1]));
  };
  for(const name of ['scripts/kernel-critic-dev.mjs','learning/tick-kernel-critic.mjs','learning/tick-cue-experiment.mjs',
    'learning/tick-actor-critic.mjs','learning/kernel-learner.mjs','tests/kernel-critic-dev.test.mjs',
    'docs/KERNEL_CRITIC_PLAN_V1.md','docs/KERNEL_CRITIC_PLAN_V1A.md'])visit(resolve(root,name));
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
export function kernelCriticDevBank(path){
  if(existsSync(path)){const p=read(path);assert.equal(p.experiment,KC_EXPERIMENT);return p;}
  const {excluded,registries,engineering,handoffSources}=bodyTransferExclusions();
  for(const t of kernelCriticExtraTokens())excluded.add(t);
  for(const s of KC_SPENT_SEEDS)excluded.add(s);
  const prior=priorEvidenceSeeds();
  for(const s of KC_FIXTURE_SEEDS)assert.ok(!prior.has(s),`Fixture seed ${s} already used in prior evidence`);
  const histories=Array.from({length:KC_HISTORIES},(_,h)=>{
    const s=KC_FIXTURE_SEEDS.slice(h*8,h*8+8);
    return {seed:s[0],cueSeed:s[1],shuffleSeed:s[2],nullSeed:s[3],resourceSeeds:s.slice(4,8)};
  });
  assert.ok(histories.every(h=>h.resourceSeeds.length===4));
  const flat=histories.flatMap(h=>[h.seed,h.cueSeed,h.shuffleSeed,h.nullSeed,...h.resourceSeeds]);
  assert.equal(new Set(flat).size,KC_HISTORIES*8,'Dev bank draws must be 48 unique seeds');
  const p={schema:1,experiment:KC_EXPERIMENT,createdAt:new Date().toISOString(),histories,
    reservedSeeds:KC_FIXTURE_SEEDS.slice(48),
    excludedSeeds:[...excluded].sort((a,b)=>a-b),registries,engineering,handoffSources,
    scope:'KERNEL-CRITIC Phase-1 dev bank (deterministic fresh 451001-451048 used, 8/history, 6 histories; 451049-451054 reserved-unused buffer). First use is the single V1A run; any exposure spends it. Union-excluded from all future qual banks via evidence-protocol scan.'};
  write(path,p);return p;
}
// K1 collector: joins TickCueExperiment decision+physical on tick:agentId.
// cue = sourceCue bits; action = choice; turn = action%2===1; contact = true
// (K1 arms never blind/transfer); harmful = toxinDamage, beneficial = beneficialEaten.
export function collectKernelCritic(){
  const pending=new Map(),perCue={};
  let decisions=0,joined=0,pauses=0;
  const key=(o)=>`${o.tick}:${o.agentId}`;
  const emit=e=>{
    if(e.type==='decision'&&e.own){
      decisions++;
      const action=e.choice;
      if(action>=2)pauses++;
      pending.set(key(e.own),{cue:(e.sourceCue??[]).join(','),action,contact:true,tick:e.own.tick});
    }else if(e.type==='physical'&&e.agentId!==undefined&&e.tick!==undefined){
      const d=pending.get(`${e.tick}:${e.agentId}`);
      if(!d)return;
      pending.delete(`${e.tick}:${e.agentId}`);joined++;
      const b=Number(e.beneficialEaten)||0,h=Number(e.toxinDamage)||0;
      if(d.contact){
        const s=perCue[d.cue]??={contact:0,pause:0,turn:0,beneficial:0,harmful:0,harmTurn:0,harmN:0,benTurn:0,benN:0};
        s.contact++;if(d.action>=2)s.pause++;if(d.action%2===1)s.turn++;
        s.beneficial+=b;s.harmful+=h;
      }
    }
  };
  return {emit,
    summarize:()=>{
      const cues={};let hT=0,hN=0,bT=0,bN=0,pauseTot=0,contactTot=0;
      for(const [cue,s] of Object.entries(perCue)){
        const label=s.harmful>s.beneficial?'harmful':(s.beneficial>s.harmful?'beneficial':'tied');
        cues[cue]={...s,label};
        contactTot+=s.contact;pauseTot+=s.pause;
        if(label==='harmful'){hT+=s.turn;hN+=s.contact;}else if(label==='beneficial'){bT+=s.turn;bN+=s.contact;}
      }
      return {decisions,joined,joinRate:decisions?joined/decisions:0,
        pauseRate:decisions?pauses/decisions:0,
        harmTurn:hT,harmN:hN,benTurn:bT,benN:bN,
        gap:hN&&bN?+((hT/hN)-(bT/bN)).toFixed(4):null,
        contactTot,pauseTot,cues};
    }};
}
// Pure scorer (exported for fixtures).
// G1: every row joinRate >= KC_JOIN_MIN, else INVALID.
// G0: baseline mean gap >=0.5, else INCOMPLETE-BASELINE.
// G2a-MET: pooled critic - pooled baseline >= +0.1 (PRIMARY).
// G2b: critic survival mean >=0.5 AND critic pause <= baseline pause +0.2.
// GO iff G1 && G0 && G2a && G2b. (G2c fixture-level per plan.)
export function scoreKernelCritic(rows){
  const byTag={};
  for(const r of rows)(byTag[r.tag]??=[]).push(r);
  assert.ok(byTag.candidate&&byTag.kernelCritic,'scorer needs candidate + kernelCritic rows');
  const gCounts=['candidate','kernelCritic'].every(t=>(byTag[t]||[]).length===KC_HISTORIES);
  const g1=gCounts&&Object.values(byTag).every(rs=>rs.every(r=>r.summary&&r.summary.joinRate>=KC_JOIN_MIN));
  const gapOf=r=>r.summary.gap;
  const baseGaps=(byTag.candidate||[]).map(r=>({seed:r.history.seed,gap:gapOf(r)}));
  const critGaps=(byTag.kernelCritic||[]).map(r=>({seed:r.history.seed,gap:gapOf(r)}));
  const g0=baseGaps.length===KC_HISTORIES&&baseGaps.every(g=>g.gap!==null);
  const baseMean=g0?+(baseGaps.reduce((a,g)=>a+g.gap,0)/baseGaps.length).toFixed(4):null;
  const g0pass=g0&&baseMean>=KC_BASE_GAP;
  const pool=rs=>{
    let hT=0,hN=0,bT=0,bN=0;
    for(const r of rs){hT+=r.summary.harmTurn;hN+=r.summary.harmN;bT+=r.summary.benTurn;bN+=r.summary.benN;}
    return hN&&bN?+((hT/hN)-(bT/bN)).toFixed(4):null;
  };
  const pooledBase=pool(byTag.candidate||[]),pooledCrit=pool(byTag.kernelCritic||[]);
  const met=pooledBase!==null&&pooledCrit!==null?+(pooledCrit-pooledBase).toFixed(4):null;
  const gMet=met!==null&&met>=KC_MET_TOL;
  const surv=rs=>rs.length?+(rs.reduce((a,r)=>a+r.endpoint.survivors/r.endpoint.founders,0)/rs.length).toFixed(4):null;
  const survBase=surv(byTag.candidate||[]),survCrit=surv(byTag.kernelCritic||[]);
  const pause=rs=>{let p=0,n=0;for(const r of rs){p+=r.summary.pauseTot??0;n+=r.summary.contactTot??r.summary.decisions??0;}return n?+(p/n).toFixed(4):null;};
  const pauseBase=pause(byTag.candidate||[]),pauseCrit=pause(byTag.kernelCritic||[]);
  const gCollapse=survCrit!==null&&survCrit>=KC_SURV_MIN&&pauseCrit!==null&&pauseBase!==null&&pauseCrit<=pauseBase+KC_PAUSE_TOL;
  const go=g1&&g0pass&&gMet&&gCollapse;
  const verdict=!g1?'INVALID':!g0pass?'INCOMPLETE-BASELINE':go?'KC-GO':'KC-NOGO';
  return {g1,g0:g0pass,g2a:gMet,g2b:gCollapse,baseMean,pooledBase,pooledCrit,met,
    survBase,survCrit,pauseBase,pauseCrit,baseGaps,critGaps,go,verdict};
}
export function runKernelCriticDev({bankPath,output,resume=false}){
  const sources=kernelCriticDevSources();
  const bankPathAbs=resolve(bankPath),outputAbs=resolve(output);
  const p=kernelCriticDevBank(bankPathAbs);
  assert.equal(p.histories.length,KC_HISTORIES);
  const fixturePath=join(pathDirname(bankPathAbs),'fixture-seeds-01.json');
  const fixture={seeds:[...KC_FIXTURE_SEEDS]};
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
    write(join(outputAbs,'attempt.json'),{schema:1,kind:'kernel-critic-dev-attempt',createdAt:new Date().toISOString(),
      bankSha256:digest(readFileSync(bankPathAbs)),sourceSha256:sources,ticks:KC_TICKS,founders:KC_FOUNDERS,
      arms:[...KC_ARMS],fixtureSeeds:fixture.seeds,g2cFixtureNote:'null-hygiene fixture-level (construction identity + sources-closure static guard, green pre-bank)',
      caps:{executions:300,aggregateScalarOperations:KC_OP_CAP,wallSeconds:KC_WALL_CAP_SECONDS},
      scope:'KERNEL-CRITIC Phase-1 single run (matched histories, baseline vs kernel-critic). 1792 ticks full phase cycle; conjunctive G1/G0/G2a-MET/G2b decide; plan V1A governs.'});
  }
  const checkpointLedger=()=>writeOver(join(outputAbs,'ledger.json'),{ledger,runtimes,redone});
  const note=(mains,probes,ticks,ops)=>{ledger.mains+=mains;ledger.probes+=probes;ledger.worldTicks+=(mains+probes)*ticks;
    ledger.founderSlots+=(mains*KC_TICKS+probes*256)*KC_FOUNDERS;ledger.scalarOperations+=ops;
    assert.ok(ledger.scalarOperations<=KC_OP_CAP,'Dev aggregate op cap breached');};
  const timed=(label,fn)=>{
    const began=performance.now(),cpu=process.cpuUsage();const out=fn();
    const wall=(performance.now()-began)/1000,used=process.cpuUsage(cpu),cpuS=(used.user+used.system)/1e6;
    return {out,wall,cpuS};
  };
  const runOne=(tag,history)=>{
    const found=rows.find(r=>r.history.seed===history.seed&&r.tag===tag&&r.summary);
    if(found){console.log(JSON.stringify({stage:'skip',tag,seed:history.seed,reason:'complete on disk'}));return {row:found,wall:0,cpuS:0};};
    if(resume)redone.push(`${history.seed}:${tag}`);
    const collector=collectKernelCritic();
    let row=null;
    const {wall,cpuS}=timed(`${tag}/${history.seed}`,()=>{
      const run=new TickCueExperiment({history,arm:tag,reference:{...KC_REFERENCE},pricing:{...KC_PRICING},emit:collector.emit});
      run.advance(KC_TICKS);
      const endpoint=run.endpoint();checkMainIntegrity(endpoint,`${tag}/${history.seed}`);
      const summary=collector.summarize();
      row={history:{seed:history.seed},tag,endpoint,summary};
      note(1,0,KC_TICKS,endpoint.scalarOperations);
      rows.push(row);
      writeOver(join(outputAbs,'rows',`${history.seed}-${tag}.json`),row);
      checkpointLedger();
      console.log(JSON.stringify({stage:'world',tag,seed:history.seed,survivors:endpoint.survivors,energy:+endpoint.budgetAdjustedEnergyPerFounder.toFixed(1)}));
    });
    return {row:rows.find(r=>r.history.seed===history.seed&&r.tag===tag),wall,cpuS};
  };
  const pairWall={};
  for(let hi=0;hi<KC_HISTORIES;hi++){
    const h=p.histories[hi];
    let wall=0,cpuS=0;
    for(const tag of KC_ARMS){
      const res=runOne(tag,h);wall+=res.wall;cpuS+=res.cpuS;
    }
    pairWall[`history${hi}`]={wall,cpuS};
  }
  runtimes.histories=pairWall;checkpointLedger();
  assert.deepEqual(kernelCriticDevSources(),sources,'Sources changed during dev run');
  assert.ok((Date.now()-t0)/1000<=KC_WALL_CAP_SECONDS,'Dev aggregate wall cap breached');
  const decision=scoreKernelCritic(rows);
  assert.equal(ledger.mains,KC_EXPECT_MAINS,'Dev mains count mismatch');
  assert.equal(ledger.probes,KC_EXPECT_PROBES,'Dev probes count mismatch');
  writeOver(join(outputAbs,'dev-results.json'),{...decision,ledger,runtimes,redone,
    executionSources:resume?read(join(outputAbs,'attempt.json')).sourceSha256:sources,scoringSources:sources});
  return decision;
}
function checkMainIntegrity(endpoint,label){
  assert.ok(Math.abs(endpoint.accountingResidual)<1e-6,`${label}: physical conservation failed`);
  assert.ok(endpoint.scalarOperations<=1_000_000_000,`${label}: main op cap breached`);
}
