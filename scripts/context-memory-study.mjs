import {evaluateContext,CONTEXT_PROTOCOL} from '../learning/context-tasks.mjs';
import {installProjectionBasis} from '../learning/projection-actor.mjs';
import {interval95} from '../learning/tasks.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
const parent=JSON.parse(await readFile('runs/autonomy/state.json','utf8'));
const id=randomUUID(),directory=`evidence/context-learning/${id}`,offset=parseInt(id.slice(0,6),16)%30000*100000;
const sourceSha256={};for(const file of ['engine.mjs','learning/trace-actor.mjs','learning/episodic.mjs','learning/context-tasks.mjs','learning/projection-actor.mjs','scripts/context-memory-study.mjs'])sourceSha256[file]=createHash('sha256').update(await readFile(file)).digest('hex');
for(const file of ['engine.mjs','learning/trace-actor.mjs'])if(parent.sourceSha256[file]!==sourceSha256[file])throw Error('Reevaluate current cue controller before context study');
const protocol={id,at:new Date().toISOString(),parentCueCampaign:parent.id,parameters:parent.parameters,sourceSha256,task:CONTEXT_PROTOCOL,candidates:[32,64,128],memory:{neighbors:8,bandwidth:.25,maxDistance:.6,exploration:.1,replacement:'reservoir'},developmentSeeds:Array.from({length:10},(_,i)=>offset+i+10000),heldoutSeeds:Array.from({length:30},(_,i)=>offset+i+90000),selection:'Maximize mean per-seed minimum of A after B, B after B, and mixed accuracy; exact ties prefer smaller experience capacity. Lock capacity before held-out evaluation.',gates:{representationAccuracyLowerBound:.85,controlAdvantageLowerBound:.2,sequentialAccuracyLowerBound:.8,retentionLossLowerBound:-.05},comparators:['existing neural readout','fixed 16-feature nonlinear readout','same-capacity FIFO episodic memory'],interpretation:'Experimental discrete-action memory retrieval using actual stored observations/actions/rewards. No task mapping or correct-answer labels enter the memory. This is a fixed human-written memory algorithm and bounded capacity selection, not RSI. Task version 2 uses one cue observation so amplitude differences are not hidden by trace saturation.',references:['https://arxiv.org/abs/1606.04460','https://proceedings.mlr.press/v70/pritzel17a.html']};
await mkdir(directory,{recursive:true});await writeFile(`${directory}/protocol.json`,JSON.stringify(protocol,null,2)+'\n');
const started=performance.now(),development=[];let selected;
for(const capacity of protocol.candidates){
 const start=performance.now(),result=evaluateContext(protocol.developmentSeeds,protocol.parameters,undefined,{...protocol.memory,capacity});
 const selectionScore=result.rows.reduce((sum,row)=>sum+Math.min(row.arms.learned.afterB.a,row.arms.learned.afterB.b,row.arms.learned.afterMixed.combined),0)/result.rows.length;
 const entry={capacity,selectionScore,wallSeconds:(performance.now()-start)/1000,result};development.push(entry);
 if(!selected||selectionScore>selected.selectionScore)selected={capacity,selectionScore};
 await writeFile(`${directory}/development-${capacity}.json`,JSON.stringify(entry,null,2)+'\n');console.log(JSON.stringify({phase:'development',capacity,selectionScore,summary:result.summary}));
}
await writeFile(`${directory}/locked-selection.json`,JSON.stringify(selected,null,2)+'\n');
const profiles={reservoir:{memory:{...protocol.memory,capacity:selected.capacity}},fifo:{memory:{...protocol.memory,capacity:selected.capacity,replacement:'fifo'}},neural:{},projection:{build:(genome,seed)=>installProjectionBasis(genome,{count:16,seed:seed^0x92071,scale:3.5})}};
const heldout={};for(const[name,profile]of Object.entries(profiles)){const start=performance.now();heldout[name]=evaluateContext(protocol.heldoutSeeds,protocol.parameters,profile.build,profile.memory);heldout[name].wallSeconds=(performance.now()-start)/1000;await writeFile(`${directory}/heldout-${name}.json`,JSON.stringify(heldout[name],null,2)+'\n');console.log(JSON.stringify({phase:'heldout',profile:name,summary:heldout[name].summary}));}
const s=heldout.reservoir.summary,g=protocol.gates;
const representationPassed=s.afterMixed.ci95[0]>=g.representationAccuracyLowerBound&&Object.values(s.controls).every(interval=>interval.ci95[0]>=g.controlAdvantageLowerBound);
const retentionPassed=s.aAfterB.ci95[0]>=g.sequentialAccuracyLowerBound&&s.bAfterB.ci95[0]>=g.sequentialAccuracyLowerBound&&s.aRetentionChange.ci95[0]>=g.retentionLossLowerBound;
const differences=Object.fromEntries(['fifo','neural','projection'].map(name=>[name,{aRetention:interval95(heldout.reservoir.rows.map((row,index)=>row.arms.learned.afterB.a-heldout[name].rows[index].arms.learned.afterB.a)),afterMixed:interval95(heldout.reservoir.rows.map((row,index)=>row.arms.learned.afterMixed.combined-heldout[name].rows[index].arms.learned.afterMixed.combined))}]));
const report={protocol,selected,development:development.map(({capacity,selectionScore,wallSeconds})=>({capacity,selectionScore,wallSeconds})),heldout,differences,representationPassed,retentionPassed,wallSeconds:(performance.now()-started)/1000};
await writeFile(`${directory}/results.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({directory,selected,representationPassed,retentionPassed,summary:s,differences},null,2));
