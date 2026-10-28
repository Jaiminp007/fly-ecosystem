// Offline finite-window consequence model. World does not import this module.
// Records contain only completed factual decision windows, never imagined or
// counterfactual outcomes. Other motor feedback is bundled into each outcome.
const CHANNELS=[0,1,2,3,4,10,11,12,13];
function observation(model,values){if(!Array.isArray(values)||values.length!==(model.config.resourceSense?18:17)||values.some(x=>!Number.isFinite(x)||Math.abs(x)>1.000001)||model.config.resourceSense&&values[17]<0)throw Error('Invalid option observation');}
const choice=value=>{if(![-1,1].includes(value))throw Error('Invalid option choice');};
export function createOptionModel(values={}){
  for(const key of Object.keys(values))if(!['capacity','neighbors','bandwidth','maxDistance','minimumPerAction','horizon','discount','resourceSense'].includes(key))throw Error('Unknown option setting: '+key);
  const config={capacity:128,neighbors:8,bandwidth:.125,maxDistance:.25,minimumPerAction:2,horizon:8,discount:.99,...values};
  if(config.resourceSense!==undefined&&typeof config.resourceSense!=='boolean')throw Error('Invalid resource sensing flag');
  // Preserve all disabled-mode numerical behavior and checkpoint bytes.
  if(!config.resourceSense)delete config.resourceSense;
  if(!Number.isInteger(config.capacity)||config.capacity<16||config.capacity>512||!Number.isInteger(config.neighbors)||config.neighbors<1||config.neighbors>16||config.neighbors>config.capacity||!Number.isInteger(config.minimumPerAction)||config.minimumPerAction<1||config.minimumPerAction>config.neighbors||!Number.isInteger(config.horizon)||config.horizon<1||config.horizon>32||!Number.isFinite(config.discount)||config.discount<0||config.discount>1||!Number.isFinite(config.bandwidth)||config.bandwidth<=0||config.bandwidth>1||!Number.isFinite(config.maxDistance)||config.maxDistance<=0||config.maxDistance>2)throw Error('Invalid option configuration');
  return{schema:1,kind:config.resourceSense?'finite-window-resource-option-outcome':'finite-window-option-outcome',config,seen:0,records:[]};
}
export function rememberOption(model,inputs,action,rewards){
  observation(model,inputs);choice(action);
  if(!Array.isArray(rewards)||rewards.length!==model.config.horizon||rewards.some(r=>!Number.isFinite(r)||Math.abs(r)>1))throw Error('Option requires a completed reward window');
  let value=0,power=1;for(const reward of rewards){value+=power*reward;power*=model.config.discount;}
  model.seen++;model.records.push({observation:[...inputs],choice:action,rewards:[...rewards],value,experience:model.seen});if(model.records.length>model.config.capacity)model.records.shift();return value;
}
export function predictOption(model,inputs,{eraseAction=false}={}){
  observation(model,inputs);if(typeof eraseAction!=='boolean')throw Error('Invalid option action erasure');
  const channels=model.config.resourceSense?[...CHANNELS,17]:CHANNELS;
  // Keep the original nine-channel scale unchanged; the optional measurement
  // adds a distance term rather than rescaling every existing sensory axis.
  const rows=model.records.map((record,index)=>({record,index,distance:Math.sqrt(channels.reduce((sum,k)=>sum+(inputs[k]-record.observation[k])**2,0)/CHANNELS.length)})).filter(row=>row.distance<=model.config.maxDistance);
  const estimate=action=>{
    const selected=rows.filter(row=>eraseAction||row.record.choice===action).sort((a,b)=>a.distance-b.distance||b.record.experience-a.record.experience).slice(0,model.config.neighbors);
    let value=0,mass=0;for(const row of selected){const weight=Math.exp(-(row.distance**2)/(2*model.config.bandwidth**2));mass+=weight;value+=weight*row.record.value;}
    return{available:selected.length>=model.config.minimumPerAction,estimate:mass?value/mass:null,neighbors:selected.map(row=>({index:row.index,experience:row.record.experience,distance:row.distance,value:row.record.value}))};
  };
  const negative=estimate(-1),positive=estimate(1),available=negative.available&&positive.available;
  return{available,reason:available?'past-completed-local-windows':'insufficient-local-support',negative,positive,difference:available?positive.estimate-negative.estimate:null,recordScans:model.records.length,scope:'Finite-window forecast under the experienced neural continuation, not a causal guarantee, survival forecast or uncertainty interval.'};
}
export function restoreOptionModel(value){
  if(value?.schema!==1||!['finite-window-option-outcome','finite-window-resource-option-outcome'].includes(value.kind)||!Number.isSafeInteger(value.seen)||value.seen<0)throw Error('Invalid option state');
  const expected=createOptionModel(value.config);
  if(value.kind!==expected.kind)throw Error('Option observation identity mismatch');
  if(!Array.isArray(value.records)||value.records.length!==Math.min(value.seen,expected.config.capacity))throw Error('Invalid option records');
  for(const[index,record]of value.records.entries()){
    observation(expected,record.observation);choice(record.choice);
    if(record.experience!==value.seen-value.records.length+index+1)throw Error('Invalid option sequence');
    const temporary=createOptionModel(value.config),computed=rememberOption(temporary,record.observation,record.choice,record.rewards);if(computed!==record.value)throw Error('Invalid option outcome');
  }
  return structuredClone(value);
}
