import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync,mkdirSync,existsSync,openSync,writeSync,closeSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {GEOMETRY_MODELS,steeringGeometryContext,steeringGeometryFeatures,createSteeringGeometryPredictor,predictSteeringGeometry,trainSteeringGeometry} from '../learning/steering-geometry-information.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/steering-replay-development/20261026-v1'),output=join(root,'evidence/steering-geometry-information/20261026-v1');
assert.ok(!existsSync(output));
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=value=>createHash('sha256').update(value).digest('hex');
const write=(path,value)=>{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const development=read(join(base,'protocol.json')),inputs=[];
for(const history of development.histories){
  const rowPath=join(base,'rows',history.seed+'.json'),row=read(rowPath),labels={A:history.seed+'-replay-acquire-A',B:history.seed+'-replay-acquire-B',C:history.seed+'-replay-acquire-C',transfer:history.seed+'-replay-probe-transfer-current'};
  inputs.push({history,rowSha256:hash(readFileSync(rowPath)),labels:Object.fromEntries(Object.entries(labels).map(([phase,label])=>[phase,{label,sha256:row.traces[label].sha256}]))});
}
const names=['scripts/steering-geometry-information.mjs','scripts/check-steering-geometry-information.mjs','learning/steering-geometry-information.mjs','tests/steering-geometry-information.test.mjs','docs/STEERING_GEOMETRY_INFORMATION_DESIGN.md'];
const sources=Object.fromEntries(names.map(name=>[name,hash(readFileSync(join(root,name)))]));
const protocol={schema:1,kind:'steering-geometry-information',inputs,sourceSha256:sources,models:GEOMETRY_MODELS,
  rule:'Geometry lower mean MSE and >=6/8 histories versus base and delayed on each of C and transfer.',scope:'Fixed offline factual own-history prediction, not control or fresh qualification.'};
write(join(output,'protocol.json'),protocol);
for(const name of names){const path=join(output,'sources',name);mkdirSync(dirname(path),{recursive:true});writeFileSync(path,readFileSync(join(root,name)),{flag:'wx'});}
const rows=[];
for(const input of inputs){
  const models={},previous={},counts={},statistics={},recordHashes={};
  const body=id=>models[id]??=Object.fromEntries(GEOMETRY_MODELS.map(mode=>[mode,createSteeringGeometryPredictor(id,mode)]));
  let savedPrevious=null,savedWeights=null;
  for(const phase of ['A','B','C','transfer']){
    if(phase==='C'){
      savedPrevious=structuredClone(previous);for(const state of Object.values(models))for(const predictor of Object.values(state))predictor.frozen=true;
      savedWeights=hash(JSON.stringify(Object.values(models).map(group=>Object.values(group).map(predictor=>predictor.weights))));
    }
    if(phase==='transfer'){for(const key of Object.keys(previous))delete previous[key];Object.assign(previous,structuredClone(savedPrevious));}
    const train=phase==='A'||phase==='B',pending={},stats=statistics[phase]=Object.fromEntries(GEOMETRY_MODELS.map(mode=>[mode,{count:0,squaredError:0,actions:[0,0]}]));
    counts[phase]={censored:0,terminal:0,trainingByFounder:{}};
    const label=input.labels[phase].label,path=join(output,'records',input.history.seed+'-'+phase+'.jsonl');mkdirSync(dirname(path),{recursive:true});
    const fd=openSync(path,'wx'),outHash=createHash('sha256'),inHash=createHash('sha256');
    const complete=(prior,energy,terminal)=>{
      const id=prior.agentId,target=(energy-prior.energy)/120,predictions={};assert.ok(Number.isFinite(target));
      for(const mode of GEOMETRY_MODELS){
        const predictor=body(id)[mode],record={agentId:id,action:prior.action,phi:prior.phis[mode],target};
        const prediction=train?trainSteeringGeometry(predictor,record):predictSteeringGeometry(predictor,record);
        if(!train){stats[mode].count++;stats[mode].actions[prior.action]++;stats[mode].squaredError+=(prediction-target)**2;}
        predictions[mode]=prediction;
      }
      if(train)counts[phase].trainingByFounder[id]=(counts[phase].trainingByFounder[id]??0)+1;
      if(terminal)counts[phase].terminal++;
      const line=JSON.stringify({...prior,target,terminal,predictions})+'\n';writeSync(fd,line);outHash.update(line);
    };
    try{
      const stream=createReadStream(join(base,'traces',label+'.jsonl'));stream.on('data',chunk=>inHash.update(chunk));
      for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
        const event=JSON.parse(line);
        if(event.type==='decision'){
          const id=event.id;body(id);if(pending[id]){assert.equal(event.tick,pending[id].tick+1);complete(pending[id],event.own.energy,false);}
          const current=steeringGeometryContext(event.recommendation),delayed=previous[id]??[0,0,0];
          pending[id]={agentId:id,tick:event.tick,energy:event.own.energy,action:event.steering.action,features:event.features,current,delayed,
            phis:Object.fromEntries(GEOMETRY_MODELS.map(mode=>[mode,steeringGeometryFeatures(event.features,current,delayed,mode)]))};
          previous[id]=current;
        }else if(event.type==='observe'&&event.own.terminal){const own=event.own;assert.equal(pending[own.agentId].tick,own.tick);complete(pending[own.agentId],own.energy,true);delete pending[own.agentId];}
      }
    }finally{closeSync(fd);}
    assert.equal(inHash.digest('hex'),input.labels[phase].sha256);counts[phase].censored=Object.keys(pending).length;recordHashes[phase]=outHash.digest('hex');
    if(!train)assert.equal(hash(JSON.stringify(Object.values(models).map(group=>Object.values(group).map(predictor=>predictor.weights)))),savedWeights);
    for(const value of Object.values(stats))value.mse=value.count?value.squaredError/value.count:null;
  }
  const row={seed:input.history.seed,statistics,counts,recordHashes,savedWeights,scalarOperations:Object.values(models).reduce((sum,group)=>sum+Object.values(group).reduce((total,state)=>total+state.scalarOperations,0),0),parameterBytes:Object.values(models).reduce((sum,group)=>sum+Object.values(group).reduce((total,state)=>total+2*state.weights[0].length*8,0),0)};
  write(join(output,'models',input.history.seed+'.json'),models);write(join(output,'rows',input.history.seed+'.json'),row);rows.push(row);console.log(JSON.stringify({seed:row.seed,statistics:row.statistics}));
}
for(const [name,expected]of Object.entries(sources))assert.equal(hash(readFileSync(join(root,name))),expected);
const comparisons=Object.fromEntries(['C','transfer'].map(phase=>[phase,Object.fromEntries(['base','delayed'].map(control=>{
  const differences=rows.map(row=>row.statistics[phase].geometry.mse===null||row.statistics[phase][control].mse===null?null:row.statistics[phase].geometry.mse-row.statistics[phase][control].mse);
  return [control,{differences,meanDifference:differences.every(Number.isFinite)?differences.reduce((sum,value)=>sum+value,0)/8:null,improvedHistories:differences.filter(value=>value!==null&&value<0).length}];
}))]));
const result={schema:1,qualified:false,comparisons,promisingInformation:Object.values(comparisons).every(group=>Object.values(group).every(value=>value.meanDifference!==null&&value.meanDifference<0&&value.improvedHistories>=6))};
write(join(output,'results.json'),result);console.log(JSON.stringify(result));
