const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateRemainingPoints } = require('../js/scoring.js');

test('subtracts a fixed point cost', () => {
  assert.equal(calculateRemainingPoints(1000, { type: 'flat', value: 50 }), 950);
});

test('fixed costs cannot make the score negative', () => {
  assert.equal(calculateRemainingPoints(20, { type: 'flat', value: 100 }), 0);
});

test('subtracts a percentage of the current score', () => {
  assert.equal(calculateRemainingPoints(1000, { type: 'percent', value: 20 }), 800);
});

test('percentage deductions round to the nearest whole point', () => {
  assert.equal(calculateRemainingPoints(33, { type: 'percent', value: 10 }), 30);
});

test('percentage deductions cannot make the score negative', () => {
  assert.equal(calculateRemainingPoints(100, { type: 'percent', value: 150 }), 0);
});

test('an unrecognized reward type leaves the score unchanged', () => {
  assert.equal(calculateRemainingPoints(750, { type: 'unknown', value: 100 }), 750);
});

test('a zero-cost reward does not change the score', () => {
  assert.equal(calculateRemainingPoints(650, { type: 'flat', value: 0 }), 650);
});
