import test from 'node:test';
import assert from 'node:assert/strict';
import {makeAdjacentConflictCodebook,cueFeatureRank} from '../learning/adjacent-conflict-cues.mjs';
import {makeCueCodebook} from '../learning/cue-foraging.mjs';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {VALUE_REFERENCE} from '../learning/value-development.mjs';

test('adjacent conflicting families are deterministic, distinct, balanced and jointly representable',()=>{
  for(let seed=1;seed<=256;seed++){
    const book=makeAdjacentConflictCodebook(seed);assert.deepEqual(book,makeAdjacentConflictCodebook(seed));assert.deepEqual(book.A,makeCueCodebook(seed).A);
    const all=[...book.A,...book.B,...book.C];assert.equal(new Set(all.map(item=>item.id)).size,12);assert.equal(cueFeatureRank([...book.A,...book.B]),8);
    for(const family of ['A','B','C'])assert.equal(book[family].reduce((sum,item)=>sum+item.valence,0),0);
    for(let index=0;index<4;index++){const left=book.A[index],right=book.B[index];assert.equal(left.valence,-right.valence);assert.equal(left.bits.filter((bit,position)=>bit!==right.bits[position]).length,1);}
  }
});
test('opt-in curriculum preserves A physical world and does not expose labels to agents',()=>{
  const history={seed:1172370180,cueSeed:779516274,resourceSeeds:[420032585,2354526836,3935934626,1347207440]};
  const options={history,reference:{...VALUE_REFERENCE,founders:4},acquisitionGeometry:'continual',steeringLearner:'cue-shared',spatialSelector:'incremental',contactCueMode:'filter',targetCueMode:'observe'};
  const normal=new OdorRoutedExperiment(options),conflict=new OdorRoutedExperiment({...options,cueCurriculum:'adjacent-opposed'});assert.deepEqual(normal.world.checkpoint(),conflict.world.checkpoint());assert.deepEqual(normal.learners,conflict.learners);
  let decisions=0;conflict.attach(event=>{if(event.type==='decision'){decisions++;assert.equal(Object.hasOwn(event.own,'valence'),false);assert.equal(Object.hasOwn(event.own,'family'),false);}});conflict.advance(3);assert.ok(decisions>0);conflict.attach(null);
  const restored=OdorRoutedExperiment.restore(conflict.checkpoint());conflict.advance(5);restored.advance(5);assert.deepEqual(conflict.checkpoint(),restored.checkpoint());
  assert.throws(()=>new OdorRoutedExperiment({...options,cueCurriculum:'oracle'}));
});
