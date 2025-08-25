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

// System.out.println retains class/field/method tokens
assert(output.includes('<span class="tok tok-class">System</span>'));
assert(output.includes('<span class="tok tok-field">out</span>'));
assert(output.includes('<span class="tok tok-method">println</span>'));
console.log('System.out.println tokenization test passed.');

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

// Text block string
output = tokenizeJava('String s = """hello""";');
assert(
  output.includes(
    '<span class="tok tok-string">&quot;&quot;&quot;hello&quot;&quot;&quot;</span>'
  )
);
console.log('Text block string tokenization test passed.');

// Boolean and null literals
output = tokenizeJava('boolean a = true; boolean b = false; Object c = null;');
assert(output.includes('<span class="tok tok-literal">true</span>'));
assert(output.includes('<span class="tok tok-literal">false</span>'));
assert(output.includes('<span class="tok tok-literal">null</span>'));
console.log('Boolean and null literal tokenization test passed.');

// Extended keyword set
output = tokenizeJava(
  'var x = 1; yield x; sealed interface S permits T {} non-sealed class N permits S {} open module M { requires transitive N; exports p; opens q; uses r; provides s with t; }'
);
assert(output.includes('<span class="tok tok-keyword">var</span>'));
assert(output.includes('<span class="tok tok-keyword">yield</span>'));
assert(output.includes('<span class="tok tok-keyword">sealed</span>'));
assert(output.includes('<span class="tok tok-keyword">permits</span>'));
assert(output.includes('<span class="tok tok-keyword">non-sealed</span>'));
assert(output.includes('<span class="tok tok-keyword">module</span>'));
assert(output.includes('<span class="tok tok-keyword">open</span>'));
assert(output.includes('<span class="tok tok-keyword">requires</span>'));
assert(output.includes('<span class="tok tok-keyword">exports</span>'));
assert(output.includes('<span class="tok tok-keyword">opens</span>'));
assert(output.includes('<span class="tok tok-keyword">uses</span>'));
assert(output.includes('<span class="tok tok-keyword">provides</span>'));
assert(output.includes('<span class="tok tok-keyword">transitive</span>'));
console.log('Extended keyword tokenization test passed.');

// Class name expectations after new/extends/implements/throws
output = tokenizeJava(
  'class A extends B implements C { void m() throws D { new E(); } }'
);
assert(output.includes('<span class="tok tok-class">B</span>'));
assert(output.includes('<span class="tok tok-class">C</span>'));
assert(output.includes('<span class="tok tok-class">D</span>'));
assert(output.includes('<span class="tok tok-class">E</span>'));
console.log('Class name expectation test passed.');

// Uppercase heuristic for class names
output = tokenizeJava('List items;');
assert(output.includes('<span class="tok tok-class">List</span>'));
console.log('Uppercase heuristic test passed.');
