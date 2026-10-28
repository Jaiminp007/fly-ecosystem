import assert from 'node:assert/strict';
import {createReadStream,readFileSync,writeFileSync,mkdirSync,existsSync,openSync,writeSync,closeSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {dirname,join,relative,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {FEEDING_MODELS,feedingContextFeatures,createFeedingPredictor,predictFeedingEnergy,trainFeedingEnergy} from '../learning/feeding-context.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/coverage-development/20261026-v1'),output=join(root,'evidence/feeding-context/20261026-v1');
assert.ok(!existsSync(output));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex'),read=path=>JSON.parse(readFileSync(path,'utf8'));
const write=(path,value)=>{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const bank=read(join(base,'protocol.json')),inputs=bank.histories.map(history=>({history,acquisition:'evidence/coverage-development/20261026-v1/traces/'+history.seed+'-candidate.jsonl',transfer:'evidence/coverage-development/20261026-v1/traces/'+history.seed+'-transfer-current.jsonl'}));
for(const input of inputs)for(const key of ['acquisition','transfer'])input[key+'Sha256']=read(join(base,'rows',input.history.seed+'.json')).traces[input.history.seed+(key==='acquisition'?'-candidate':'-transfer-current')].sha256;
const sources=Object.fromEntries(['scripts/feeding-context.mjs','learning/feeding-context.mjs','tests/feeding-context.test.mjs','docs/FEEDING_CONTEXT_DESIGN.md'].map(name=>[name,hash(readFileSync(join(root,name)))]));
write(join(output,'protocol.json'),{schema:1,kind:'own-feeding-context-information',createdAt:new Date().toISOString(),inputs,sourceSha256:sources,models:FEEDING_MODELS,trainThroughTick:1024,
  rule:'Context MSE lower mean and >=6/8 lower histories against both raw and delayed, separately on C and transfer.',scope:'Fixed offline own-history reward prediction, not policy, headroom, qualification or RSI.'});
for(const name of Object.keys(sources)){const path=join(output,'sources',name);mkdirSync(dirname(path),{recursive:true});writeFileSync(path,readFileSync(join(root,name)),{flag:'wx'});}
const start=performance.now(),rows=[];
for(const input of inputs){
  const states={},delayed={},frozenHashes={},stats={},predictionHashes={},trainingCounts={};
  const body=id=>states[id]??=Object.fromEntries(FEEDING_MODELS.map(mode=>[mode,createFeedingPredictor(id,mode)]));
  const freeze=id=>{for(const state of Object.values(body(id)))state.frozen=true;frozenHashes[id]??=hash(JSON.stringify(Object.values(body(id)).map(state=>state.weights)));};
  for(const [key,family]of [['acquisition','C'],['transfer','transfer']]){
    const pending={},path=join(output,'predictions',input.history.seed+'-'+family+'.jsonl');mkdirSync(dirname(path),{recursive:true});
    const fd=openSync(path,'wx'),hasher=createHash('sha256'),predictionHash=createHash('sha256');
    stats[family]=Object.fromEntries(FEEDING_MODELS.map(mode=>[mode,{count:0,squaredError:0}]));
    const complete=(prior,energy,terminal)=>{
      const target=(energy-prior.own.energy)/120,id=prior.own.agentId,training=key==='acquisition'&&prior.tick<=1024,models=body(id);
      const predictions={};
      if(!training)freeze(id);
      for(const mode of FEEDING_MODELS){
        const record={agentId:id,action:prior.action,phi:prior.phis[mode],target};
        const prediction=training?trainFeedingEnergy(models[mode],record):predictFeedingEnergy(models[mode],record);
        if(!training){const squaredError=(prediction-target)**2;stats[family][mode].count++;stats[family][mode].squaredError+=squaredError;predictions[mode]={prediction,squaredError};}
      }
      if(training)trainingCounts[id]=(trainingCounts[id]??0)+1;
      else{
        const text=JSON.stringify({agentId:id,tick:prior.tick,action:prior.action,own:prior.own,probability:prior.probability,delayedProbability:prior.delayed,target,terminal,predictions})+'\n';
        writeSync(fd,text);predictionHash.update(text);
      }
    };
    try{
      const stream=createReadStream(join(root,input[key]));stream.on('data',chunk=>hasher.update(chunk));
      for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
        const event=JSON.parse(line);
        if(event.type==='decision'){
          const own=event.own,id=own.agentId;body(id);
          if(pending[id]){assert.equal(event.tick,pending[id].tick+1);complete(pending[id],own.energy,false);}
          const probability=event.choice.feedProbability,previous=delayed[id]??.725;
          pending[id]={own,tick:event.tick,action:event.choice.action,probability,delayed:previous,phis:Object.fromEntries(FEEDING_MODELS.map(mode=>[mode,feedingContextFeatures(own,probability,previous,mode)]))};
          delayed[id]=probability;
        }else if(event.type==='observe'&&event.own.terminal){
          const own=event.own;assert.equal(pending[own.agentId].tick,own.tick);complete(pending[own.agentId],own.energy,true);delete pending[own.agentId];
        }
      }
    }finally{closeSync(fd);}
    assert.equal(hasher.digest('hex'),input[key+'Sha256']);predictionHashes[family]=predictionHash.digest('hex');
    for(const id of Object.keys(states)){freeze(Number(id));assert.equal(hash(JSON.stringify(Object.values(states[id]).map(state=>state.weights))),frozenHashes[id]);}
    for(const value of Object.values(stats[family]))value.mse=value.count?value.squaredError/value.count:null;
  }
  const scalarOperations=Object.values(states).reduce((sum,models)=>sum+Object.values(models).reduce((total,state)=>total+state.scalarOperations,0),0);
  const row={history:input.history,statistics:stats,trainingCounts,predictionHashes,scalarOperations,parameterBytes:Object.values(states).reduce((sum,models)=>sum+Object.values(models).reduce((total,state)=>total+3*state.dimensions*8,0),0)};
  write(join(output,'models',input.history.seed+'.json'),states);write(join(output,'rows',input.history.seed+'.json'),row);rows.push(row);console.log(JSON.stringify(row));
}
for(const [name,expected]of Object.entries(sources))assert.equal(hash(readFileSync(join(root,name))),expected);
const comparisons=Object.fromEntries(['C','transfer'].map(family=>[family,Object.fromEntries(['raw','delayed'].map(mode=>{
  const differences=rows.map(row=>row.statistics[family].context.mse===null||row.statistics[family][mode].mse===null?null:row.statistics[family].context.mse-row.statistics[family][mode].mse);
  return [mode,{differences,meanDifference:differences.every(Number.isFinite)?differences.reduce((sum,value)=>sum+value,0)/8:null,improvedHistories:differences.filter(value=>value!==null&&value<0).length}];
}))]));
const result={schema:1,kind:'own-feeding-context-information',comparisons,promisingInformation:Object.values(comparisons).every(family=>Object.values(family).every(value=>value.meanDifference!==null&&value.meanDifference<0&&value.improvedHistories>=6)),qualified:false,wallSeconds:(performance.now()-start)/1000};
write(join(output,'results.json'),result);console.log(JSON.stringify(result));
