import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/steering-replay-development/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex');
const protocol=read(join(base,'protocol.json'));
const blank=()=>({decisions:0,available:0,moves:[0,0,0],midpoint:0,slowAndMidpoint:0,slowOnly:0,midpointOnly:0,neither:0,physicalCost:0,intake:0,paidExtra:0});
const phaseFeatures=(raw,contact)=>[1,...[0,1,2,3,4,10,11,13].map(index=>raw[index]*.25),contact?.25:0,raw[3]*raw[0]*.25,raw[3]*raw[13]*.25,contact?raw[13]*.25:0];
const score=(weights,features)=>weights.map(row=>row.reduce((sum,weight,index)=>sum+weight*features[index],0));
const results=[];
for(const history of protocol.histories){
  const rowPath=join(base,'rows',history.seed+'.json'),row=read(rowPath),arms={};
  for(const arm of protocol.arms){
    const prefix=history.seed+'-'+arm+'-probe-transfer-',current=read(join(base,'starts',prefix+'current.json')),reset=read(join(base,'starts',prefix+'reset.json'));
    assert.deepEqual(current.world,reset.world);
    for(const fly of reset.world.world.flies){const state=reset.state.learners[fly.id];assert.ok(state.banks.absent.weights.flat().every(value=>value===0));assert.ok(state.steering.weights.flat().every(value=>value===0));}
    const modes={};
    for(const mode of ['current','reset']){
      const label=prefix+mode,path=join(base,'traces',label+'.jsonl'),totals=blank(),stream=createReadStream(path),digest=createHash('sha256');stream.on('data',chunk=>digest.update(chunk));
      const initial=mode==='current'?current:reset;
      for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
        const event=JSON.parse(line);
        if(event.type==='decision'){
          const state=initial.state.learners[event.id],own=event.own;assert.equal(own.odorPresent,false);assert.equal(event.choice.route,'absent');assert.equal(event.choice.accept,true);
          const predictions=score(state.banks.absent.weights,phaseFeatures(own.raw,own.contactPresent));let action=2;
          for(let index=1;index>=0;index--)if(predictions[index]>predictions[action])action=index;
          assert.equal(action,event.choice.action);
          const steering=score(state.steering.weights,event.features),midpoint=event.available&&steering[1]>steering[0];assert.equal(event.steering.action,Number(midpoint));
          const slow=action!==2;totals.decisions++;totals.available+=Number(event.available);totals.moves[action]++;totals.midpoint+=Number(midpoint);
          totals[slow?(midpoint?'slowAndMidpoint':'slowOnly'):(midpoint?'midpointOnly':'neither')]++;
        }else if(event.type==='physical'){totals.physicalCost+=event.cost;totals.intake+=event.beneficialEaten;totals.paidExtra+=event.paidExtra;}
      }
      assert.equal(digest.digest('hex'),row.traces[label].sha256);modes[mode]=totals;
    }
    arms[arm]=modes;
  }
  results.push({seed:history.seed,rowSha256:hash(readFileSync(rowPath)),arms});
}
const totals={};for(const arm of protocol.arms){totals[arm]={};for(const mode of ['current','reset']){
  const result=blank();for(const row of results){const item=row.arms[arm][mode];for(const key of Object.keys(result))if(key==='moves')for(let index=0;index<3;index++)result.moves[index]+=item.moves[index];else result[key]+=item[key];}
  totals[arm][mode]=result;
}}
const report={schema:1,auditorSha256:hash(readFileSync(fileURLToPath(import.meta.url))),scope:'Post-outcome factual frozen-policy reconstruction and same-observation comparison to zeroed reset decisions. Physical aggregates arise from different interacting trajectories; no counterfactual outcome or causal attribution.',results,totals};
writeFileSync(join(base,'transfer-policy-census.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(totals));
