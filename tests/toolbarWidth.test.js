// Node 18+ test for toolbar width normalization
const assert = require('node:assert/strict');
const test = require('node:test');
const widthUtilsModule = require('../src/utils/toolbarWidth.js');

const {
  WIDTH_MIN,
  WIDTH_MAX,
  DEFAULT_WIDTH,
  EXPAND_THRESHOLD,
  normalizeToolbarWidth,
  deriveExpandFlag
} = widthUtilsModule;

test('clamps toolbar width within expected bounds', () => {
  assert.equal(normalizeToolbarWidth(180), WIDTH_MIN);
  assert.equal(normalizeToolbarWidth(500), WIDTH_MAX);
  assert.equal(normalizeToolbarWidth('not-a-number'), DEFAULT_WIDTH);
});

test('rounds fractional widths and derives expand flag consistently', () => {
  assert.equal(normalizeToolbarWidth(259.6), 260);
  assert.equal(deriveExpandFlag(EXPAND_THRESHOLD - 1), false);
  assert.equal(deriveExpandFlag(EXPAND_THRESHOLD), true);
  assert.equal(deriveExpandFlag(EXPAND_THRESHOLD + 40), true);
});
