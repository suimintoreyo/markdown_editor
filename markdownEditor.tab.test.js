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

textarea.value = 'test';
textarea.selectionStart = textarea.selectionEnd = textarea.value.length;

textarea.dispatchEvent(
  new window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
);

assert.strictEqual(textarea.value, 'test    ');

editor.destroy();

console.log('MarkdownEditor Tab insertion test passed.');
