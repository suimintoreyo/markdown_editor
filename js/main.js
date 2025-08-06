import { parseMarkdown } from './parser/markdown.js';

const editor = document.getElementById('editor');
const preview = document.getElementById('preview');

editor.addEventListener('input', () => {
  preview.innerHTML = parseMarkdown(editor.value);
});

preview.innerHTML = parseMarkdown(editor.value);
