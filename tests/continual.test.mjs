import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateContinual} from '../learning/continual.mjs';

test('one acquired state can learn separate cue channels sequentially; reset controls remove the advantage',()=>{
 const report=evaluateContinual(Array.from({length:10},(_,i)=>8001+i),{learningScale:2,traceRetention:.994});
 assert.equal(report.rows.length,10);
 assert.ok(report.summary.aAfter.ci95[0]>.8);
 assert.ok(report.summary.bAfter.ci95[0]>.8);
 assert.ok(report.summary.aRetentionChange.ci95[0]>=-.05);
 for(const arm of Object.values(report.summary.comparisons))for(const interval of Object.values(arm))assert.ok(interval.ci95[0]>.2);
 assert.equal(report.protocol.taskAChannels.some(channel=>report.protocol.taskBChannels.includes(channel)),false);
});
