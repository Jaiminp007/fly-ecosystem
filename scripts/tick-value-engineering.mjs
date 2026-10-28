import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {dirname,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {digest} from '../learning/intervention-study.mjs';
import {cueObservation} from '../learning/cue-foraging.mjs';
import {tickMotor} from '../learning/tick-actor-critic.mjs';
import {contactCue} from '../learning/contact-cue.mjs';
import {chargeForStep,billSarsaWork} from '../learning/sarsa-experiment.mjs';
import {createValueBody,chooseValueAction,observeValueBody,freezeValueBody,resetValueBody,restoreValueBody} from '../learning/tick-value.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),canonical=value=>JSON.parse(JSON.stringify(value));
export const VALUE_FIXTURES=Object.freeze([
  {name:'reservoir',agentId:31,seed:251001,ticks:90,lambda:.9},
  {name:'lambda-zero',agentId:32,seed:251002,ticks:8,lambda:0},
  {name:'freeze-reset',agentId:33,seed:251003,ticks:9,lambda:.9},
  {name:'reset-live',agentId:34,seed:251004,ticks:14,lambda:.9},
  {name:'terminal-first',agentId:35,seed:251005,ticks:1,lambda:.9},
  {name:'terminal-reservoir',agentId:36,seed:251006,ticks:75,lambda:.9},
  {name:'contact',agentId:37,seed:251007,ticks:5,lambda:.9}
]);
export function valueSourceHashes(){
  const sources={},visit=path=>{
    const name=relative(root,path).split(sep).join('/');assert.ok(name&&!name.startsWith('../')&&!name.startsWith('/'));
    if(Object.hasOwn(sources,name))return;
    const bytes=readFileSync(path);sources[name]=digest(bytes);
    if(/\.m?js$/.test(name))for(const m of bytes.toString('utf8').matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g))visit(resolve(dirname(path),m[1]));
  };
  for(const name of ['scripts/tick-value-engineering.mjs','scripts/audit-tick-value.py','scripts/audit-tick-actor-critic.py',
    'tests/tick-value.test.mjs','tests/tick-value-audit.test.mjs','docs/TICK_VALUE_DESIGN.md'])visit(resolve(root,name));
  return Object.fromEntries(Object.entries(sources).sort(([a],[b])=>a.localeCompare(b,'en')));
}
export function valueEngineeringRecord(){
  const pricing={operationEnergy:5e-6/17,byteEnergyPerSecond:1e-5/(17*8)},fixtures=[];
  for(const config of VALUE_FIXTURES){
    let state=createValueBody(config.agentId,config.seed,{lambda:config.lambda}),physical=50,lastFood=0;
    const initialState=canonical(state),events=[],append=event=>events.push(canonical({...event,state}));
    for(let tick=1;tick<=config.ticks;tick++){
      const raw=Array(17).fill(0);raw[0]=.8;raw[2]=.6;raw[3]=.5;raw[4]=physical/120;raw[10]=tick%3===0?1:0;raw[13]=lastFood;raw[16]=1;
      let cue=tick%2?[1,-1,1,-1]:[-1,1,-1,1];
      if(config.name==='terminal-first'||config.name==='lambda-zero')cue=[0,0,0,0];
      if(config.name==='contact'){
        const fly={x:100,y:100},patches=[{x:100,y:100,cue:[1,-1,1,-1]},{x:130,y:100,cue:[-1,1,-1,1]}],fallback=[-1,1,-1,1];
        cue=contactCue(fly,patches,fallback,state.work);append({type:'contact',fly,patches,fallback,cue});
      }
      const own={agentId:config.agentId,tick,energy:physical-state.charge.outstandingEnergy,raw,observation:cueObservation(raw,cue)},transitions=[];
      const action=chooseValueAction(state,own,row=>transitions.push(row));append({type:'choose',own,action,transitions});
      const outputs=tickMotor(state,raw,action);append({type:'motor',raw,action,outputs});
      const bill=chargeForStep(state,pricing);append({type:'charge',energyCost:bill.energyCost});
      const paid=config.name==='terminal-reservoir'?bill.energyCost/2:bill.energyCost;bill.afterEnergyCharge({paid});physical-=paid;append({type:'pay',paid});
      lastFood=tick%3===0?.03:-.01;physical+=lastFood;
      const terminal=tick===config.ticks&&['terminal-first','terminal-reservoir'].includes(config.name);
      const after={agentId:config.agentId,tick,energy:(terminal?0:physical)-state.charge.outstandingEnergy,terminal},endings=[];
      observeValueBody(state,after,row=>endings.push(row));append({type:'observe',own:after,transitions:endings});
      if(terminal){billSarsaWork(state,pricing);append({type:'bill'});}
      if(config.name==='freeze-reset'&&tick===3){freezeValueBody(state);append({type:'freeze'});}
      if(config.name==='freeze-reset'&&tick===5||config.name==='reset-live'&&tick===7){resetValueBody(state);append({type:'reset'});}
      state=restoreValueBody(canonical(state));append({type:'restore'});
    }
    fixtures.push({...config,initialState,events,finalState:canonical(state)});
  }
  return canonical({schema:1,kind:'tick-direct-value-engineering',pricing,sources:valueSourceHashes(),fixtures,
    scope:'Named synthetic own-energy API schedules, including forced terminal feedback. No physical world, reachable learned state, performance history, qualification or RSI.'});
}
export function replayValueEngineering(record){assert.deepEqual(record.sources,valueSourceHashes());assert.equal(JSON.stringify(record),JSON.stringify(valueEngineeringRecord()));
  return {schema:1,passed:true,exactJsonReplay:true,fixtures:record.fixtures.length,node:process.version,platform:process.platform};}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2);
  if(args.length===2&&args[0]==='--output')writeFileSync(args[1],JSON.stringify(valueEngineeringRecord())+'\n',{flag:'wx'});
  else{assert.ok(args.length===4&&args[0]==='--replay'&&args[2]==='--output');writeFileSync(args[3],JSON.stringify(replayValueEngineering(JSON.parse(readFileSync(args[1]))),null,2)+'\n',{flag:'wx'});}
}
