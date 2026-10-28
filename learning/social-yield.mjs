import assert from 'node:assert/strict';

export const SOCIAL_YIELD_MODES=Object.freeze(['food','social','blind','delayed','prevalence']);
export function yieldFeatures(record,social,mode){
  assert.ok(SOCIAL_YIELD_MODES.includes(mode));
  if(mode==='prevalence')return [1];
  const features=[1,...[0,1,2,3,4,5,10,11,13].map(index=>record.raw[index]),...record.outputs.slice(0,3)];
  if(mode!=='food')features.push(...(mode==='blind'?Array(5).fill(0):social));
  assert.ok(features.every(Number.isFinite));return features;
}
export function createYieldPredictor(dimensions){return {weights:Array(dimensions).fill(0),updates:0,scalarOperations:0};}
export function predictYield(model,features){
  assert.equal(model.weights.length,features.length);
  const logit=model.weights.reduce((sum,weight,index)=>sum+weight*features[index],0);
  model.scalarOperations+=2*features.length+5;
  return 1/(1+Math.exp(-Math.max(-30,Math.min(30,logit))));
}
export function updateYield(model,features,label){
  assert.ok(label===0||label===1);const probability=predictYield(model,features);
  for(let index=0;index<features.length;index++){
    const gradient=(probability-label)*features[index]+(index===0?0:.001*model.weights[index]);
    model.weights[index]=Math.max(-8,Math.min(8,model.weights[index]-.025*gradient));
  }
  model.updates++;model.scalarOperations+=8*features.length+1;
}
export function scoreYield(probability,label){
  assert.ok(probability>0&&probability<1&&(label===0||label===1));
  return {brier:(probability-label)**2,logLoss:-label*Math.log(probability)-(1-label)*Math.log(1-probability)};
}

export function ownYieldSamples(records){
  const samples=[],history=[];let pending=[];let phase=null,censored=0;
  for(const record of records){
    assert.equal(record.id,records[0].id);
    if(record.phase!==phase){censored+=pending.length;pending=[];phase=record.phase;}
    const social=[6,7,8,9,12].map(index=>record.raw[index]),delayed=history.length>=32?history[history.length-32]:Array(5).fill(0);
    pending.push({record,social,delayed,label:0});history.push(social);
    for(const sample of pending)if(record.intake>0)sample.label=1;
    if(pending.length===8){const sample=pending.shift();samples.push({...sample,availableTick:record.tick});}
  }
  return {samples,censored:censored+pending.length};
}
