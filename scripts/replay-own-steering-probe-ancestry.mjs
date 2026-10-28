import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),base=join(root,'evidence/own-steering-probe-fixture/20261026-v1');
const read=path=>JSON.parse(readFileSync(path,'utf8')),hash=value=>createHash('sha256').update(value).digest('hex');
const protocol=read(join(base,'protocol.json'));
for(const [name,expected]of Object.entries(protocol.sourceSha256))assert.equal(hash(readFileSync(join(base,'sources',name))),expected);
const {OwnSteeringExperiment}=await import(pathToFileURL(join(base,'sources/learning/own-steering-experiment.mjs')).href);
const earlier=read(join(base,'earlier.json')),later=read(join(base,'later.json')),run=OwnSteeringExperiment.restore(earlier);
run.advance(later.world.world.tick-earlier.world.world.tick);assert.deepEqual(run.checkpoint(false),later);
const result={schema:1,passed:true,earlierTick:earlier.world.world.tick,laterTick:later.world.world.tick,
  earlierSha256:hash(readFileSync(join(base,'earlier.json'))),laterSha256:hash(readFileSync(join(base,'later.json'))),
  scope:'Exact captured-source checkpoint replay, not an independent physics implementation.'};
writeFileSync(join(base,'ancestry-replay.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
