import assert from 'node:assert/strict';
import {cueSteeringRoute} from './cue-shared-steering.mjs';

export function certifyCueNative(steering,own,work,scratch){
  assert.ok(steering&&!steering.dead&&!steering.acquisition&&steering.pending===null);
  assert.ok(Array.isArray(own.raw)&&own.raw.length===17&&Array.isArray(own.cue)&&own.cue.length===4);
  scratch.route=0;scratch.upper=0;scratch.reason=0;scratch.known=[0,0,0,0,0,0];work.scalarOperations+=32;
  if(!own.raw.every(Number.isFinite)||!Number.isFinite(own.energy)||Math.abs(own.raw[13])>1||
    !(own.cue.every(value=>value===0)||own.cue.every(value=>value===-1||value===1)))return false;
  const context=cueSteeringRoute(own.cue),bank=steering.contextWeights[context];scratch.route=context;work.scalarOperations+=9;
  const known=[1,Math.max(0,Math.min(1,own.energy/120)),own.raw[10],own.raw[11],own.raw[13],Math.max(-1,Math.min(1,own.raw[12]))];
  scratch.known=known;work.scalarOperations+=13;let upper=0,magnitude=1,equal=true;
  for(let index=0;index<8;index++){
    const positive=steering.weights[1][index]+bank[1][index],negative=steering.weights[0][index]+bank[0][index],difference=positive-negative;work.scalarOperations+=14;
    if(!Number.isFinite(positive)||!Number.isFinite(negative))return false;
    equal=equal&&positive===negative;magnitude+=Math.abs(positive)+Math.abs(negative);
    if(index<6)upper+=difference*known[index];else if(index===6)upper+=Math.max(0,difference)*(1+1e-12);else upper+=Math.abs(difference)*(1+1e-12);
  }
  upper+=1e-12*magnitude;scratch.upper=upper;work.scalarOperations+=6;if(!Number.isFinite(upper))return false;
  if(equal){scratch.reason=1;work.scalarOperations++;return true;}
  if(upper<0){scratch.reason=2;work.scalarOperations++;return true;}
  return false;
}
