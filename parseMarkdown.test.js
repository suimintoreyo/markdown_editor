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

const paragraphsMd = `First paragraph\n\nSecond paragraph`;
const paragraphsExpected = '<p>First paragraph</p><p>Second paragraph</p>';
assert.strictEqual(parseMarkdown(paragraphsMd), paragraphsExpected);
console.log('Paragraph splitting test passed.');

const lineBreakMd = `Line one  \nLine two`;
const lineBreakExpected = '<p>Line one<br>Line two</p>';
assert.strictEqual(parseMarkdown(lineBreakMd), lineBreakExpected);
console.log('Line break conversion test passed.');

const blockquoteMd = `>>> Nested quote`;
const blockquoteExpected = '<blockquote><blockquote><blockquote>Nested quote</blockquote></blockquote></blockquote>';
assert.strictEqual(parseMarkdown(blockquoteMd), blockquoteExpected);
console.log('Nested blockquote parsing test passed.');

const hrDashMd = '---';
const hrDashExpected = '<hr />';
assert.strictEqual(parseMarkdown(hrDashMd), hrDashExpected);
console.log('Horizontal rule (dash) test passed.');

const hrAsteriskMd = '***';
const hrAsteriskExpected = '<hr />';
assert.strictEqual(parseMarkdown(hrAsteriskMd), hrAsteriskExpected);
console.log('Horizontal rule (asterisk) test passed.');

const hrUnderscoreMd = '___';
const hrUnderscoreExpected = '<hr />';
assert.strictEqual(parseMarkdown(hrUnderscoreMd), hrUnderscoreExpected);
console.log('Horizontal rule (underscore) test passed.');

const backtickCodeBlockMd = '```\ncode\n```';
const backtickCodeBlockExpected = '<pre><code>code\n</code></pre>';
assert.strictEqual(parseMarkdown(backtickCodeBlockMd), backtickCodeBlockExpected);
console.log('Backtick code block parsing test passed.');

const tildeCodeBlockMd = '~~~\ncode\n~~~';
const tildeCodeBlockExpected = '<pre><code>code\n</code></pre>';
assert.strictEqual(parseMarkdown(tildeCodeBlockMd), tildeCodeBlockExpected);
console.log('Tilde code block parsing test passed.');

const inlineCodeMd = 'This has `code` inline';
const inlineCodeExpected = '<p>This has <code>code</code> inline</p>';
assert.strictEqual(parseMarkdown(inlineCodeMd), inlineCodeExpected);
console.log('Inline code conversion test passed.');

const indentedSpaceCodeMd = '    line1\n    line2';
const indentedSpaceCodeExpected = '<pre><code>line1\nline2\n</code></pre>';
assert.strictEqual(parseMarkdown(indentedSpaceCodeMd), indentedSpaceCodeExpected);
console.log('Indented code block (spaces) parsing test passed.');

const tabCodeMd = '\tline1\n\tline2';
const tabCodeExpected = '<pre><code>line1\nline2\n</code></pre>';
assert.strictEqual(parseMarkdown(tabCodeMd), tabCodeExpected);
console.log('Indented code block (tab) parsing test passed.');

const dashListMd = '- Item';
const dashListExpected = '<ul><li>Item</li></ul>';
assert.strictEqual(parseMarkdown(dashListMd), dashListExpected);
console.log('Dash list marker test passed.');

const starListMd = '* Item';
const starListExpected = '<ul><li>Item</li></ul>';
assert.strictEqual(parseMarkdown(starListMd), starListExpected);
console.log('Asterisk list marker test passed.');

const plusListMd = '+ Item';
const plusListExpected = '<ul><li>Item</li></ul>';
assert.strictEqual(parseMarkdown(plusListMd), plusListExpected);
console.log('Plus list marker test passed.');

const deepOrderedListMd = `1. Level 1\n  1. Level 2\n    1. Level 3\n      1. Level 4\n2. Level 1 again`;
const deepOrderedListExpected = '<ol><li>Level 1<ol><li>Level 2<ol><li>Level 3<ol><li>Level 4</li></ol></li></ol></li></ol></li><li>Level 1 again</li></ol>';
assert.strictEqual(parseMarkdown(deepOrderedListMd), deepOrderedListExpected);
console.log('Deep ordered list nesting test passed.');

const variedNumberOrderedListMd = `3. Three\n1. One\n2. Two\n  7. Two-Seven\n5. Five`;
const variedNumberOrderedListExpected = '<ol><li>Three</li><li>One</li><li>Two<ol><li>Two-Seven</li></ol></li><li>Five</li></ol>';
assert.strictEqual(parseMarkdown(variedNumberOrderedListMd), variedNumberOrderedListExpected);
console.log('Ordered list numbering variation test passed.');

const linkMd = '[text](url)';
const linkExpected = '<p><a href="url">text</a></p>';
assert.strictEqual(parseMarkdown(linkMd), linkExpected);
console.log('Link conversion test passed.');

const refLinkMd = `[text][id]\n\n[id]: url`;
const refLinkExpected = '<p><a href="url">text</a></p>';
assert.strictEqual(parseMarkdown(refLinkMd), refLinkExpected);
console.log('Reference link conversion test passed.');
