const assert = require('assert');
const { parseMarkdown } = require('./app');

const md = `- Fruits
  - Apple
  - Banana
    1. Cavendish
    2. Plantain
- Vegetables
  1. Carrot
  2. Broccoli`;

const expected = '<ul><li>Fruits<ul><li>Apple</li><li>Banana<ol><li>Cavendish</li><li>Plantain</li></ol></li></ul></li><li>Vegetables<ol><li>Carrot</li><li>Broccoli</li></ol></li></ul>';

const output = parseMarkdown(md);
assert.strictEqual(output, expected);

console.log('Nested list parsing test passed.');
