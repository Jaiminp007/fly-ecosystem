import test from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createPlatform} from '../platform/server.mjs';

const execute = promisify(execFile);
const root = fileURLToPath(new URL('..', import.meta.url));

test('training CLI matches founders, measures acquired changes and resumes without resetting or duplicating worlds', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'afterwing-training-'));
  const app = await createPlatform({directory: join(directory, 'worlds'), port: 0, realtime: false});
  t.after(async () => { await app.close(); await rm(directory, {recursive: true, force: true}); });
  const output = join(directory, 'campaigns');
  const args = ['scripts/train-platform.py', '--output-dir', output, '--horizon-ticks', '200', '--pause-after'];
  const options = {cwd: root, env: {...process.env, PLATFORM_BASE_URL: `http://127.0.0.1:${app.server.address().port}`}, timeout: 30_000};
  await execute('python3', args, options);
  const id = (await readFile(join(output, 'latest'), 'utf8')).trim();
  const resultPath = join(output, id, 'results.json');
  const original = await readFile(resultPath, 'utf8');
  const results = JSON.parse(original);
  const manifest = JSON.parse(await readFile(join(output, id, 'campaign.json'), 'utf8'));
  assert.equal(results.rows.length, 6);
  assert.equal(app.manager.list().length, 6);
  assert.ok(app.manager.list().every(item => item.paused));
  for (const seed of [7, 23, 111]) {
    const pair = manifest.jobs.filter(job => job.config.seed === seed);
    assert.equal(pair.length, 2);
    assert.equal(pair[0].founders_sha256, pair[1].founders_sha256);
    assert.equal(pair[0].initial_rng, pair[1].initial_rng);
  }
  for (const row of results.rows) {
    assert.equal(row.metrics.tick, 200);
    if (row.learning) assert.ok(row.metrics.learnedMagnitude > 0);
    else assert.equal(row.metrics.learnedMagnitude, 0);
    assert.ok(Math.abs(row.metrics.accountingError) < 1e-6);
  }
  const worlds = app.manager.list().map(item => item.id).sort();
  await execute('python3', args, options);
  assert.deepEqual(app.manager.list().map(item => item.id).sort(), worlds);
  assert.equal(await readFile(resultPath, 'utf8'), original);
  assert.ok(app.manager.list().every(item => item.paused && item.metrics.tick === 200));
});
