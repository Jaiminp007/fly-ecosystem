// Read-only snapshot intervention. Factual saved weights; never synthetic damage.
import assert from 'node:assert/strict';
import {digest} from './intervention-study.mjs';
import {runTasteProbe} from './taste-experiment.mjs';

export const TASTE_PRESSURE_SPECS=Object.freeze([
  ['A','A'],['A','B'],['A','current'],['A','reset'],
  ['B','A'],['B','B'],['B','current'],['B','reset'],
  ['transfer','current'],['transfer','reset'],['transfer','acceptCruise'],['transfer','acceptStationary']
].map(([family,version])=>Object.freeze({family,version})));

export function runTastePressureBattery(anchor,history,{founders=24,ticks=256,existing={},emit=null}={}){
  const sourceCheckpointSha256=digest(anchor),probes={};
  for(const {family,version} of TASTE_PRESSURE_SPECS){
    const key=`${family}:${version}`,result=existing[key]??runTasteProbe(anchor,{family,version,seed:history.probeSeeds[family],founders,ticks,emit:emit&&family==='A'?(e=>emit({probe:key,event:e})):null});
    assert.equal(result.family,family);assert.equal(result.version,version);assert.equal(result.seed,history.probeSeeds[family]);assert.equal(result.founders,founders);
    probes[key]=result;
  }
  const sham=runTasteProbe(structuredClone(anchor),{family:'A',version:'A',seed:history.probeSeeds.A,founders,ticks,emit:emit?(e=>emit({probe:'sham',event:e})):null});
  assert.deepEqual(sham,probes['A:A']);assert.equal(digest(anchor),sourceCheckpointSha256);
  for(const family of ['A','B','transfer'])assert.equal(new Set(Object.entries(probes).filter(([k])=>k.startsWith(family+':')).map(([,p])=>p.startWorldSha256)).size,1);
  return {schema:1,kind:'taste-functional-pressure',sourceCheckpointSha256,founders,probes,sham};
}

export function tastePressureEffects(battery){
  assert.equal(battery.kind,'taste-functional-pressure');const p=battery.probes;
  const v=key=>p[key].value;
  const food=key=>{const e=p[key].endpoint;return e?(e.totals.beneficialEaten-e.totals.toxinDamage)/battery.founders:0;};
  const aSkill=v('A:A')-v('A:reset'),bSkill=v('B:B')-v('B:reset');
  return {aSkill,bSkill,bAcquisition:v('B:B')-v('B:A'),
    aInterference:v('A:A')-v('A:B')-.05*aSkill,aNetFoodInterference:food('A:A')-food('A:B'),
    aRetention:v('A:current')-.95*v('A:A')-.05*v('A:reset'),
    bRetention:v('B:current')-.95*v('B:B')-.05*v('B:reset'),
    transferReset:v('transfer:current')-v('transfer:reset'),
    transferCruise:v('transfer:current')-v('transfer:acceptCruise'),
    transferStationary:v('transfer:current')-v('transfer:acceptStationary')};
}
