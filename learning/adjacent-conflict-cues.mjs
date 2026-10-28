import assert from 'node:assert/strict';
import {makeCueCodebook} from './cue-foraging.mjs';

export function cueTasteFeatures(bits){
  assert.ok(Array.isArray(bits)&&bits.length===4&&bits.every(value=>value===-1||value===1));const values=[1,...bits];
  for(let first=0;first<4;first++)for(let second=first+1;second<4;second++)values.push(bits[first]*bits[second]);return values;
}
export function cueFeatureRank(cues){
  const matrix=cues.map(cue=>cueTasteFeatures(cue.bits));let pivot=0;
  for(let column=0;column<11&&pivot<matrix.length;column++){
    let row=pivot;while(row<matrix.length&&Math.abs(matrix[row][column])<1e-9)row++;if(row===matrix.length)continue;
    [matrix[pivot],matrix[row]]=[matrix[row],matrix[pivot]];const divisor=matrix[pivot][column];for(let index=column;index<11;index++)matrix[pivot][index]/=divisor;
    for(let below=pivot+1;below<matrix.length;below++){const factor=matrix[below][column];for(let index=column;index<11;index++)matrix[below][index]-=factor*matrix[pivot][index];}pivot++;
  }
  return pivot;
}
export function makeAdjacentConflictCodebook(seed){
  const base=makeCueCodebook(seed),first=structuredClone(base.A),used=new Set(first.map(item=>item.id));let matched=null;
  function search(index,candidates){
    if(index===first.length){if(cueFeatureRank([...first,...candidates])===8)matched=structuredClone(candidates);return;}
    const item=first[index];for(let bit=0;bit<4&&!matched;bit++){
      const id=((item.id-1)^(1<<bit))+1;if(used.has(id))continue;used.add(id);
      search(index+1,[...candidates,{id,bits:Array.from({length:4},(_,position)=>((id-1)>>position&1)?1:-1),valence:-item.valence}]);used.delete(id);
    }
  }
  search(0,[]);assert.ok(matched);for(const item of matched)used.add(item.id);
  const candidates=[...base.C,...base.B,...Array.from({length:16},(_,index)=>({id:index+1,bits:Array.from({length:4},(_,position)=>(index>>position&1)?1:-1)}))],third=[];
  for(const item of candidates){if(used.has(item.id))continue;used.add(item.id);third.push({id:item.id,bits:[...item.bits],valence:base.C[third.length].valence});if(third.length===4)break;}
  assert.equal(third.length,4);return {A:first,B:matched,C:third};
}
