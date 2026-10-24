import {RNG} from '../engine.mjs';

// A generic fixed nonlinear feature basis, with learned output connections.
// This is an explicit engineered architecture candidate, not a self-written rule.
export function installProjectionBasis(genome,{count=0,seed=1,scale=3.5}={}){
 if(!genome.actor)throw Error('Projection basis requires a trace actor');
 if(!Number.isInteger(count)||count<0||count>64)throw Error('Projection count must be 0–64');
 if(!Number.isFinite(scale)||scale<=0||scale>8)throw Error('Invalid projection scale');
 const result=structuredClone(genome);if(!count)return result;
 const rng=new RNG((seed>>>0)||1),features=result.nodes.filter(node=>node.memory==='slow');
 if(!features.length)throw Error('Projection basis requires sensory traces');
 let nextId=Math.max(...result.nodes.map(node=>node.id))+1;
 for(let feature=0;feature<count;feature++){
  const id=nextId++;result.nodes.push({id,kind:'hidden',bias:rng.range(-1,1)});
  for(const source of features)result.edges.push({from:source.id,to:id,w:rng.normal()*scale/Math.sqrt(features.length)});
  for(let output=0;output<result.actor.outputs;output++)result.edges.push({from:id,to:result.actor.inputs+output,w:0});
 }
 return result;
}
