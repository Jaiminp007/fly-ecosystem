import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve, relative, isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {cueObservation} from '../learning/cue-foraging.mjs';
import {odorIdentityCode, odorIdentityFeatures, ODOR_IDENTITY_SCALAR_OPERATIONS} from '../learning/odor-identity.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const signedPatterns = Array.from({length: 16}, (_,pattern) => Array.from({length: 4}, (_,index) => (pattern >> index & 1) ? 1 : -1));
const dot = (left, right) => left.reduce((sum, value, index) => sum + value * right[index], 0);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

function contexts() {
  const result = [];
  for (const energy of [.1,.5,.9]) for (const proximity of [0,.5,1]) for (const previousIntake of [-1,0,1]) {
    for (const walls of [[0,0],[1,0],[0,1]]) for (const history of ['empty','neutral','fixed-cue']) {
      result.push({energy,proximity,previousIntake,walls,history});
    }
  }
  return result;
}

function observationFor(context, bits) {
  const raw = Array(17).fill(0);
  raw[0] = 1; raw[3] = context.proximity; raw[4] = context.energy;
  raw[10] = context.walls[0]; raw[11] = context.walls[1]; raw[13] = context.previousIntake; raw[16] = 1;
  return cueObservation(raw, bits);
}

function stateFor(context) {
  const past = Array(17).fill(0);
  past[0] = 1; past[3] = .5; past[4] = .5; past[16] = 1;
  const historyObservation = cueObservation(past, context.history === 'neutral' ? [0,0,0,0] : [1,-1,1,-1]);
  return {history: context.history === 'empty' ? [] : [1,-1,1].map(choice => ({observation: [...historyObservation],choice})),
    rngState: 41, retentionRngState: 69, replayRngState: 101, taskId: 'unused', valence: -1,
    body: {energy: context.energy}, weights: [3,7], work: {scalarOperations: 13,liveUpdates: 0,replayUpdates: 0}};
}

test('all 16 Walsh codes and all pairs are exact across the 243 prior nuisance/history contexts', () => {
  assert.equal(contexts().length, 243);
  for (const context of contexts()) {
    const state = stateFor(context), before = structuredClone(state);
    const rows = signedPatterns.map(bits => {
      const observation = Object.freeze(observationFor(context,bits));
      const signs = Object.freeze([...bits]);
      const features = odorIdentityFeatures(state,observation);
      assert.deepEqual(features,odorIdentityCode(signs));
      assert.equal(features.length,16);
      assert.ok(features.every(value => value === .25 || value === -.25));
      for (let subset = 0; subset < 16; subset++) {
        const expected = bits.reduce((product, sign, index) => subset & (1 << index) ? product * sign : product, .25);
        assert.equal(features[subset],expected);
      }
      return features;
    });
    for (let left = 0; left < 16; left++) for (let right = 0; right < 16; right++) {
      assert.equal(dot(rows[left],rows[right]),left === right ? 1 : 0);
    }
    assert.equal(state.work.scalarOperations,before.work.scalarOperations + 16 * ODOR_IDENTITY_SCALAR_OPERATIONS.odor);
    state.work.scalarOperations = before.work.scalarOperations;
    assert.deepEqual(state,before);
  }
});

test('shared support is not pressure: direct B-gradient leaves all other odor logits unchanged without decay/traces', () => {
  const rows = signedPatterns.map(odorIdentityCode);
  const weights = Array.from({length: 16}, (_,index) => (index - 7) / 8);
  for (let updated = 0; updated < 16; updated++) {
    const next = weights.map((weight,index) => weight + .5 * rows[updated][index]);
    for (let probed = 0; probed < 16; probed++) {
      assert.equal(dot(next,rows[probed]) - dot(weights,rows[probed]),updated === probed ? .5 : 0);
    }
  }
});

