import assert from 'node:assert/strict';

export function certifyFrozenNativeSteering(steering,own,work,scratch){
  assert.ok(steering&&!steering.dead&&!steering.acquisition&&steering.pending===null);
  assert.ok(Array.isArray(steering.weights)&&steering.weights.length===2&&Array.isArray(steering.contextWeights)&&steering.contextWeights.length===17);
  assert.ok(Array.isArray(own.raw)&&own.raw.length===17);
  scratch.known=[];scratch.upper=0;scratch.reason=0;work.scalarOperations+=25;
  if(!own.raw.every(Number.isFinite)||!Number.isFinite(own.energy)||Math.abs(own.raw[13])>1)return false;
  if(own.raw[10]!==0||own.raw[11]!==0){scratch.reason=1;work.scalarOperations+=2;return true;}
  const known=[1,Math.max(0,Math.min(1,own.energy/120)),own.raw[10],own.raw[11],own.raw[13],Math.max(-1,Math.min(1,own.raw[12]))];
  scratch.known=known;work.scalarOperations+=13;
  let maximum=-Infinity;
  for(const bank of steering.contextWeights){
    let upper=0,magnitude=1;
    for(let index=0;index<8;index++){
      const positive=steering.weights[1][index]+bank[1][index],negative=steering.weights[0][index]+bank[0][index],difference=positive-negative;
      if(!Number.isFinite(positive)||!Number.isFinite(negative))return false;
      magnitude+=Math.abs(positive)+Math.abs(negative);
      if(index<6)upper+=difference*known[index];else if(index===6)upper+=Math.max(0,difference);else upper+=Math.abs(difference);
      work.scalarOperations+=12;
    }
    const slack=1e-12*magnitude;upper+=slack;work.scalarOperations+=4;
    if(!Number.isFinite(upper))return false;
    maximum=Math.max(maximum,upper);work.scalarOperations++;
  }
  scratch.upper=maximum;work.scalarOperations++;
  if(maximum<0){scratch.reason=2;work.scalarOperations++;return true;}
  return false;
}
