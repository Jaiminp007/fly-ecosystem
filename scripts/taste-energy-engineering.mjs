import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {dirname,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {digest} from '../learning/intervention-study.mjs';
import {tickMotor} from '../learning/tick-actor-critic.mjs';
import {chargeForStep,billSarsaWork} from '../learning/sarsa-experiment.mjs';
import {contactObservation} from '../learning/contact-observation.mjs';
import {createTasteEnergyBody,chooseTasteEnergyAction,observeTasteEnergyBody,freezeTasteEnergyBody,resetTasteEnergyBody,compactTasteEnergyBody,restoreTasteEnergyBody} from '../learning/taste-energy.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),canonical=v=>JSON.parse(JSON.stringify(v));
// 254001 also identifies the earlier 160-step API smoke check, not a fresh seed.
export const TASTE_ENERGY_FIXTURES=Object.freeze([
  {name:'reservoir-terminal',agentId:51,seed:254001,ticks:192},
  {name:'terminal-first',agentId:52,seed:254002,ticks:1},
  {name:'freeze-reset',agentId:53,seed:254003,ticks:80},
  {name:'reset-live',agentId:54,seed:254004,ticks:192},
  {name:'cue-blind',agentId:55,seed:254005,ticks:160,options:{cueBlind:true}},
  {name:'taste-off',agentId:56,seed:254006,ticks:64,options:{tasteLearning:false}},
  {name:'normalization-off',agentId:57,seed:254007,ticks:80,options:{normalizeMotor:false}},
  {name:'neutral',agentId:58,seed:254008,ticks:32},
  {name:'no-contact',agentId:59,seed:254009,ticks:32},
  {name:'compact-inference',agentId:60,seed:254010,ticks:192}
]);
export function tasteEnergySourceHashes(){
  const sources={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(name&&!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(sources,name))return;
    const bytes=readFileSync(path);sources[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString('utf8').matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(dirname(path),m[1]));
  };
  for(const name of ['scripts/taste-energy-engineering.mjs','scripts/audit-taste-energy.py','scripts/audit-tick-actor-critic.py',
    'tests/taste-energy.test.mjs','tests/taste-energy-audit.test.mjs','tests/stationary-taste-credit.test.mjs','docs/TASTE_ENERGY_DESIGN.md'])visit(resolve(root,name));
  return Object.fromEntries(Object.entries(sources).sort(([a],[b])=>a.localeCompare(b,'en')));
}
export function tasteEnergyEngineeringRecord(){
  const pricing={operationEnergy:5e-6/17,byteEnergyPerSecond:1e-5/(17*8)},fixtures=[];
  for(const config of TASTE_ENERGY_FIXTURES){
    let state=createTasteEnergyBody(config.agentId,config.seed,config.options),physical=50,lastFood=0;
    const initialState=canonical(state),events=[],append=event=>events.push(canonical({...event,state}));
    for(let tick=1;tick<=config.ticks;tick++){
      const raw=Array(17).fill(0);raw[0]=.8;raw[2]=.6;raw[3]=.5;raw[4]=physical/120;raw[10]=tick%3===0?1:0;raw[13]=lastFood;raw[16]=1;
      const sourceCue=[[1,-1,1,-1],[-1,1,-1,1],[1,1,-1,-1],[-1,-1,1,1]][Math.floor((tick-1)/16)%4];
      const neutral=config.name==='neutral'||config.name==='terminal-first',contactPresent=config.name!=='no-contact';
      const cue=neutral||config.options?.cueBlind?[0,0,0,0]:sourceCue;
      const own={agentId:config.agentId,tick,energy:physical-state.charge.outstandingEnergy,raw,cue,contactPresent,odorPresent:!neutral};
      const updates=[],action=chooseTasteEnergyAction(state,own,row=>updates.push(row));append({type:'choose',own,action,updates});
      const outputs=tickMotor(state,raw,action);append({type:'motor',raw,action,outputs});
      const bill=chargeForStep(state,pricing);append({type:'charge',energyCost:bill.energyCost});
      const paid=config.name==='reservoir-terminal'?bill.energyCost/2:bill.energyCost;bill.afterEnergyCharge({paid});physical-=paid;append({type:'pay',paid});
      lastFood=(action===0||action===2)&&contactPresent?(tick%3===0?.03:-.01):0;physical+=lastFood-.02;
      const terminal=tick===config.ticks&&['terminal-first','reservoir-terminal'].includes(config.name);
      const after={agentId:config.agentId,tick,energy:(terminal?0:physical)-state.charge.outstandingEnergy,lastFood,terminal},endings=[];
      observeTasteEnergyBody(state,after,row=>endings.push(row));append({type:'observe',own:after,updates:endings});
      if(terminal){billSarsaWork(state,pricing);append({type:'bill'});}
      if(config.name==='freeze-reset'&&tick===33){freezeTasteEnergyBody(state);append({type:'freeze'});}
      if(config.name==='freeze-reset'&&tick===49||config.name==='reset-live'&&tick===96){resetTasteEnergyBody(state);append({type:'reset'});}
      if(config.name==='compact-inference'&&tick===128){compactTasteEnergyBody(state);append({type:'compact'});}
      state=restoreTasteEnergyBody(canonical(state));append({type:'restore'});
    }
    fixtures.push({...config,initialState,events,finalState:canonical(state)});
  }
  const contacts=[
    {name:'radius-tie',fly:{x:100,y:100},patches:[{x:115,y:100,cue:[1,-1,1,-1]},{x:85,y:100,cue:[-1,1,-1,1]},{x:115.001,y:100,cue:[-1,1,-1,1]}],fallback:[0,0,0,0]},
    {name:'distant-fallback',fly:{x:500,y:500},patches:[{x:100,y:100,cue:[1,-1,1,-1]}],fallback:[-1,1,-1,1]},
    {name:'absent',fly:{x:0,y:0},patches:[],fallback:[0,0,0,0]},
    {name:'contact-no-odor',fly:{x:0,y:0},patches:[{x:0,y:0,cue:[0,0,0,0]}],fallback:[0,0,0,0]}
  ].map(config=>{const work={scalarOperations:0},output=contactObservation(config.fly,config.patches,config.fallback,work);return {...config,output,work};});
  return canonical({schema:1,kind:'taste-energy-component-engineering',pricing,sources:tasteEnergySourceHashes(),fixtures,contacts,
    scope:'Named artificial own-sensor/energy API schedules and forced terminal feedback only. No world, performance history, causal mechanism result, qualification or RSI. Includes the previously used 254001 smoke seed in engineering exclusions.'});
}
export function replayTasteEnergyEngineering(record){assert.deepEqual(record.sources,tasteEnergySourceHashes());assert.equal(JSON.stringify(record),JSON.stringify(tasteEnergyEngineeringRecord()));
  return {schema:1,passed:true,exactJsonReplay:true,fixtures:record.fixtures.length,node:process.version,platform:process.platform};}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2);
  if(args.length===2&&args[0]==='--output')writeFileSync(args[1],JSON.stringify(tasteEnergyEngineeringRecord())+'\n',{flag:'wx'});
  else{assert.ok(args.length===4&&args[0]==='--replay'&&args[2]==='--output');writeFileSync(args[3],JSON.stringify(replayTasteEnergyEngineering(JSON.parse(readFileSync(args[1]))),null,2)+'\n',{flag:'wx'});}
}
