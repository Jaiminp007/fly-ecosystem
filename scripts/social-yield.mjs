import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync,createReadStream} from 'node:fs';
import {createInterface} from 'node:readline';
import {join,dirname,resolve,relative,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {SOCIAL_YIELD_MODES,yieldFeatures,createYieldPredictor,predictYield,updateYield,scoreYield,ownYieldSamples} from '../learning/social-yield.mjs';
import {digest} from '../learning/intervention-study.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),input=join(root,'evidence/pursuit-census/20261025-v1'),output=join(root,'evidence/social-yield/20261025-v1');
assert.ok(!existsSync(output));
const read=name=>JSON.parse(readFileSync(name,'utf8'));
const write=(name,value)=>{mkdirSync(dirname(name),{recursive:true});writeFileSync(name,JSON.stringify(value,null,2)+'\n',{flag:'wx'});};
const census=read(join(input,'protocol.json')),sources={},visit=name=>{
  const key=relative(root,name).split(sep).join('/');assert.ok(!key.startsWith('../'));if(Object.hasOwn(sources,key))return;
  const bytes=readFileSync(name);sources[key]=digest(bytes);
  if(/\.m?js$/.test(name))for(const match of bytes.toString().matchAll(/(?:from|import)\s+['"]([.][^'"]+)['"]/g))visit(resolve(dirname(name),match[1]));
};
for(const name of ['scripts/social-yield.mjs','tests/social-yield.test.mjs','docs/SOCIAL_YIELD_DESIGN.md'])visit(join(root,name));
const protocol={schema:1,kind:'body-local-frozen-social-yield-information-test',createdAt:new Date().toISOString(),horizon:8,delay:32,
  histories:census.inputs.map(source=>({seed:source.history.seed,stepsSha256:read(join(input,'rows',source.history.seed+'.json')).stepsSha256})),
  sourceSha256:sources,censusResultsSha256:digest(readFileSync(join(input,'results.json'))),qualified:false,
  rule:'Social improves Brier and log loss in >=6/8 histories and history means over food, blind and delayed; information test only.'};
write(join(output,'protocol.json'),protocol);
for(const name of Object.keys(sources)){const target=join(output,'sources',name);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,readFileSync(join(root,name)),{flag:'wx'});}
const start=performance.now(),cpu=process.cpuUsage(),rows=[];
for(const source of protocol.histories){
  const bodies=new Map(),stream=createReadStream(join(input,'steps',source.seed+'.jsonl')),hash=createHash('sha256');stream.on('data',chunk=>hash.update(chunk));
  for await(const line of createInterface({input:stream,crlfDelay:Infinity})){const record=JSON.parse(line);if(!bodies.has(record.id))bodies.set(record.id,[]);bodies.get(record.id).push(record);}
  assert.equal(hash.digest('hex'),source.stepsSha256);
  const totals=Object.fromEntries(SOCIAL_YIELD_MODES.map(mode=>[mode,{samples:0,positives:0,brier:0,logLoss:0,scalarOperations:0,trainingUpdates:0}])),founders={};
  const support={acquisitionMoves:new Set(),transferMoves:new Set(),trainingSamples:0,transferSamples:0,censoredAcquisition:0,censoredTransfer:0};
  for(let id=1;id<=24;id++){
    const records=bodies.get(id)??[],train=ownYieldSamples(records.filter(record=>['A','B','C'].includes(record.phase))),test=ownYieldSamples(records.filter(record=>record.phase==='transfer'));
    for(const record of records){if(['A','B','C'].includes(record.phase))support.acquisitionMoves.add(record.outputs[1]);if(record.phase==='transfer')support.transferMoves.add(record.outputs[1]);}
    support.trainingSamples+=train.samples.length;support.transferSamples+=test.samples.length;support.censoredAcquisition+=train.censored;support.censoredTransfer+=test.censored;
    const models={},metrics={};
    for(const mode of SOCIAL_YIELD_MODES){
      const features=sample=>yieldFeatures(sample.record,mode==='delayed'?sample.delayed:sample.social,mode);
      const model=createYieldPredictor(mode==='prevalence'?1:mode==='food'?13:18);models[mode]=model;
      for(const sample of train.samples)updateYield(model,features(sample),sample.label);
      const frozen=[...model.weights],metric={samples:0,positives:0,brier:0,logLoss:0};
      for(const sample of test.samples){const probability=predictYield(model,features(sample)),loss=scoreYield(probability,sample.label);metric.samples++;metric.positives+=sample.label;metric.brier+=loss.brier;metric.logLoss+=loss.logLoss;}
      assert.deepEqual(model.weights,frozen);
      const total=totals[mode];for(const name of ['samples','positives','brier','logLoss'])total[name]+=metric[name];total.scalarOperations+=model.scalarOperations;total.trainingUpdates+=model.updates;
      metrics[mode]={...metric,brier:metric.samples?metric.brier/metric.samples:null,logLoss:metric.samples?metric.logLoss/metric.samples:null};
    }
    founders[id]={trainingSamples:train.samples.length,transferSamples:test.samples.length,censoredAcquisition:train.censored,censoredTransfer:test.censored,models,metrics};
  }
  for(const total of Object.values(totals)){assert.ok(total.samples>0);total.brier/=total.samples;total.logLoss/=total.samples;total.prevalence=total.positives/total.samples;}
  const row={seed:source.seed,founders:24,support:{...support,acquisitionMoves:[...support.acquisitionMoves].sort(),transferMoves:[...support.transferMoves].sort()},metrics:totals,bodies:founders};
  write(join(output,'rows',source.seed+'.json'),row);rows.push(row);console.log(JSON.stringify({seed:row.seed,support:row.support,metrics:row.metrics}));
}
for(const [name,expected]of Object.entries(sources))assert.equal(digest(readFileSync(join(root,name))),expected);
const comparisons=Object.fromEntries(['food','blind','delayed','prevalence'].map(mode=>[mode,Object.fromEntries(['brier','logLoss'].map(loss=>{
  const effects=rows.map(row=>row.metrics[mode][loss]-row.metrics.social[loss]);return [loss,{effects,meanImprovement:effects.reduce((sum,value)=>sum+value,0)/8,positiveHistories:effects.filter(value=>value>0).length}];
}))]));
const used=process.cpuUsage(cpu),result={schema:1,kind:protocol.kind,histories:8,qualified:false,comparisons,
  promisingInformation:['food','blind','delayed'].every(mode=>Object.values(comparisons[mode]).every(loss=>loss.meanImprovement>0&&loss.positiveHistories>=6)),
  runtime:{wallSeconds:(performance.now()-start)/1000,cpuSeconds:(used.user+used.system)/1e6},
  scope:'Fixed offline factual information test. No policy, causal competition, charged embodied gain, fresh qualification or RSI.'};
write(join(output,'results.json'),result);console.log(JSON.stringify(result));
