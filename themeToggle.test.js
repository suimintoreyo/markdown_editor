const assert = require('assert');
const { parseMarkdown } = require('./markdown_editor');

// Minimal DOM stub for codeBlockSyntax_java.js
const root = {
  attrs: {},
  setAttribute(name, value) { this.attrs[name] = value; },
  getAttribute(name) { return this.attrs[name]; },
  removeAttribute(name) { delete this.attrs[name]; }
};

global.document = {
  documentElement: root,
  querySelectorAll() { return []; },
  body: {}
};

global.MutationObserver = function() { return { observe() {} }; };

const { toggleTheme } = require('./codeBlockSyntax_java.js');

// Markdown containing inline code and a code block
const md = 'Inline `code` and:\n\n```java\nint x = 1;\n```';
const html = parseMarkdown(md);

// Ensure both inline and block code are rendered
assert(html.includes('<code>code</code>'));
assert(html.includes('<pre><button class="copy-btn">Copy</button><code class="language-java" data-tokenized="0">int x = 1;\n</code></pre>'));

// Toggle on
 toggleTheme('light');
assert.strictEqual(document.documentElement.getAttribute('data-theme'), 'light');

// Toggle off
 toggleTheme('light');
assert.strictEqual(document.documentElement.getAttribute('data-theme'), undefined);

console.log('Theme toggle test passed.');
