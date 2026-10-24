// Verification-only reconstruction of one captured target learner for each
// selected algorithm. No labels feed back to search or affect its decisions.
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve, join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const directory = resolve(process.argv[2] || ''), load = async file => JSON.parse(await readFile(join(directory, file))), hash = bytes => createHash('sha256').update(bytes).digest('hex');
const r = await load('results.json'), p = r.protocol;
for (const [file, sha] of Object.entries(p.sourceSha256)) assert.equal(hash(await readFile(join(directory, 'sources', file))), sha);
const search = await import(pathToFileURL(join(directory, 'sources/learning/revision-search.mjs'))), api = await import(pathToFileURL(join(directory, 'sources/learning/kernel-learner.mjs')));
const captured = new Set(), rows = [];
for (const history of r.rows) {
  const worlds = await load('histories/' + history.index + '/worlds.json'), task = search.prepareRevisionTask(worlds.filter(w => w.seed === history.targetSeed));
  for (const arm of p.arms) {
    const program = history.sessions[arm].selected, id = search.programId(program);
    if (captured.has(id)) continue;
    captured.add(id);
    const agent = task.agents[0], state = api.migrateKernel(agent.old, program);
    for (const example of agent.bTrain) api.updateKernel(state, example.input, example.target);
    assert.equal(hash(JSON.stringify(state)), history.final[arm].rows[0].finalStateHash);
    rows.push({program, rows: [{seed: history.targetSeed, perAgent: [{agentId: agent.agentId, finalState: state}]}], origin: {history: history.index, arm}});
  }
}
const bytes = JSON.stringify({rows, resultsSha256: hash(await readFile(join(directory, 'results.json'))), scope: 'One verification-only target founder state per distinct algorithm selected by a policy; matches its recorded state hash, not every study model.'}) + '\n';
await writeFile(join(directory, 'numeric-oracle-input.json'), bytes);
const source = await readFile(new URL(import.meta.url)); await writeFile(join(directory, 'numeric-capture-source.mjs'), source);
console.log(JSON.stringify({directory, capturedPrograms: [...captured], states: rows.length, inputSha256: hash(bytes), captureSourceSha256: hash(source)}));
