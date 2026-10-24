import test from 'node:test';
import assert from 'node:assert/strict';
import {compareRecordedRow} from '../scripts/audit-mushroom-physical.mjs';
test('physical JSON audit distinguishes signed-zero serialization from every representable numeric change', () => {
  assert.equal(compareRecordedRow({a: [-0, 2]}, {a: [0, 2]}), 1);
  assert.throws(() => compareRecordedRow({a: [-0, 2 + 1e-12]}, {a: [0, 2]}));
  assert.throws(() => compareRecordedRow({a: [-0, 2], extra: 1}, {a: [0, 2]}));
});