test('neutral is exactly zero: no learned transfer can come from this block alone', () => {
  for (const context of contexts()) {
    const state = stateFor(context), before = structuredClone(state);
    assert.deepEqual(odorIdentityCode([0,0,0,0]),Array(16).fill(0));
    assert.deepEqual(odorIdentityFeatures(state,observationFor(context,[0,0,0,0])),Array(16).fill(0));
    assert.equal(state.work.scalarOperations,before.work.scalarOperations + ODOR_IDENTITY_SCALAR_OPERATIONS.neutral);
    state.work.scalarOperations = before.work.scalarOperations;
    assert.deepEqual(state,before);
  }
  const first = odorIdentityCode(signedPatterns[0]);
  first[0] = 9;
  assert.equal(odorIdentityCode(signedPatterns[0])[0],.25);
});

test('only binary signs or all-zero neutral are accepted; malformed calls never charge work', () => {
  const context = contexts()[0], state = stateFor(context), before = structuredClone(state);
  for (let encoded = 0; encoded < 81; encoded++) {
    const signs = Array.from({length: 4}, (_,index) => Math.floor(encoded / 3 ** index) % 3 - 1);
    if (signs.every(value => value !== 0) || signs.every(value => value === 0)) continue;
    assert.throws(() => odorIdentityCode(signs),TypeError);
    assert.throws(() => odorIdentityFeatures(state,observationFor(context,signs)),TypeError);
  }
  for (const signs of [null, {}, [], Array(4), [1,1,1], [1,1,1,1,1], [NaN,1,1,1],
    [Infinity,1,1,1], [-Infinity,1,1,1], [.1,1,1,1], ['1',1,1,1], [true,1,1,1]]) {
    assert.throws(() => odorIdentityCode(signs),TypeError);
  }
  const valid = observationFor(context,signedPatterns[0]);
  for (const observation of [null, {}, [], Array(17), valid.slice(1), [...valid,0]]) {
    assert.throws(() => odorIdentityFeatures(state,observation),TypeError);
  }
  for (let index = 0; index < 17; index++) for (const invalid of [NaN,Infinity,-Infinity,undefined,'0',null]) {
    const observation = [...valid]; observation[index] = invalid;
    assert.throws(() => odorIdentityFeatures(state,observation),TypeError);
  }
  for (let index = 0; index < 4; index++) for (const invalid of [1e-100,-1e-100,.25,1 - Number.EPSILON,2]) {
    const observation = [...valid]; observation[index] = invalid;
    assert.throws(() => odorIdentityFeatures(state,observation),TypeError);
  }
  for (const invalid of [-1,NaN,Infinity,.5,Number.MAX_SAFE_INTEGER]) {
    assert.throws(() => odorIdentityFeatures({work: {scalarOperations: invalid}},valid),TypeError);
  }
  for (const invalid of [null,{}, {work: {}}]) assert.throws(() => odorIdentityFeatures(invalid,valid),TypeError);
  assert.deepEqual(state,before);
});

test('no state field outside work, RNG or random source is accessed', () => {
  const work = {scalarOperations: 0};
  const state = new Proxy({}, {get: (_,key) => {
    assert.equal(key,'work');
    return work;
  }});
  const previousRandom = Math.random;
  Math.random = () => { throw new Error('RNG must not be used'); };
  try {
    assert.deepEqual(odorIdentityFeatures(state,observationFor(contexts()[0],[1,-1,1,-1])),odorIdentityCode([1,-1,1,-1]));
  } finally {
    Math.random = previousRandom;
  }
});

