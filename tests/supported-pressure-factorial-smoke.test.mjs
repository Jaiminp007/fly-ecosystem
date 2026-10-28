import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync,gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {OdorRoutedExperiment} from '../learning/odor-routed-experiment.mjs';
import {installTasteSteeringCrossover} from '../learning/taste-steering-crossover.mjs';

test('short matched factorial preserves assignments, gzip events and deterministic replay',()=>{
  const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/supported-steering-development/20261026-v1'),protocol=JSON.parse(readFileSync(join(base,'protocol.json'))),history=protocol.histories[0],anchors={};
  for(const phase of ['A','B','D'])anchors[phase]=JSON.parse(gunzipSync(readFileSync(join(base,'anchors',history.seed+'-protect-'+phase+'.json.gz'))).toString());
  const normalized=value=>JSON.parse(JSON.stringify(value)),hash=value=>createHash('sha256').update(value).digest('hex');let common=null;
  for(const arm of ['AA','AB','BA','BB']){
    const settings={phase:'A',seed:history.probeSeeds.A,mode:'current',modelAnchor:anchors.A,steeringMode:'learned',compactFrozen:true},run=OdorRoutedExperiment.fork(anchors.D,settings),check=OdorRoutedExperiment.fork(anchors.D,settings);
    installTasteSteeringCrossover(run,anchors[arm[0]],anchors[arm[1]]);
    for(const fly of check.world.flies){const state=check.learners[fly.id],taste=anchors[arm[0]].state.learners[fly.id],steering=anchors[arm[1]].state.learners[fly.id];
      state.taste.weights=structuredClone(taste.taste.weights);state.cueTaste.weights=structuredClone(taste.cueTaste.weights);state.cueTaste.residuals=structuredClone(taste.cueTaste.residuals);state.steering.weights=structuredClone(steering.steering.weights);state.steering.contextWeights=structuredClone(steering.steering.contextWeights);
      assert.equal(state.work.scalarOperations,state.charge.operationsBilled);state.work.scalarOperations+=326;state.charge.storageBytes=0;const due=326*check.pricing.operationEnergy;state.charge.operationsBilled+=326;state.charge.outstandingEnergy+=due;state.charge.incurredEnergy+=due;
    }
    assert.deepEqual(normalized(check.checkpoint(false)),normalized(run.checkpoint(false)));const worldHash=hash(JSON.stringify(run.world.checkpoint()));if(common===null)common=worldHash;else assert.equal(worldHash,common);
    const lines=[],packed=[];run.attach(event=>{const line=JSON.stringify(event)+'\n';lines.push(line);packed.push(gzipSync(line));});const endpoint=run.advance(5);run.attach(null);
    const raw=lines.join(''),decoded=gunzipSync(Buffer.concat(packed)).toString();assert.equal(decoded,raw);const digest=hash(raw),replayed=[];check.attach(event=>replayed.push(JSON.stringify(event)+'\n'));const replayEndpoint=check.advance(5);check.attach(null);
    assert.deepEqual(replayEndpoint,endpoint);assert.deepEqual(normalized(check.checkpoint(false)),normalized(run.checkpoint(false)));assert.equal(hash(replayed.join('')),digest);
  }
});
