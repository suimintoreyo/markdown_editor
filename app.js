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
  const rawLines = markdown.split(/\r?\n/);
  const refLinks = {};
  const lines = [];

  rawLines.forEach((line) => {
    const defMatch = line.match(/^\s*\[(.+?)\]:\s*(\S+)/);
    if (defMatch) {
      const id = defMatch[1].trim().toLowerCase();
      const url = sanitize(defMatch[2]);
      refLinks[id] = url;
    } else {
      lines.push(line);
    }
  });

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

  function splitTableRow(row) {
    let cells = row.trim();
    if (cells.startsWith('|')) cells = cells.slice(1);
    if (cells.endsWith('|')) cells = cells.slice(0, -1);
    return cells.split('|').map((c) => c.trim());
  }

  function parseAlign(line) {
    const cells = splitTableRow(line);
    const aligns = [];
    for (const cell of cells) {
      const trimmed = cell.trim();
      if (!/^:?-+:?$/.test(trimmed)) return null;
      let align = null;
      const left = trimmed.startsWith(':');
      const right = trimmed.endsWith(':');
      if (left && right) align = 'center';
      else if (left) align = 'left';
      else if (right) align = 'right';
      aligns.push(align);
    }
    return aligns;
  }

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmedLine = line.trim();

    const nextLine = lines[i + 1];
    if (nextLine && line.includes('|')) {
      const aligns = parseAlign(nextLine);
      if (aligns && splitTableRow(line).length === aligns.length) {
        flushParagraph();
        while (listStack.length > 0) {
          html += `</li></${listStack.pop()}>`;
        }
        const headers = splitTableRow(line);
        let tableHtml = '<table><thead><tr>';
        headers.forEach((cell, idx) => {
          const align = aligns[idx];
          const style = align ? ` style="text-align:${align}"` : '';
          tableHtml += `<th${style}>${sanitize(cell)}</th>`;
        });
        tableHtml += '</tr></thead><tbody>';
        i++; // skip alignment row
        while (i + 1 < lines.length && lines[i + 1].includes('|')) {
          const row = splitTableRow(lines[i + 1]);
          i++;
          tableHtml += '<tr>';
          row.forEach((cell, idx) => {
            const align = aligns[idx];
            const style = align ? ` style="text-align:${align}"` : '';
            tableHtml += `<td${style}>${sanitize(cell)}</td>`;
          });
          tableHtml += '</tr>';
        }
        tableHtml += '</tbody></table>';
        html += tableHtml;
        continue;
      }
    }
    if (inCode && codeDelimiter === 'indent') {
      if (/^( {4}|\t)/.test(line)) {
        html += sanitize(line.replace(/^( {4}|\t)/, '')) + '\n';
        continue;
      } else if (trimmedLine === '') {
        html += '\n';
        continue;
      } else {
        html += '</code></pre>';
        inCode = false;
        codeDelimiter = null;
        // fall through to process this line normally
      }
    }

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
      continue;
    }

    if (inCode && codeDelimiter !== 'indent') {
      html += sanitize(line) + '\n';
      continue;
    }

    const indentSpaces = line.match(/^ */)[0].length;
    const trimmed = line.trimStart();
    const ulMatch = /^[-*+] /.test(trimmed);
    const olMatch = /^[0-9]+\. /.test(trimmed);

    if (ulMatch || olMatch) {
      flushParagraph();
      const type = ulMatch ? 'ul' : 'ol';
      const content = ulMatch
        ? trimmed.replace(/^[-*+] /, '')
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
      continue;
    }

    if (/^( {4}|\t)/.test(line)) {
      flushParagraph();
      while (listStack.length > 0) {
        html += `</li></${listStack.pop()}>`;
      }
      html += '<pre><code>';
      inCode = true;
      codeDelimiter = 'indent';
      html += sanitize(line.replace(/^( {4}|\t)/, '')) + '\n';
      continue;
    }

    while (listStack.length > 0) {
      html += `</li></${listStack.pop()}>`;
    }

    if (/^#{1,6} /.test(line)) {
      flushParagraph();
      const level = line.match(/^#{1,6}/)[0].length;
      html += `<h${level}>${sanitize(line.slice(level + 1))}</h${level}>`;
      continue;
    }

    const bqMatch = line.match(/^(>+)\s*/);
    if (bqMatch) {
      flushParagraph();
      const depth = bqMatch[1].length;
      const content = sanitize(line.slice(bqMatch[0].length));
      html += '<blockquote>'.repeat(depth) + content + '</blockquote>'.repeat(depth);
      continue;
    }

    if (/^(?:---|\*\*\*|___)$/.test(line.trim())) {
      flushParagraph();
      html += '<hr />';
      continue;
    }

    if (line.trim() === '') {
      flushParagraph();
      continue;
    }

    let processed = sanitize(line).trimEnd();
    processed = processed.replace(/(\*\*\*|___)(.+?)\1/g, '<strong><em>$2</em></strong>');
    processed = processed.replace(/(\*\*|__)(.+?)\1/g, '<strong>$2</strong>');
    processed = processed.replace(/(\*|_)(.+?)\1/g, '<em>$2</em>');
    processed = processed.replace(/`([^`]+)`/g, '<code>$1</code>');
    processed = processed.replace(/!\[(.+?)\]\((.+?)\)/g, (m, alt, url) => `<img src="${url}" alt="${alt}" />`);
    processed = processed.replace(/\[(.+?)\]\((.+?)\)/g, (m, text, url) => `<a href="${url}">${text}</a>`);
    processed = processed.replace(/\[(.+?)\]\[(.+?)\]/g, (m, text, id) => {
      const url = refLinks[id.toLowerCase()];
      return url ? `<a href="${url}">${text}</a>` : m;
    });
    const hasBreak = /  $/.test(line);
    paragraph += processed;
    paragraph += hasBreak ? '<br>' : ' ';
  }

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
