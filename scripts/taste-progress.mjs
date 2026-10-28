// Cheap status readback: no simulation, audits, seed opening or evidence edits.
import {readdirSync,readFileSync,existsSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
const root=resolve('evidence/taste-development');
const read=file=>JSON.parse(readFileSync(file,'utf8'));
const reports=[];
for(const name of readdirSync(root).filter(n=>/^attempt-\d+/.test(n)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}))){
  const directory=join(root,name),path=join(directory,'results.json');if(!existsSync(path))continue;
  const result=read(path),attempt=read(join(directory,'attempt.json'));
  const rows=readdirSync(join(directory,'rows')).filter(n=>n.endsWith('.json')).map(n=>read(join(directory,'rows',n)));
  reports.push({attempt:name,histories:result.histories,founders:rows.reduce((n,r)=>n+r.arms.candidate.endpoint.founders,0),
    survivors:Object.fromEntries(attempt.arms.map(arm=>[arm,rows.reduce((n,r)=>n+r.arms[arm].endpoint.survivors,0)])),
    energyOverControls:Object.fromEntries(Object.entries(result.controlComparisons??{}).map(([k,v])=>[k,v.mean])),
    retention:result.retention?Object.fromEntries(Object.entries(result.retention).map(([k,v])=>[k,{ratio:v.savedMean>0?v.retainedMean/v.savedMean:null,survivorDifference:v.survivorDifference}])):null,
    transfer:result.transferControls??result.transfer??null,pressure:result.pressure??null,runtime:result.runtime,
    qualified:result.qualified,scope:result.scope});
}
const status={kind:'taste-development-status',generatedAt:new Date().toISOString(),fullProjectComplete:false,
  remaining:['Joint retention, survival and transfer development success','Fresh fixed qualification and functional-pressure evidence','Successive persistent autonomous revisions and causal search-productivity evidence'],reports};
const index=process.argv.indexOf('--output');if(index>=0)writeFileSync(process.argv[index+1],JSON.stringify(status,null,2)+'\n',{flag:'wx'});
if(process.argv.includes('--json'))console.log(JSON.stringify(status));
else{
  console.table(reports.map(r=>({attempt:r.attempt,histories:r.histories,survivors:`${r.survivors.candidate}/${r.founders}`,
    frozenGain:r.energyOverControls.frozen?.toFixed(3)??'-',resetGain:r.energyOverControls.reset?.toFixed(3)??'-',
    A:r.retention?.A?.ratio?.toFixed(3)??'-',B:r.retention?.B?.ratio?.toFixed(3)??'-',
    transferReset:(r.transfer?.reset?.mean??r.transfer?.mean)?.toFixed(3)??'-',transferCruise:r.transfer?.acceptCruise?.mean?.toFixed(3)??'-',seconds:r.runtime.wallSeconds.toFixed(1)})));
  console.log('Exploratory/tuned development only. Full project remains incomplete.');
}
