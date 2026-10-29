import assert from 'node:assert/strict';

const cue=value=>Array.isArray(value)&&value.length===4&&
  (Array.from(value).every(v=>v===0)||Array.from(value).every(v=>v===1||v===-1));

// A separate prospective observation intervention. No default engine imports it.
export function contactObservation(fly,patches,fallbackCue,work,{compareCues=false}={}) {
  assert.ok(Number.isFinite(fly.x)&&Number.isFinite(fly.y)&&Array.isArray(patches)&&cue(fallbackCue));
  assert.equal(typeof compareCues,'boolean');
  assert.ok(Number.isSafeInteger(work.scalarOperations)&&work.scalarOperations>=0);
  let nearest=Infinity,selected=fallbackCue,contactPresent=false,firstCue=null,homogeneous=true;
  for(const patch of patches){
    assert.ok(Number.isFinite(patch.x)&&Number.isFinite(patch.y)&&cue(patch.cue));
    const dx=patch.x-fly.x,dy=patch.y-fly.y,squared=dx*dx+dy*dy;
    work.scalarOperations+=6;
    if(squared<=225){
      work.scalarOperations++;
      if(compareCues){
        if(firstCue===null)firstCue=patch.cue;
        for(let index=0;index<4;index++)if(patch.cue[index]!==firstCue[index])homogeneous=false;
        work.scalarOperations+=6;
      }
      if(squared<nearest){nearest=squared;selected=patch.cue;contactPresent=true;}
    }
  }
  // Presence is computed from the selected observable odor, not hidden identity.
  const odorPresent=selected[0]!==0;
  work.scalarOperations++;
  assert.ok(Number.isSafeInteger(work.scalarOperations));
  return {cue:[...selected],contactPresent,odorPresent,...(compareCues?{contactHomogeneous:contactPresent&&homogeneous}:{})};
}
