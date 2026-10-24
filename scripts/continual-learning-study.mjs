import {evaluateContinual,CONTINUAL_PROTOCOL} from '../learning/continual.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {randomUUID,createHash} from 'node:crypto';

const cue=JSON.parse(await readFile('runs/autonomy/state.json','utf8'));
if(cue.status!=='task-milestones-met')throw Error('Complete the independent cue gates first');
const id=randomUUID(),directory=`evidence/continual-learning/${id}`,seedOffset=parseInt(id.slice(0,8),16)>>>0;
const seeds=Array.from({length:30},(_,i)=>((seedOffset+i)>>>0)||1);
const sourceSha256={};for(const file of ['engine.mjs','learning/trace-actor.mjs','learning/continual.mjs','learning/tasks.mjs','scripts/continual-learning-study.mjs'])sourceSha256[file]=createHash('sha256').update(await readFile(file)).digest('hex');
for(const file of ['engine.mjs','learning/trace-actor.mjs'])if(cue.sourceSha256[file]!==sourceSha256[file])throw Error('Reevaluate the current model cue gates first');
const protocol={id,parentCueCampaign:cue.id,at:new Date().toISOString(),sourceSha256,seeds,parameters:cue.parameters,task:CONTINUAL_PROTOCOL,gates:{accuracyLowerBound:.8,retentionChangeLowerBound:-.05,controlAdvantageLowerBound:.2},interpretation:'One preregistered local study on fixed accepted settings. No candidate tuning or selection on these seeds. The two tasks use disjoint channels, so passing is a narrow retention result.'};
await mkdir(directory,{recursive:true});await writeFile(`${directory}/protocol.json`,JSON.stringify(protocol,null,2)+'\n');
const started=performance.now(),result=evaluateContinual(seeds,cue.parameters),s=result.summary;
const passed=s.aAfter.ci95[0]>=protocol.gates.accuracyLowerBound&&s.bAfter.ci95[0]>=protocol.gates.accuracyLowerBound&&s.aRetentionChange.ci95[0]>=protocol.gates.retentionChangeLowerBound&&Object.values(s.comparisons).every(arm=>Object.values(arm).every(interval=>interval.ci95[0]>=protocol.gates.controlAdvantageLowerBound));
const report={...result,protocol,passed,wallSeconds:(performance.now()-started)/1000};
await writeFile(`${directory}/results.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({directory,passed,summary:s},null,2));
await writeFile('runs/autonomy/continual-status.json',JSON.stringify({id,parentCueCampaign:cue.id,at:protocol.at,passed,summary:s,scope:CONTINUAL_PROTOCOL.interpretation,evidenceDirectory:directory},null,2)+'\n');
