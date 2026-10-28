import {evaluateContext,CONTEXT_PROTOCOL} from '../learning/context-tasks.mjs';
import {installProjectionBasis} from '../learning/projection-actor.mjs';
import {interval95} from '../learning/tasks.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
const parent=JSON.parse(await readFile('runs/autonomy/state.json','utf8'));
const id=randomUUID(),directory=`evidence/context-learning/${id}`,offset=parseInt(id.slice(0,6),16)%30000*100000;
const sourceSha256={};for(const file of ['engine.mjs','learning/trace-actor.mjs','learning/context-tasks.mjs','learning/projection-actor.mjs','scripts/context-architecture-study.mjs'])sourceSha256[file]=createHash('sha256').update(await readFile(file)).digest('hex');
for(const file of ['engine.mjs','learning/trace-actor.mjs'])if(parent.sourceSha256[file]!==sourceSha256[file])throw Error('Reevaluate the current cue controller before architecture study');
const protocol={id,at:new Date().toISOString(),parentCueCampaign:parent.id,parameters:parent.parameters,sourceSha256,task:CONTEXT_PROTOCOL,candidates:[0,8,16,32],projectionScale:3.5,developmentSeeds:Array.from({length:10},(_,i)=>offset+i+10000),heldoutSeeds:Array.from({length:30},(_,i)=>offset+i+90000),selection:'Maximize mean per-seed minimum of A after B, B after B, and mixed-task accuracy. Break exact ties by fewer added features. Freeze count before held-out evaluation.',gates:{representationAccuracyLowerBound:.85,controlAdvantageLowerBound:.2,sequentialAccuracyLowerBound:.8,retentionLossLowerBound:-.05},interpretation:'Bounded architecture selection over engineered random nonlinear sensory-trace features. The projection weights are fixed; output weights learn from reward. Mixed-training accuracy measures representational capacity separately from sequential retention. No change to existing habitats or self-written learning algorithm.'};
await mkdir(directory,{recursive:true});await writeFile(`${directory}/protocol.json`,JSON.stringify(protocol,null,2)+'\n');
const started=performance.now(),development=[];let selected=null;
const builder=count=>(genome,seed)=>installProjectionBasis(genome,{count,seed:seed^0x92071,scale:protocol.projectionScale});
for(const count of protocol.candidates){
 const start=performance.now(),result=evaluateContext(protocol.developmentSeeds,protocol.parameters,builder(count));
 const selectionScore=result.rows.reduce((sum,row)=>sum+Math.min(row.arms.learned.afterB.a,row.arms.learned.afterB.b,row.arms.learned.afterMixed.combined),0)/result.rows.length;
 const entry={count,selectionScore,result,wallSeconds:(performance.now()-start)/1000};development.push(entry);
 if(!selected||selectionScore>selected.selectionScore)selected={count,selectionScore};
 await writeFile(`${directory}/development-${count}.json`,JSON.stringify(entry,null,2)+'\n');console.log(JSON.stringify({phase:'development',count,selectionScore,summary:result.summary}));
}
await writeFile(`${directory}/locked-selection.json`,JSON.stringify(selected,null,2)+'\n');
const candidate=evaluateContext(protocol.heldoutSeeds,protocol.parameters,builder(selected.count)),baseline=evaluateContext(protocol.heldoutSeeds,protocol.parameters,builder(0));
const difference=interval95(candidate.rows.map((row,index)=>row.arms.learned.afterMixed.combined-baseline.rows[index].arms.learned.afterMixed.combined));
const s=candidate.summary,g=protocol.gates;
const representationPassed=s.afterMixed.ci95[0]>=g.representationAccuracyLowerBound&&Object.values(s.controls).every(interval=>interval.ci95[0]>=g.controlAdvantageLowerBound);
const retentionPassed=s.aAfterB.ci95[0]>=g.sequentialAccuracyLowerBound&&s.bAfterB.ci95[0]>=g.sequentialAccuracyLowerBound&&s.aRetentionChange.ci95[0]>=g.retentionLossLowerBound;
const report={protocol,selected,development:development.map(({count,selectionScore,wallSeconds})=>({count,selectionScore,wallSeconds})),candidate,baseline,difference,representationPassed,retentionPassed,wallSeconds:(performance.now()-started)/1000};
await writeFile(`${directory}/results.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({directory,selected,representationPassed,retentionPassed,summary:s,difference},null,2));
