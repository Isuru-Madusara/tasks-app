const test = require('node:test');
const assert = require('node:assert');
const { validateTitle } = require('../validate');

test('accepts a normal title', () => assert.strictEqual(validateTitle('Buy milk'), true));
test('rejects empty title', () => assert.strictEqual(validateTitle('   '), false));
test('rejects non-string', () => assert.strictEqual(validateTitle(42), false));
test('rejects very long title', () => assert.strictEqual(validateTitle('a'.repeat(201)), false));
