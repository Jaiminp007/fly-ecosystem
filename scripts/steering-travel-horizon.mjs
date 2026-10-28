import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync,mkdirSync,existsSync,openSync,writeSync,closeSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {GEOMETRY_MODELS,steeringGeometryContext,steeringGeometryFeatures,createSteeringGeometryPredictor,predictSteeringGeometry,trainSteeringGeometry} from '../learning/steering-geometry-information.mjs';
import {createFactualHorizon,observeFactualDecision,terminateFactualHorizon,censorFactualHorizon} from '../learning/factual-horizon.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/steering-replay-development/20261026-v1'),output=join(root,'evidence/steering-travel-horizon/20261026-v1');
assert.ok(!existsSync(output));
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=data=>createHash('sha256').update(data).digest('hex');
const write=(path,value)=>{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const development=read(join(base,'protocol.json')),inputs=[];
for(const history of development.histories){
  const path=join(base,'rows',history.seed+'.json'),row=read(path),labels={A:history.seed+'-replay-acquire-A',B:history.seed+'-replay-acquire-B',C:history.seed+'-replay-acquire-C',transfer:history.seed+'-replay-probe-transfer-current'};
  inputs.push({history,rowSha256:hash(readFileSync(path)),labels:Object.fromEntries(Object.entries(labels).map(([phase,label])=>[phase,{label,sha256:row.traces[label].sha256}]))});
}
const names=['scripts/steering-travel-horizon.mjs','learning/factual-horizon.mjs','learning/steering-geometry-information.mjs','tests/factual-horizon.test.mjs','docs/STEERING_TRAVEL_HORIZON_DESIGN.md'];
const sources=Object.fromEntries(names.map(name=>[name,hash(readFileSync(join(root,name)))]));
const protocol={schema:1,kind:'steering-travel-horizon',horizon:16,models:GEOMETRY_MODELS,inputs,sourceSha256:sources,
  rule:'Geometry lower mean per-history MSE and >=6/8 histories versus both controls on C and transfer.',scope:'Own factual future return prediction, not action-causal value, embodied policy or fresh qualification.'};
write(join(output,'protocol.json'),protocol);for(const name of names){const path=join(output,'sources',name);mkdirSync(dirname(path),{recursive:true});writeFileSync(path,readFileSync(join(root,name)),{flag:'wx'});}
const rows=[];
for(const input of inputs){
  const models={},previous={},stats={},counts={},recordHashes={};let savedPrevious,savedWeights;
  const body=id=>models[id]??=Object.fromEntries(GEOMETRY_MODELS.map(mode=>[mode,createSteeringGeometryPredictor(id,mode)]));
  for(const phase of ['A','B','C','transfer']){
    if(phase==='C'){savedPrevious=structuredClone(previous);for(const group of Object.values(models))for(const state of Object.values(group))state.frozen=true;
      savedWeights=hash(JSON.stringify(Object.values(models).map(group=>Object.values(group).map(state=>state.weights))));}
    if(phase==='transfer'){for(const key of Object.keys(previous))delete previous[key];Object.assign(previous,structuredClone(savedPrevious));}
    const train=phase==='A'||phase==='B',horizons={},statistics=stats[phase]=Object.fromEntries(GEOMETRY_MODELS.map(mode=>[mode,{count:0,squaredError:0,actions:[0,0]}]));
    counts[phase]={terminalRecords:0,censored:0,trainingByFounder:{}};
    const label=input.labels[phase].label,path=join(output,'records',input.history.seed+'-'+phase+'.jsonl');mkdirSync(dirname(path),{recursive:true});
    const fd=openSync(path,'wx'),outHash=createHash('sha256'),inHash=createHash('sha256');
    const complete=records=>{for(const {prior,target,terminal}of records){
      const predictions={};for(const mode of GEOMETRY_MODELS){const state=body(prior.agentId)[mode],record={agentId:prior.agentId,action:prior.action,phi:prior.phis[mode],target};
        const prediction=train?trainSteeringGeometry(state,record):predictSteeringGeometry(state,record);predictions[mode]=prediction;
        if(!train){statistics[mode].count++;statistics[mode].actions[prior.action]++;statistics[mode].squaredError+=(prediction-target)**2;}}
      if(train)counts[phase].trainingByFounder[prior.agentId]=(counts[phase].trainingByFounder[prior.agentId]??0)+1;
      if(terminal)counts[phase].terminalRecords++;
      const line=JSON.stringify({...prior,target,terminal,predictions})+'\n';writeSync(fd,line);outHash.update(line);
    }};
    try{
      const stream=createReadStream(join(base,'traces',label+'.jsonl'));stream.on('data',chunk=>inHash.update(chunk));
      for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
        const event=JSON.parse(line);
        if(event.type==='decision'){
          const id=event.id;body(id);const current=steeringGeometryContext(event.recommendation),delayed=previous[id]??[0,0,0];
          const decision={agentId:id,tick:event.tick,energy:event.own.energy,action:event.steering.action,features:event.features,current,delayed,
            phis:Object.fromEntries(GEOMETRY_MODELS.map(mode=>[mode,steeringGeometryFeatures(event.features,current,delayed,mode)]))};
          horizons[id]??=createFactualHorizon(id,protocol.horizon);complete(observeFactualDecision(horizons[id],decision));previous[id]=current;
        }else if(event.type==='observe'&&event.own.terminal)complete(terminateFactualHorizon(horizons[event.own.agentId],event.own));
      }
    }finally{closeSync(fd);}
    assert.equal(inHash.digest('hex'),input.labels[phase].sha256);counts[phase].censored=Object.values(horizons).reduce((sum,state)=>sum+censorFactualHorizon(state),0);recordHashes[phase]=outHash.digest('hex');
    if(!train)assert.equal(hash(JSON.stringify(Object.values(models).map(group=>Object.values(group).map(state=>state.weights)))),savedWeights);
    for(const value of Object.values(statistics))value.mse=value.count?value.squaredError/value.count:null;
  }
  const row={seed:input.history.seed,statistics:stats,counts,recordHashes,savedWeights};write(join(output,'rows',input.history.seed+'.json'),row);write(join(output,'models',input.history.seed+'.json'),models);rows.push(row);
  console.log(JSON.stringify({seed:row.seed,C:stats.C,transfer:stats.transfer}));
}
for(const [name,expected]of Object.entries(sources))assert.equal(hash(readFileSync(join(root,name))),expected);
const comparisons=Object.fromEntries(['C','transfer'].map(phase=>[phase,Object.fromEntries(['base','delayed'].map(control=>{
  const differences=rows.map(row=>row.statistics[phase].geometry.mse===null||row.statistics[phase][control].mse===null?null:row.statistics[phase].geometry.mse-row.statistics[phase][control].mse);
  return [control,{differences,meanDifference:differences.every(Number.isFinite)?differences.reduce((sum,value)=>sum+value,0)/8:null,improvedHistories:differences.filter(value=>value!==null&&value<0).length}];
}))]));
const result={schema:1,qualified:false,comparisons,promisingInformation:Object.values(comparisons).every(group=>Object.values(group).every(value=>value.meanDifference!==null&&value.meanDifference<0&&value.improvedHistories>=6))};
write(join(output,'results.json'),result);console.log(JSON.stringify(result));
