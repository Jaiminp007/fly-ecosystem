// Experimental action-conditioned transition learner. Not imported by World.
// Targets must come from actual experienced transitions; planning never calls
// the engine, accesses a food map, or receives a preferred-action label.
const INPUTS=17,ACTIONS=5,FEATURES=57,OUTPUTS=18;
const clip=(x,a,b)=>Math.max(a,Math.min(b,x));
function vector(value,size,label){if(!Array.isArray(value)||value.length!==size||value.some(x=>!Number.isFinite(x)||Math.abs(x)>1.000001))throw Error('Invalid predictive '+label);}
function features(model,observation,action,head='dynamics'){
  vector(observation,INPUTS,'observation');vector(action,ACTIONS,'action');
  const conditioned=head==='reward'?(model.config.rewardActionConditioned??model.config.actionConditioned):model.config.actionConditioned;
  const a=conditioned?action:Array(ACTIONS).fill(0);
  return[1,...observation,...a,...observation.map(x=>x*a[1]),...observation.map(x=>x*a[0])];
}
export function createPredictiveModel(values={}){
  for(const key of Object.keys(values))if(!['learningRate','actionConditioned','rewardActionConditioned'].includes(key))throw Error('Unknown predictive setting: '+key);
  const config={learningRate:.2,actionConditioned:true,...values};
  if(!Number.isFinite(config.learningRate)||config.learningRate<=0||config.learningRate>1||typeof config.actionConditioned!=='boolean')throw Error('Invalid predictive configuration');
  if(Object.hasOwn(values,'rewardActionConditioned')&&typeof values.rewardActionConditioned!=='boolean')throw Error('Invalid predictive reward conditioning');
  const factored=config.rewardActionConditioned!==undefined&&config.rewardActionConditioned!==config.actionConditioned;
  return{schema:1,kind:factored?'factored-transition':'action-conditioned-transition',config,seen:0,weights:Array.from({length:OUTPUTS},()=>Array(FEATURES).fill(0))};
}
export function predictTransition(model,observation,action){
  const x=features(model,observation,action),rewardX=model.config.rewardActionConditioned===undefined||model.config.rewardActionConditioned===model.config.actionConditioned?x:features(model,observation,action,'reward');
  const raw=model.weights.map((weights,head)=>weights.reduce((sum,w,i)=>sum+w*(head===0?rewardX:x)[i],0));
  return{reward:clip(raw[0],-1,1),nextObservation:observation.map((value,index)=>clip(value+clip(raw[index+1],-2,2),-1,1))};
}
export function learnTransition(model,observation,action,{reward,nextObservation},{learning=true}={}){
  if(!Number.isFinite(reward)||Math.abs(reward)>1||typeof learning!=='boolean')throw Error('Invalid predictive reward/learning setting');vector(nextObservation,INPUTS,'next observation');
  const prediction=predictTransition(model,observation,action),errors=[reward-prediction.reward,...nextObservation.map((x,i)=>x-prediction.nextObservation[i])];
  if(learning){const x=features(model,observation,action),rewardX=model.config.rewardActionConditioned===undefined||model.config.rewardActionConditioned===model.config.actionConditioned?x:features(model,observation,action,'reward'),norm=Math.max(1,x.reduce((sum,value)=>sum+value*value,0)),rewardNorm=rewardX===x?norm:Math.max(1,rewardX.reduce((sum,value)=>sum+value*value,0));for(let output=0;output<OUTPUTS;output++){const input=output===0?rewardX:x,scale=output===0?rewardNorm:norm;for(let i=0;i<FEATURES;i++)model.weights[output][i]=clip(model.weights[output][i]+model.config.learningRate*errors[output]*input[i]/scale,-4,4);}model.seen++;}
  return{prediction,rewardSquaredError:errors[0]**2,observationSquaredError:errors.slice(1).reduce((sum,x)=>sum+x*x,0)/INPUTS};
}
export function restorePredictiveModel(value){
  if(value?.schema!==1||!['action-conditioned-transition','factored-transition'].includes(value.kind)||!Number.isSafeInteger(value.seen)||value.seen<0)throw Error('Invalid predictive state');
  const expected=createPredictiveModel(value.config);if(expected.kind!==value.kind)throw Error('Predictive head identity mismatch');
  if(!Array.isArray(value.weights)||value.weights.length!==OUTPUTS||value.weights.some(row=>!Array.isArray(row)||row.length!==FEATURES||row.some(x=>!Number.isFinite(x)||Math.abs(x)>4)))throw Error('Invalid predictive weights');
  if(value.kind==='factored-transition'&&value.config.rewardActionConditioned===false&&value.weights[0].slice(18).some(x=>x!==0))throw Error('Unlabelled action weights in factored reward head');
  return structuredClone(value);
}
export function planTransitionActions(model,observation,options,{horizon=8,discount=.99}={}){
  vector(observation,INPUTS,'observation');
  if(!Number.isInteger(horizon)||horizon<1||horizon>32||!Number.isFinite(discount)||discount<0||discount>1||!Array.isArray(options)||options.length<2||options.length>4)throw Error('Invalid predictive plan');
  if(new Set(options.map(option=>option.id)).size!==options.length||options.some(option=>typeof option.id!=='string'||!option.id))throw Error('Invalid predictive option IDs');
  for(const option of options)vector(option.action,ACTIONS,'action');
  if(model.seen<64)return{available:false,reason:'insufficient-experienced-transitions',selected:null,options:[],modelPredictions:0};
  const estimates=options.map(option=>{let state=[...observation],value=0,power=1;for(let tick=0;tick<horizon;tick++){const prediction=predictTransition(model,state,option.action);value+=power*prediction.reward;power*=discount;state=prediction.nextObservation;}return{id:option.id,predictedReturn:value,predictedFinalObservation:state};});
  const chosen=[...estimates].sort((a,b)=>b.predictedReturn-a.predictedReturn||a.id.localeCompare(b.id))[0];
  return{available:true,selected:chosen.id,options:estimates,modelPredictions:horizon*options.length,scope:'Learned open-loop forecast with each proposed complete action vector held fixed. Predicted outcomes, not executed outcomes or uncertainty bounds.'};
}
