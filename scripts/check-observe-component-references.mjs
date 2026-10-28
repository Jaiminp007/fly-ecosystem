import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/observe-transfer-components/20261026-v1'),study=join(root,'evidence/target-taste-development/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex'),protocol=read(join(base,'protocol.json')),comparisons={};
for(const arm of protocol.arms)for(const control of ['reset','native-full'])comparisons[arm+'-vs-'+control]=[];
for(const input of protocol.inputs){
  const rowPath=join(study,'rows',input.history.seed+'.json');assert.equal(hash(readFileSync(rowPath)),input.referenceHashes.row);const old=read(rowPath),current=read(join(base,'rows',input.history.seed+'.json'));
  for(const control of ['reset','native-full']){const label=input.history.seed+'-observe-probe-transfer-'+control,path=join(study,'starts',label+'.json');assert.equal(hash(readFileSync(path)),input.referenceHashes[control]);
    const worldHash=hash(JSON.stringify(read(path).world));assert.equal(worldHash,old.arms.observe.probes['transfer-'+control].startWorldSha256);
    for(const arm of protocol.arms){assert.equal(current.arms[arm].startWorldSha256,worldHash);const candidate=current.arms[arm].endpoint,reference=old.arms.observe.probes['transfer-'+control].endpoint;
      comparisons[arm+'-vs-'+control].push({seed:input.history.seed,energy:candidate.budgetAdjustedEnergyPerFounder-reference.budgetAdjustedEnergyPerFounder,survivors:candidate.survivors-reference.survivors});}
  }
}
const summary=Object.fromEntries(Object.entries(comparisons).map(([name,values])=>[name,{meanEnergy:values.reduce((sum,value)=>sum+value.energy,0)/values.length,positiveHistories:values.filter(value=>value.energy>0).length,survivorDifference:values.reduce((sum,value)=>sum+value.survivors,0)}]));
const report={schema:1,passed:true,summary,comparisons,scope:'Same-world pre-existing reset and cheap-native controls; model arms pay 16 extra component-copy writes; post-outcome diagnostic, not new qualification.'};
writeFileSync(join(base,'reference-readback.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(summary));
