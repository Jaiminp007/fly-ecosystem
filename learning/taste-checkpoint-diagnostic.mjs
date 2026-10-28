import assert from 'node:assert/strict';

export function diagnosticFeatures(cue){
  assert.ok(Array.isArray(cue)&&cue.length===4&&cue.every(value=>value===-1||value===1));
  const features=[1,...cue];
  for(let first=0;first<4;first++)for(let second=first+1;second<4;second++)features.push(cue[first]*cue[second]);
  return features;
}
export function diagnosticAcceptance(weights,cue){
  assert.ok(Array.isArray(weights)&&weights.length===11&&weights.every(Number.isFinite));
  const features=diagnosticFeatures(cue),logit=Math.log(3)+weights.reduce((sum,weight,index)=>sum+weight*features[index],0)/Math.sqrt(11);
  return .05+.9/(1+Math.exp(-logit));
}
export function diagnosticScores(weights,cues){
  let positive=0,negative=0,loss=0,correct=0,positiveCount=0,negativeCount=0;
  for(const cue of cues){
    assert.ok(cue.valence===1||cue.valence===-1);const probability=diagnosticAcceptance(weights,cue.bits),good=cue.valence===1;
    loss-=Math.log(good?probability:1-probability);correct+=Number((probability>.5)===good);
    if(good){positive+=probability;positiveCount++;}else{negative+=probability;negativeCount++;}
  }
  assert.ok(positiveCount&&negativeCount);
  return {separation:positive/positiveCount-negative/negativeCount,logLoss:loss/cues.length,accuracy:correct/cues.length};
}
