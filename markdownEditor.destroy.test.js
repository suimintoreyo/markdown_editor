import assert from 'node:assert';
import { JSDOM } from 'jsdom';
import { MarkdownEditor } from './markdown_editor.js';

const dom = new JSDOM(`<textarea class="editor"></textarea><div class="preview"></div>`);
const { window } = dom;
const { document } = window;

global.window = window;
global.document = document;

const textarea = document.querySelector('.editor');
const preview = document.querySelector('.preview');

const editor = new MarkdownEditor({ textarea, preview });

textarea.value = '# hello';
textarea.dispatchEvent(new window.Event('input', { bubbles: true }));
const initial = preview.innerHTML;

editor.destroy();

textarea.value = '# bye';
textarea.dispatchEvent(new window.Event('input', { bubbles: true }));
assert.strictEqual(preview.innerHTML, initial);

textarea.value = 'test';
textarea.dispatchEvent(
  new window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
);
assert.strictEqual(textarea.value, 'test');

assert.strictEqual(editor.editor, null);
assert.strictEqual(editor.preview, null);

console.log('MarkdownEditor destroy test passed.');
