// Cross-task retention: pairwise (existing) vs identity (Walsh) taste code.
// Curriculum A -> B -> C -> return-A with distinct odor codebooks (disjoint
// cue patterns). Skill readout: each living fly's taste model scored on each
// family's 4 cues; discrimination = mean P(accept|good) - mean P(accept|bad).
// Retention of A = discrimination on A at end of C / at end of A (before the
// return-A phase re-exposes A). Same for B (end of C / end of B).
// Most flies die in scarce phase C, so retention pairs each fly alive at the
// end of C with that same fly's model when the family was learned.
import {writeFileSync} from 'node:fs';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {predictTargetTaste} from '../learning/odor-routed-taste.mjs';
import {makeCueCodebook} from '../learning/cue-foraging.mjs';
import {advanceRng} from '../learning/intervention-study.mjs';
const [outPath,count='32',bankSeed='20261111']=process.argv.slice(2);
let rng=Number(bankSeed)>>>0||1;const next=()=>(rng=advanceRng(rng))>>>0||1;
const histories=Array.from({length:Number(count)},()=>({seed:next(),cueSeed:next(),resourceSeeds:[next(),next(),next(),next()],probeSeeds:{A:next(),B:next(),transfer:next()}}));
function skill(checkpoint,codebook){
  // Per living fly: discrimination on each family = P(accept|good) - P(accept|bad).
  const run=OdorRoutedExperiment.restore(checkpoint),out={};
  for(const fly of run.world.flies){const s=structuredClone(run.learners[fly.id]),d={};
    for(const family of ['A','B','C']){let g=0,b=0;for(const item of codebook[family]){const p=predictTargetTaste(s,item.bits);if(item.valence>0)g+=p/2;else b+=p/2;}d[family]=g-b;}
    out[fly.id]=d;}
  return out;
}
const score=e=>({energy:e.budgetAdjustedEnergyPerFounder,survivors:e.survivors});
const arms=['pairwise','identity'],rows=[];
for(const history of histories)for(const tasteCode of arms){
  const run=new OdorRoutedExperiment({history,acquisitionGeometry:'continual',steeringMode:'learned',trainingRegime:'continuous',steeringLearner:'original',tasteCode});
  const acquisition=score(run.advance(1792)),a=run.anchors,codebook=makeCueCodebook(history.cueSeed);
  const readout=Object.fromEntries(['A','B','C','D'].map(k=>[k,a[k]?skill(a[k],codebook):null]));
  const row={seed:history.seed,tasteCode,acquisition,readout};rows.push(row);console.log(tasteCode,history.seed,'alive at C:',a.C?Object.keys(readout.C).length:0);
}
const summary={};
const avg=v=>v.length?v.reduce((s,x)=>s+x,0)/v.length:null;
for(const tasteCode of arms){
  const r=rows.filter(x=>x.tasteCode===tasteCode),out={histories:r.length};
  for(const [fam,learnedAt] of [['A','A'],['B','B']]){
    // Pair each fly alive at end of C with its own model at the end of the phase that taught fam.
    const perHistory=r.filter(x=>x.readout[learnedAt]&&x.readout.C).map(x=>{
      const ids=Object.keys(x.readout.C).filter(id=>x.readout[learnedAt][id]);
      return {before:avg(ids.map(id=>x.readout[learnedAt][id][fam])),after:avg(ids.map(id=>x.readout.C[id][fam])),flies:ids.length};
    }).filter(h=>h.flies>0&&h.before>0);
    out[fam]={historiesScored:perHistory.length,fliesScored:perHistory.reduce((s,h)=>s+h.flies,0),
      discriminationWhenLearned:avg(perHistory.map(h=>h.before)),discriminationAfterC:avg(perHistory.map(h=>h.after)),
      retention:avg(perHistory.map(h=>h.after))/avg(perHistory.map(h=>h.before)),
      historiesRetaining95pct:perHistory.filter(h=>h.after>=.95*h.before).length,
      historiesLosingAny:perHistory.filter(h=>h.after<h.before-1e-9).length};
  }
  const c=r.filter(x=>x.readout.C).map(x=>avg(Object.values(x.readout.C).map(d=>d.C))).filter(v=>v!==null);
  out.C={discriminationAtEndOfC:avg(c)};
  out.acquisitionEnergy=avg(r.map(x=>x.acquisition.energy));out.acquisitionSurvivors=avg(r.map(x=>x.acquisition.survivors));
  summary[tasteCode]=out;
}
writeFileSync(outPath,JSON.stringify({schema:1,kind:'m2-identity-retention',bankSeed,histories,rows,summary},null,2)+'\n');
console.log(JSON.stringify(summary,null,2));