test('independent Fraction auditor checks records, source hashes, tampering and exclusive CLI output', () => {
  const directory = mkdtempSync(join(tmpdir(),'odor-identity-'));
  try {
    const sourceSha256 = {};
    for (const name of ['learning/odor-identity.mjs','tests/odor-identity.test.mjs','scripts/audit-odor-identity.py']) {
      const bytes = readFileSync(join(root,name));
      const destination = join(directory,'sources',name);
      mkdirSync(resolve(destination,'..'),{recursive: true});
      writeFileSync(destination,bytes,{flag: 'wx'});
      sourceSha256[name] = sha(bytes);
    }
    const protocol = JSON.stringify({kind: 'odor-identity-algebra-v1',sourceSha256,scope: 'Test-only algebra fixture; not learner evidence.'});
    writeFileSync(join(directory,'protocol.json'),protocol,{flag: 'wx'});
    const record = {protocolSha256: sha(protocol),contexts: contexts().map(context => ({...context,
      patterns: signedPatterns.map(bits => ({bits,features: odorIdentityFeatures(stateFor(context),observationFor(context,bits))}))})),
      neutral: odorIdentityCode([0,0,0,0])};
    writeFileSync(join(directory,'codes.json'),JSON.stringify(record),{flag: 'wx'});
    const auditor = join(root,'scripts/audit-odor-identity.py');
    const python = process.env.PYTHON || 'python';
    const script = [
      'import copy, importlib.util, json, pathlib, sys',
      'sys.dont_write_bytecode = True',
      'spec = importlib.util.spec_from_file_location("odor_audit", sys.argv[1])',
      'module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)',
      'directory = pathlib.Path(sys.argv[2])',
      'record = json.loads((directory / "codes.json").read_text())',
      'summary = module.audit(directory)',
      'assert summary["contexts"] == 243 and summary["minimumRank"] == 16',
      'assert summary["featureEvaluations"] == 3888 and summary["sourceFilesVerified"] == 3',
      'def rejected(record):',
      '    try: module.audit_codes(record)',
      '    except (ValueError, TypeError): return',
      '    raise AssertionError("Invalid record accepted")',
      'bad = copy.deepcopy(record); bad["contexts"][0]["patterns"][0]["features"][0] = .125; rejected(bad)',
      'bad = copy.deepcopy(record); bad["contexts"][0]["patterns"][0]["features"][0] = float("nan"); rejected(bad)',
      'bad = copy.deepcopy(record); bad["contexts"][0]["patterns"][0]["bits"][0] = 0; rejected(bad)',
      'bad = copy.deepcopy(record); bad["contexts"][0]["patterns"][0]["bits"][0] = True; rejected(bad)',
      'bad = copy.deepcopy(record); bad["contexts"][0]["patterns"][0] = bad["contexts"][0]["patterns"][1]; rejected(bad)',
      'bad = copy.deepcopy(record); bad["contexts"][0] = bad["contexts"][1]; rejected(bad)',
      'bad = copy.deepcopy(record); bad["neutral"][0] = .25; rejected(bad)',
      'bad = copy.deepcopy(record); bad["contexts"].pop(); rejected(bad)',
      'print(json.dumps(summary))'
    ].join('\n');
    const checked = spawnSync(python,['-B','-c',script,auditor,directory],{encoding: 'utf8'});
    assert.equal(checked.status,0,checked.stderr || checked.error?.message);
    assert.equal(JSON.parse(checked.stdout).passed,true);
    const output = join(directory,'audit.json');
    const run = () => spawnSync(python,['-B',auditor,directory,'--output',output],{encoding: 'utf8'});
    const first = run();
    assert.equal(first.status,0,first.stderr);
    const original = readFileSync(output,'utf8');
    assert.equal(JSON.parse(original).minimumRank,16);
    assert.notEqual(run().status,0);
    assert.equal(readFileSync(output,'utf8'),original);
    writeFileSync(join(directory,'protocol.json'),protocol + '\n');
    const mismatch = spawnSync(python,['-B',auditor,directory],{encoding: 'utf8'});
    assert.notEqual(mismatch.status,0);
    assert.match(mismatch.stderr,/Protocol hash mismatch/);
    writeFileSync(join(directory,'protocol.json'),protocol);
    writeFileSync(join(directory,'sources/learning/odor-identity.mjs'),'tampered');
    const sourceMismatch = spawnSync(python,['-B',auditor,directory],{encoding: 'utf8'});
    assert.notEqual(sourceMismatch.status,0);
    assert.match(sourceMismatch.stderr,/Source hash mismatch/);
  } finally {
    const target = resolve(directory);
    const withinTemporaryDirectory = relative(resolve(tmpdir()),target);
    assert.ok(withinTemporaryDirectory && !withinTemporaryDirectory.startsWith('..') && !isAbsolute(withinTemporaryDirectory));
    assert.equal(target.split(/[\\/]/).at(-1).startsWith('odor-identity-'),true);
    rmSync(target,{recursive: true,force: true});
  }
});
