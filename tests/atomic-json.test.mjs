import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, writeFile, rename, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {atomicJson} from '../scripts/atomic-json.mjs';

test('transient EPERM replacement preserves the previous checkpoint until rename succeeds', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'afterwing-atomic-'));
  t.after(() => rm(directory, {recursive: true, force: true}));
  const path = join(directory, 'state.json'); await writeFile(path, '{"old":true}\n');
  let calls = 0;
  await atomicJson(path, {new: true}, {wait: async () => {}, renameFile: async (source, target) => {
    calls++;
    assert.equal(await readFile(target, 'utf8'), '{"old":true}\n');
    if (calls === 1) throw Object.assign(new Error('fixture EPERM'), {code: 'EPERM'});
    await rename(source, target);
  }});
  assert.equal(calls, 2); assert.deepEqual(JSON.parse(await readFile(path)), {new: true});
});

test('persistent EPERM has a bounded retry and leaves both old checkpoint and failed temporary output intact', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'afterwing-atomic-'));
  t.after(() => rm(directory, {recursive: true, force: true}));
  const path = join(directory, 'state.json'); await writeFile(path, '{"old":true}\n');
  let calls = 0; const error = Object.assign(new Error('fixture permanent EPERM'), {code: 'EPERM'});
  await assert.rejects(atomicJson(path, {new: true}, {attempts: 3, wait: async () => {}, renameFile: async () => { calls++; throw error; }}), value => value === error);
  assert.equal(calls, 3);
  assert.deepEqual(JSON.parse(await readFile(path)), {old: true});
  assert.deepEqual(JSON.parse(await readFile(path + '.tmp')), {new: true});
});
