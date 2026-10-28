// Proposed bounded local receptor, not a map or future outcome oracle. The
// caller supplies only patches already within this body's normal sense range.
// During offline evaluation it is instrumented at the actual sensory phase.
export function localResourceSense(body,nearby){
  if(!body||!Number.isFinite(body.x)||!Number.isFinite(body.y)||!Number.isFinite(body.genome?.traits?.sense)||body.genome.traits.sense<=0||!Array.isArray(nearby))throw Error('Invalid local resource sensing input');
  const range=body.genome.traits.sense;let best=null,score=0;
  for(const patch of nearby){
    if(!Number.isFinite(patch.x)||!Number.isFinite(patch.y)||!Number.isFinite(patch.amount)||patch.amount<0)throw Error('Invalid local resource patch');
    const distance=Math.hypot(body.x-patch.x,body.y-patch.y);if(distance>range||patch.amount<=.06)continue;
    const value=patch.amount/(distance+20);if(value>score){best=patch;score=value;}
  }
  // Same selected patch as the existing bearing/proximity receptor. Extra
  // reading is its current amount compressed to [0,1), with no preferred action.
  return best?best.amount/(1+best.amount):0;
}
