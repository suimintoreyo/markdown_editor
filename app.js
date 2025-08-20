let editor, preview;
if (typeof document !== 'undefined') {
  editor = document.getElementById('editor');
  preview = document.getElementById('preview');
}

function sanitize(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function parseMarkdown(markdown) {
  const lines = markdown.split(/\r?\n/);
  let html = '';
  let inCode = false;
  let codeDelimiter = null;
  const listStack = [];
  let paragraph = '';

  const flushParagraph = () => {
    if (paragraph.trim()) {
      html += `<p>${paragraph.trim()}</p>`;
      paragraph = '';
    }
  };

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('```') || trimmedLine.startsWith('~~~')) {
      flushParagraph();
      const delimiter = trimmedLine.slice(0, 3);
      if (inCode && delimiter === codeDelimiter) {
        html += '</code></pre>';
        inCode = false;
        codeDelimiter = null;
      } else if (!inCode) {
        html += '<pre><code>';
        inCode = true;
        codeDelimiter = delimiter;
      } else {
        html += sanitize(line) + '\n';
      }
      return;
    }

    if (inCode) {
      html += sanitize(line) + '\n';
      return;
    }

    const indentSpaces = line.match(/^ */)[0].length;
    const trimmed = line.trimStart();
    const ulMatch = /^[-*] /.test(trimmed);
    const olMatch = /^[0-9]+\. /.test(trimmed);

    if (ulMatch || olMatch) {
      flushParagraph();
      const type = ulMatch ? 'ul' : 'ol';
      const content = ulMatch
        ? trimmed.replace(/^[-*] /, '')
        : trimmed.replace(/^[0-9]+\. /, '');
      const depth = Math.floor(indentSpaces / 2) + 1;

      while (depth < listStack.length) {
        html += `</li></${listStack.pop()}>`;
      }
      if (depth === listStack.length && listStack.length > 0) {
        html += '</li>';
      }
      while (depth > listStack.length) {
        html += `<${type}>`;
        listStack.push(type);
      }
      if (listStack.length === 0 || listStack[listStack.length - 1] !== type) {
        if (listStack.length > 0) {
          html += `</${listStack.pop()}>`;
        }
        html += `<${type}>`;
        listStack.push(type);
      }
      html += `<li>${sanitize(content)}`;
      return;
    }

    while (listStack.length > 0) {
      html += `</li></${listStack.pop()}>`;
    }

    if (/^#{1,6} /.test(line)) {
      flushParagraph();
      const level = line.match(/^#{1,6}/)[0].length;
      html += `<h${level}>${sanitize(line.slice(level + 1))}</h${level}>`;
      return;
    }

    const bqMatch = line.match(/^(>+)\s*/);
    if (bqMatch) {
      flushParagraph();
      const depth = bqMatch[1].length;
      const content = sanitize(line.slice(bqMatch[0].length));
      html += '<blockquote>'.repeat(depth) + content + '</blockquote>'.repeat(depth);
      return;
    }

    if (/^---$/.test(line.trim())) {
      flushParagraph();
      html += '<hr />';
      return;
    }

    if (line.trim() === '') {
      flushParagraph();
      return;
    }

    let processed = sanitize(line).trimEnd();
    processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    processed = processed.replace(/\*(.+?)\*/g, '<em>$1</em>');
    processed = processed.replace(/`([^`]+)`/g, '<code>$1</code>');
    processed = processed.replace(/\[(.+?)\]\((.+?)\)/g, (m, text, url) => `<a href="${url}">${text}</a>`);
    const hasBreak = /  $/.test(line);
    paragraph += processed;
    paragraph += hasBreak ? '<br>' : ' ';
  });

  while (listStack.length > 0) {
    html += `</li></${listStack.pop()}>`;
  }
  if (inCode) html += '</code></pre>';
  flushParagraph();
  return html;
}

if (typeof document !== 'undefined') {
  function render() {
    const raw = editor.value;
    const html = parseMarkdown(raw);
    preview.innerHTML = html;
  }

  editor.addEventListener('input', render);

  editor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      const value = editor.value;
      editor.value = value.substring(0, start) + '    ' + value.substring(end);
      editor.selectionStart = editor.selectionEnd = start + 4;
    }
  });

  render();
}

if (typeof module !== 'undefined') {
  module.exports = { parseMarkdown };
}
