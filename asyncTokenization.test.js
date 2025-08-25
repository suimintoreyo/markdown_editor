import assert from 'node:assert';
const piece = 'boolean a = true; Boolean b = false; Object c = null; String s = """hi"""; new foo(); class bar extends baz {} ';
let longCode = '';
for (let i = 0; i < 400; i++) longCode += piece; // ~40k characters

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
  body: {},
};

global.MutationObserver = function() {
  return { observe() {} };
};

await import('./codeBlockSyntax_java.js');

setTimeout(() => {
  assert(block.innerHTML.includes('<span class="tok tok-literal">true</span>'));
  assert(block.innerHTML.includes('<span class="tok tok-literal">false</span>'));
  assert(block.innerHTML.includes('<span class="tok tok-literal">null</span>'));
  assert(
    block.innerHTML.includes(
      '<span class="tok tok-string">&quot;&quot;&quot;hi&quot;&quot;&quot;</span>'
    )
  );
  assert(block.innerHTML.includes('<span class="tok tok-keyword">new</span>'));
  assert(block.innerHTML.includes('<span class="tok tok-class">foo</span>'));
  assert(block.innerHTML.includes('<span class="tok tok-keyword">extends</span>'));
  assert(block.innerHTML.includes('<span class="tok tok-class">baz</span>'));
  console.log('Async long code block tokenization test for new features passed.');
}, 100);
