import {evaluateContext,evaluateContextSeed} from '../learning/context-tasks.mjs';
import {installProjectionBasis} from '../learning/projection-actor.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
const referencePath=process.argv[2];if(!referencePath)throw Error('Provide a context-memory results.json');
const reference=JSON.parse(await readFile(referencePath,'utf8')),p=reference.protocol,directory=join(dirname(resolve(referencePath)),'compatibility-replay');
if(!reference.heldout?.reservoir||p.task.version!==2)throw Error('Expected a version 2 context-memory study');
await mkdir(directory,{recursive:true});
const sourceSha256={};for(const file of ['engine.mjs','learning/trace-actor.mjs','learning/context-tasks.mjs','learning/episodic.mjs','learning/projection-actor.mjs','scripts/replay-context-study.mjs']){
 const data=await readFile(file);sourceSha256[file]=createHash('sha256').update(data).digest('hex');await mkdir(join(directory,'sources',dirname(file)),{recursive:true});await writeFile(join(directory,'sources',file),data);
}
const profiles={reservoir:{memory:{...p.memory,capacity:reference.selected.capacity}},fifo:{memory:{...p.memory,capacity:reference.selected.capacity,replacement:'fifo'}},neural:{},projection:{build:(genome,seed)=>installProjectionBasis(genome,{count:16,seed:seed^0x92071,scale:3.5})}};
const started=performance.now(),replayed={};
const outcomes=result=>result.rows.map(row=>({seed:row.seed,arms:Object.fromEntries(Object.entries(row.arms).map(([name,arm])=>[name,Object.fromEntries(Object.entries(arm).filter(([key])=>key!=='memoryBytes'))]))}));
for(const[name,profile]of Object.entries(profiles)){
 const result=evaluateContext(p.heldoutSeeds,p.parameters,profile.build,profile.memory);
 if(!isDeepStrictEqual(outcomes(result),outcomes(reference.heldout[name])))throw Error(`Behavioral mismatch for ${name}`);
 replayed[name]=result;console.log(JSON.stringify({profile:name,exactOutcomeMatch:true}));
}
const example=evaluateContextSeed(p.heldoutSeeds[0],p.parameters,undefined,profiles.reservoir.memory,{captureLimit:16});
const expected=reference.heldout.reservoir.rows[0];for(const key of ['beforeB','afterB','afterMixed'])if(!isDeepStrictEqual(example.arms.learned[key],expected.arms.learned[key]))throw Error('Decision capture changed learning outcomes');
await writeFile(join(directory,'agent-example.json'),JSON.stringify({protocol:p,selected:reference.selected,...example,sourceSha256},null,2)+'\n');
const report={at:new Date().toISOString(),referencePath:resolve(referencePath),referenceSha256:createHash('sha256').update(await readFile(referencePath)).digest('hex'),sourceSha256,exactOutcomeMatch:true,scope:'Same-seed compatibility replay after adding inspection and experience sequence metadata. This is not a new independent statistical replication. Every reported score and experience count is compared; serialized byte size is allowed to change with added metadata.',replayed,wallSeconds:(performance.now()-started)/1000};
await writeFile(join(directory,'results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({directory,exactOutcomeMatch:true}));
