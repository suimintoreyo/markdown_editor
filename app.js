const editor = document.getElementById('editor');
const preview = document.getElementById('preview');

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
  let inList = false;
  let listType = null;

  lines.forEach((line) => {
    if (line.trim().startsWith('```')) {
      if (inCode) {
        html += '</code></pre>';
        inCode = false;
      } else {
        html += '<pre><code>';
        inCode = true;
      }
      return;
    }

    if (inCode) {
      html += sanitize(line) + '\n';
      return;
    }

    if (/^#{1,6} /.test(line)) {
      const level = line.match(/^#{1,6}/)[0].length;
      html += `<h${level}>${sanitize(line.slice(level + 1))}</h${level}>`;
      return;
    }

    if (/^> /.test(line)) {
      html += `<blockquote>${sanitize(line.slice(2))}</blockquote>`;
      return;
    }

    if (/^[*-] /.test(line)) {
      if (!inList || listType !== 'ul') {
        if (inList) html += `</${listType}>`;
        inList = true;
        listType = 'ul';
        html += '<ul>';
      }
      html += `<li>${sanitize(line.slice(2))}</li>`;
      return;
    }

    if (/^[0-9]+\. /.test(line)) {
      if (!inList || listType !== 'ol') {
        if (inList) html += `</${listType}>`;
        inList = true;
        listType = 'ol';
        html += '<ol>';
      }
      html += `<li>${sanitize(line.replace(/^[0-9]+\. /, ''))}</li>`;
      return;
    }

    if (inList) {
      html += `</${listType}>`;
      inList = false;
      listType = null;
    }

    if (/^---$/.test(line.trim())) {
      html += '<hr />';
      return;
    }

    if (line.trim() === '') {
      return;
    }

    let processed = sanitize(line);
    processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    processed = processed.replace(/\*(.+?)\*/g, '<em>$1</em>');
    processed = processed.replace(/`([^`]+)`/g, '<code>$1</code>');
    processed = processed.replace(/\[(.+?)\]\((.+?)\)/g, (m, text, url) => `<a href="${url}">${text}</a>`);
    html += `<p>${processed}</p>`;
  });

  if (inList) html += `</${listType}>`;
  if (inCode) html += '</code></pre>';
  return html;
}

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
