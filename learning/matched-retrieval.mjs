// Offline estimator prototype. Nothing in World or the live controller imports
// this module. It sees only past recalled records, never diagnostic fork labels.
function vector(values){if(!Array.isArray(values)||values.length!==17||values.some(x=>!Number.isFinite(x)||Math.abs(x)>1.000001))throw Error('Invalid matched-retrieval features');}
const squared=(a,b)=>a.reduce((sum,x,index)=>sum+(x-b[index])**2,0);

export function matchedRetrieval(query,retrieval,{bandwidth=.25,maxPairDistance=.6}={}){
  vector(query);
  if(!Number.isFinite(bandwidth)||bandwidth<.05||bandwidth>1||!Number.isFinite(maxPairDistance)||maxPairDistance<.1||maxPairDistance>2)throw Error('Invalid matched-retrieval geometry');
  const groups=['negative','positive'].map((key,index)=>{
    const records=retrieval?.[key]?.neighbors;
    if(!Array.isArray(records)||records.length>16)throw Error('Invalid matched-retrieval neighbors');
    return records.map(row=>{vector(row.features);if(row.action!==(index?1:-1)||!Number.isFinite(row.reward)||Math.abs(row.reward)>1)throw Error('Invalid matched-retrieval outcome');return{...row,querySquared:squared(row.features,query)};});
  });
  const pairs=[];let pairComparisons=0;
  for(const negative of groups[0])for(const positive of groups[1]){
    pairComparisons++;const pairSquared=squared(negative.features,positive.features);
    if(pairSquared>maxPairDistance**2)continue;
    // Joint weight requires both contexts to be near the query AND near each
    // other. Unlike a common prior, this can change supported action rankings.
    pairs.push({negativeIndex:negative.index,positiveIndex:positive.index,negativeReward:negative.reward,positiveReward:positive.reward,pairDistance:Math.sqrt(pairSquared),logCost:(negative.querySquared+positive.querySquared+pairSquared)/(2*bandwidth**2)});
  }
  const accounting={pairComparisons,additionalRecordReads:2*pairComparisons};
  if(!pairs.length)return{available:false,reason:'no-comparable-pairs',...accounting,pairs:[],negativeEstimate:null,positiveEstimate:null,advantage:null};
  const offset=Math.min(...pairs.map(pair=>pair.logCost));let weight=0,negativeSum=0,positiveSum=0,pairDistanceSum=0;
  for(const pair of pairs){pair.weight=Math.exp(-(pair.logCost-offset));weight+=pair.weight;negativeSum+=pair.weight*pair.negativeReward;positiveSum+=pair.weight*pair.positiveReward;pairDistanceSum+=pair.weight*pair.pairDistance;}
  const negativeEstimate=negativeSum/weight,positiveEstimate=positiveSum/weight;
  return{available:true,reason:'matched-past-contexts',...accounting,pairs,negativeEstimate,positiveEstimate,advantage:positiveEstimate-negativeEstimate,meanPairDistance:pairDistanceSum/weight};
}
