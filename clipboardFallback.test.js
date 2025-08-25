import assert from 'node:assert';
import { JSDOM } from 'jsdom';
import { parseMarkdown, processCodeBlocks } from './markdown_editor.js';

const dom = new JSDOM('');
const { window } = dom;
const { document } = window;

global.window = window;
global.document = document;
global.navigator = window.navigator;

delete navigator.clipboard;

document.body.innerHTML = parseMarkdown('```\ncode\n```');
processCodeBlocks(document.body);

const btn = document.querySelector('.copy-btn');
assert.ok(btn);

assert.doesNotThrow(() => {
  btn.dispatchEvent(new window.Event('click', { bubbles: true }));
});

console.log('Clipboard API absence test passed.');
