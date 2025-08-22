import assert from 'node:assert';
const piece = 'int a; ';
let longCode = '';
for (let i = 0; i < 3000; i++) longCode += piece; // ~21k characters

const block = {
  textContent: longCode,
  className: 'language-java',
  innerHTML: '',
  attributes: {'data-tokenized': '0'},
  setAttribute(name, value) { this.attributes[name] = value; },
  getAttribute(name) { return this.attributes[name]; }
};

global.document = {
  querySelectorAll() { return [block]; },
  body: {}
};

global.MutationObserver = function() {
  return { observe() {} };
};

await import('./codeBlockSyntax_java.js');

setTimeout(() => {
  assert(block.innerHTML.includes('<span class="tok tok-keyword">int</span>'));
  console.log('Async long code block tokenization test passed.');
}, 100);

