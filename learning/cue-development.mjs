import assert from 'node:assert/strict';
import {CUE_ARMS,CUE_PROBES,simulateCueArm,runCueProbe} from './cue-foraging.mjs';
import {pairedSignFlip} from './self-modifying-tasks.mjs';

export const CUE_CONTRASTS=[
  {id:'B-acquisition',terms:[['B:B',1],['B:A',-1]]},
  {id:'C-acquisition',terms:[['C:C',1],['C:B',-1]]},
  ...['incumbent','accept','refuse','slowAccept','tasteReflex','cueBlind','shuffled','fastOnly','linear','frozen','reset'].map(main=>({id:`sequence-${main}`,main})),
  {id:'A-initial-skill',terms:[['A:A',1],['A:reset',-1]]},
  {id:'B-initial-skill',terms:[['B:B',1],['B:reset',-1]]},
  {id:'A-retention',terms:[['A:C',1],['A:A',-.95],['A:reset',-.05]]},
  {id:'B-retention',terms:[['B:C',1],['B:B',-.95],['B:reset',-.05]]},
  {id:'transfer-reset',terms:[['transfer:C',1],['transfer:reset',-1]]},
  {id:'transfer-accept',terms:[['transfer:C',1],['transfer:accept',-1]]},
  {id:'null-equivalence',null:true},
  {id:'trace-contribution',main:'lambda0',optional:true}
];
export function cueEffect(row,c){
  if(c.null)return row.arms.nullCandidate.endpoint.budgetAdjustedEnergyPerFounder-row.arms.nullBlind.endpoint.budgetAdjustedEnergyPerFounder;
  if(c.main)return row.arms.candidate.endpoint.budgetAdjustedEnergyPerFounder-row.arms[c.main].endpoint.budgetAdjustedEnergyPerFounder;
  return c.terms.reduce((s,[key,w])=>{const v=row.probes.find(v=>`${v.family}:${v.version}`===key);assert.ok(v);return s+w*v.value;},0);
}
export function validateCueProtocol(p){
  assert.equal(p.experiment,'fixed-cue-learning-development-v1');assert.deepEqual(p.arms,CUE_ARMS);assert.deepEqual(p.probes,CUE_PROBES);assert.deepEqual(p.contrasts,CUE_CONTRASTS);
  assert.equal(p.developmentHistories.length,8);assert.equal(p.confirmationHistories.length,16);assert.equal(p.reference.founders,24);
  const seeds=[...p.developmentHistories,...p.confirmationHistories].flatMap(h=>[h.seed,h.cueSeed,...h.resourceSeeds,h.shuffleSeed,h.nullSeed,...Object.values(h.probeSeeds)]);
  assert.equal(seeds.length,288);assert.equal(new Set(seeds).size,288);assert.ok(seeds.every(s=>s>0&&!p.excludedSeeds.includes(s)));
  assert.equal(p.alphaPerTest,.05/CUE_CONTRASTS.length);assert.equal(p.minimumReuse,.5);assert.equal(p.nullMargin,.5);
  assert.deepEqual(p.budget,{developmentWorlds:224,confirmationWorlds:448,totalWorlds:672,totalCollectionWorldSteps:24*(15*1792+13*256)});
}
export function simulateCueHistory(p,h,phase,emit=()=>{}){
  const arms={};let atC;
  for(const arm of p.arms){const result=simulateCueArm(p,h,arm,emit);arms[arm]=result.row;if(arm==='candidate')atC=result.atC;}
  const probes=p.probes.map(spec=>runCueProbe(atC,spec,h.probeSeeds[spec.family],p.reference.founders));
  return {schema:1,history:h,phase,arms,probes};
}
export function validateCueRow(row,h,p,phase){
  assert.deepEqual(row.history,h);assert.equal(row.phase,phase);assert.deepEqual(Object.keys(row.arms),p.arms);
  assert.deepEqual(row.probes.map(v=>({family:v.family,version:v.version})),p.probes);
  for(const arm of p.arms){const r=row.arms[arm],e=r.endpoint;assert.equal(r.arm,arm);assert.equal(e.founders,p.reference.founders);assert.equal(r.learners.length,e.founders);
    assert.ok(e.tick===1792||e.survivors===0);assert.ok(Number.isFinite(e.budgetAdjustedEnergyPerFounder)&&Math.abs(e.accountingResidual)<1e-6);}
  for(const probe of row.probes){assert.equal(probe.founders,p.reference.founders);assert.equal(probe.resourceSeed,h.probeSeeds[probe.family]);assert.ok(Number.isFinite(probe.value));if(!probe.skippedAllDead)assert.ok(probe.acquisitionDisabled&&probe.learnedWeightsUnchanged);}
  for(const family of ['A','B','C','transfer'])assert.ok(new Set(row.probes.filter(v=>v.family===family&&!v.skippedAllDead).map(v=>v.startWorldSha256)).size<=1);
}
export function scoreCueRows(rows,p,phase){
  const histories=phase==='development'?p.developmentHistories:p.confirmationHistories,n=histories.length;assert.equal(rows.length,n);rows.forEach((r,i)=>validateCueRow(r,histories[i],p,phase));
  const comparisons=p.contrasts.map(c=>{const effects=rows.map(r=>cueEffect(r,c)),paired=pairedSignFlip(effects),se=Math.sqrt(effects.reduce((s,v)=>s+(v-paired.mean)**2,0)/(n-1)/n),
    critical=c.null?p.equivalenceCritical[phase]:p.critical[phase],lower=paired.mean-critical*se,upper=paired.mean+critical*se,
    developmentPass=c.null?Math.abs(paired.mean)<p.nullMargin:paired.mean>0,
    confirmationPass=c.null?lower>-p.nullMargin&&upper<p.nullMargin:lower>0&&paired.pOneSided<=p.alphaPerTest;
    return {...c,...paired,effects,se,lower,upper,developmentPass,confirmationPass};});
  const survival=p.arms.filter(a=>!['candidate','nullCandidate','nullBlind'].includes(a)).map(control=>{const effects=rows.map(r=>r.arms.candidate.endpoint.survival-r.arms[control].endpoint.survival),
    mean=effects.reduce((s,v)=>s+v,0)/n,se=Math.sqrt(effects.reduce((s,v)=>s+(v-mean)**2,0)/(n-1)/n);return {control,effects,mean,ci95:[mean-p.descriptiveCritical[phase]*se,mean+p.descriptiveCritical[phase]*se],passed:mean>=0};});
  const pressure=rows.map(r=>{const v=r.arms.candidate.pressure;return {seed:r.history.seed,...v,passed:v.aReuse>=p.minimumReuse&&v.bReuse>=p.minimumReuse&&v.bodiesOverReceiptCapacity>=p.reference.founders/2};});
  const activity=rows.map(r=>{const ds=r.arms.candidate.learners.map(s=>s.plasticityDiagnostics),sum=k=>ds.reduce((s,v)=>s+v[k],0),updates=sum('updates'),fraction=updates?sum('nonzeroDopamine')/updates:0;
    return {seed:r.history.seed,updates,fraction,absoluteTransfer:sum('absoluteTransfer'),passed:updates>0&&fraction>=.5&&sum('absoluteTransfer')>0};});
  const common=survival.every(v=>v.passed)&&pressure.every(v=>v.passed)&&activity.every(v=>v.passed);
  return {schema:1,phase,histories:n,comparisons,survival,pressure,activity,promising:phase==='development'?common&&comparisons.filter(c=>!c.optional).every(c=>c.developmentPass):null,
    qualified:phase==='confirmation'&&common&&comparisons.filter(c=>!c.optional).every(c=>c.confirmationPass),
    boundary:'One human-proposed fixed circuit on a fixed cue environment. Passing conditioning is not autonomous algorithm revision or RSI. Original-ecology transfer gates cannot be replaced with a conditioning-only claim.'};
}
