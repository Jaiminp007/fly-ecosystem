import assert from 'node:assert/strict';
import {createReadStream,existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createGunzip,gunzipSync} from 'node:zlib';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),source=join(root,'evidence/supported-balanced-replay-development/20261026-v1'),output=join(root,'evidence/balanced-pressure-founder/20261026-v2');assert.ok(!existsSync(output));mkdirSync(output,{recursive:true});
const read=path=>JSON.parse(readFileSync(path,'utf8')),sha=data=>createHash('sha256').update(data).digest('hex'),protocol0=read(join(source,'protocol.json')),files=['scripts/balanced-pressure-founder.mjs','docs/BALANCED_PRESSURE_FOUNDER_PLAN.md'];
const protocol={schema:1,sourceProtocol:sha(readFileSync(join(source,'protocol.json'))),files:Object.fromEntries(files.map(path=>[path,sha(readFileSync(join(root,path)))])),scope:'Outcome-selected total-world founder accounting, not independent founder causal effects or qualification.'};writeFileSync(join(output,'protocol.json'),JSON.stringify(protocol,null,2)+'\n',{flag:'wx'});
const close=(left,right)=>assert.ok(Math.abs(left-right)<1e-8+1e-10*Math.max(Math.abs(left),Math.abs(right))),rows=[];
function checkpoint(path){const data=readFileSync(path);return {digest:sha(data),value:JSON.parse(gunzipSync(data).toString())};}
for(const history of protocol0.histories){const rowBytes=readFileSync(join(source,'rows',history.seed+'.json')),original=JSON.parse(rowBytes),result={seed:history.seed,rowSha256:sha(rowBytes),arms:{}};
  for(const arm of protocol0.arms){const anchors={};for(const phase of ['A','B','D'])anchors[phase]=checkpoint(join(source,'anchors',history.seed+'-'+arm+'-'+phase+'.json.gz'));
    const survivorIds=new Set(anchors.D.value.world.world.flies.map(fly=>fly.id)),founders=anchors.D.value.state.founderIds,records={};
    for(const id of founders){const alive=survivorIds.has(id),before=anchors.A.value.state.learners[id],after=anchors.B.value.state.learners[id];if(alive){assert.ok(before&&after);const count=after.cueTaste.seen-before.cueTaste.seen;assert.ok(Number.isSafeInteger(count)&&count>=0);records[id]={id,bExamples:count};}}
    const phases={};for(const phase of ['A','B']){const data={};
      for(const saved of ['A','B']){const label=history.seed+'-'+arm+'-probe-'+phase+'-'+saved,start=checkpoint(join(source,'starts',label+'.json.gz')),final=checkpoint(join(source,'finals',label+'.json.gz')),trace=original.traces[label],endpoint=original.arms[arm].probes[phase+'-'+saved].endpoint,digest=createHash('sha256'),stream=createReadStream(join(source,'traces',label+'.jsonl.gz')).pipe(createGunzip());stream.on('data',chunk=>digest.update(chunk));
        const intake={};let events=0;for await(const line of createInterface({input:stream,crlfDelay:Infinity})){const event=JSON.parse(line);events++;if(event.type==='physical')intake[event.agentId]=(intake[event.agentId]??0)+event.beneficialEaten-event.toxinDamage;}
        assert.equal(events,trace.events);assert.equal(digest.digest('hex'),trace.sha256);const physical=Object.fromEntries(final.value.world.world.flies.map(fly=>[fly.id,fly.energy])),energy={};let total=0;
        for(const id of founders){energy[id]=(physical[id]??0)-final.value.state.learners[id].charge.outstandingEnergy;total+=energy[id];}
        close((total-start.value.state.startingEnergy+start.value.state.startingDebt)/founders.length,endpoint.budgetAdjustedEnergyPerFounder);const stats=endpoint.statistics[phase]??{intake:0,toxin:0};close(Object.values(intake).reduce((sum,value)=>sum+value,0),stats.intake-stats.toxin);
        data[saved]={startHash:start.digest,finalHash:final.digest,traceHash:trace.sha256,world:start.value.world,startingEnergy:start.value.state.startingEnergy,startingDebt:start.value.state.startingDebt,energy,intake};
      }
      assert.deepEqual(data.A.world,data.B.world);close(data.A.startingEnergy,data.B.startingEnergy);close(data.A.startingDebt,data.B.startingDebt);
      const direction=phase==='A'?1:-1,founderRows=[];for(const id of founders){const energy=direction*(data.A.energy[id]-data.B.energy[id]),net=direction*((data.A.intake[id]??0)-(data.B.intake[id]??0));if(survivorIds.has(id))founderRows.push({...records[id],energy,net});else{close(energy,0);close(net,0);}}
      const endpointA=original.arms[arm].probes[phase+'-A'].endpoint,endpointB=original.arms[arm].probes[phase+'-B'].endpoint;close(founderRows.reduce((sum,item)=>sum+item.energy,0)/founders.length,direction*(endpointA.budgetAdjustedEnergyPerFounder-endpointB.budgetAdjustedEnergyPerFounder));
      const totalsA=endpointA.statistics[phase]??{intake:0,toxin:0},totalsB=endpointB.statistics[phase]??{intake:0,toxin:0};close(founderRows.reduce((sum,item)=>sum+item.net,0)/founders.length,direction*((totalsA.intake-totalsA.toxin)-(totalsB.intake-totalsB.toxin))/founders.length);
      phases[phase]={inputs:Object.fromEntries(['A','B'].map(key=>[key,{startHash:data[key].startHash,finalHash:data[key].finalHash,traceHash:data[key].traceHash}])),founders:founderRows};
    }
    result.arms[arm]={anchorHashes:Object.fromEntries(['A','B','D'].map(key=>[key,anchors[key].digest])),phases};
  }
  writeFileSync(join(output,history.seed+'.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});rows.push(result);console.log(JSON.stringify({seed:history.seed}));
}
const groups={};for(const arm of protocol0.arms){groups[arm]={};for(const phase of ['A','B']){groups[arm][phase]={};for(const group of ['withB','withoutB']){const entries=rows.flatMap(row=>row.arms[arm].phases[phase].founders).filter(item=>group==='withB'?item.bExamples>0:item.bExamples===0),sum=metric=>entries.reduce((total,item)=>total+item[metric],0);groups[arm][phase][group]={count:entries.length,energyTotal:sum('energy'),energyMean:entries.length?sum('energy')/entries.length:null,netTotal:sum('net'),netMean:entries.length?sum('net')/entries.length:null,positive:entries.filter(item=>item.energy>1e-9).length,negative:entries.filter(item=>item.energy< -1e-9).length,tied:entries.filter(item=>Math.abs(item.energy)<=1e-9).length};}}}
writeFileSync(join(output,'results.json'),JSON.stringify({schema:1,groups,scope:protocol.scope},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({groups}));
