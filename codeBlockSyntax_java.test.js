import assert from 'node:assert';
import { tokenizeJava } from './codeBlockSyntax_java.js';

// Basic class and method tokenization
let output = tokenizeJava(
  'class Hello { public static void main(String[] args) { System.out.println("Hi"); } }'
);
assert(output.includes('<span class="tok tok-keyword">class</span>'));
assert(output.includes('<span class="tok tok-class">Hello</span>'));
assert(output.includes('<span class="tok tok-keyword">public</span>'));
assert(output.includes('<span class="tok tok-keyword">static</span>'));
assert(output.includes('<span class="tok tok-keyword">void</span>'));
assert(output.includes('<span class="tok tok-method">main</span>'));
console.log('Basic Java tokenization test passed.');

// Annotation handling
output = tokenizeJava(
  'class Hello { @Override public String toString() { return "Hi"; } }'
);
assert(output.includes('<span class="tok tok-annotation">@Override</span>'));
console.log('Annotation tokenization test passed.');

// Record declaration
output = tokenizeJava('record Person(String name, int age) {}');
assert(output.includes('<span class="tok tok-keyword">record</span>'));
assert(output.includes('<span class="tok tok-class">Person</span>'));
console.log('Record tokenization test passed.');

// Comment styles
output = tokenizeJava('// line comment');
assert(output.includes('<span class="tok tok-comment">// line comment</span>'));
output = tokenizeJava('/* block comment */');
assert(output.includes('<span class="tok tok-comment">/* block comment */</span>'));
console.log('Comment tokenization test passed.');

// Numeric literals
output = tokenizeJava('int x = 0xFF; double y = 3.14e10;');
assert(output.includes('<span class="tok tok-number">0xFF</span>'));
assert(output.includes('<span class="tok tok-number">3.14e10</span>'));
console.log('Numeric literal tokenization test passed.');
