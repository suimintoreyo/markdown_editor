import assert from 'node:assert';
import { JSDOM } from 'jsdom';
import { MarkdownEditor } from './markdown_editor.js';

const dom = new JSDOM(`<textarea class="editor"></textarea><div class="preview"></div>`);
const { window } = dom;
const { document } = window;

global.window = window;
global.document = document;

const editorInstance = new MarkdownEditor();

const textarea = document.querySelector('.editor');
const preview = document.querySelector('.preview');

textarea.value = '# hello';
textarea.dispatchEvent(new window.Event('input', { bubbles: true }));
assert.strictEqual(preview.innerHTML.trim(), '<h1>hello</h1>');

const initial = preview.innerHTML;

editorInstance.destroy();

textarea.value = '# bye';
textarea.dispatchEvent(new window.Event('input', { bubbles: true }));
assert.strictEqual(preview.innerHTML, initial);

console.log('MarkdownEditor default class selection test passed.');
