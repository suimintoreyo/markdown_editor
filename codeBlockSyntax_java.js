import { sanitize } from './utils/sanitize.js';

const languages = {};

function wrap(type, text) {
  return `<span class="tok tok-${type}">${sanitize(text)}</span>`;
}

export function registerLanguage(name, tokenizer) {
  languages[name] = tokenizer;
}

export function tokenizeJava(code) {
  const keywordRe = /^(?:abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|extends|final|finally|float|for|if|goto|implements|import|instanceof|int|interface|long|native|new|package|private|protected|public|return|short|static|strictfp|super|switch|synchronized|this|throw|throws|transient|try|void|volatile|while|record|var|yield|sealed|permits|non-sealed|module|open|requires|exports|opens|uses|provides|transitive)\b/;
  const literalRe = /^(?:true|false|null)\b/;
  const numberRe = /^(?:0[xX][0-9a-fA-F_]+|0[bB][01_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d[\d_]*)?)[lLfFdD]?/;
  const operatorRe = /^(?:==|!=|<=|>=|\+\+|--|&&|\|\||<<=|>>=|>>>|<<|>>|::|->|\+=|-=|\*=|\/=|%=|&=|\|=|\^=|[+\-*/%&|^!~<>=?:])/;
  const punctRe = /^[(){}\[\],.;]/;
  let html = '';
  let i = 0;
  let expectClassName = false;
  while (i < code.length) {
    const rest = code.slice(i);
    if (rest.startsWith('//')) {
      const end = rest.indexOf('\n');
      const token = end === -1 ? rest : rest.slice(0, end);
      html += wrap('comment', token);
      i += token.length;
      continue;
    }
    if (rest.startsWith('/*')) {
      const end = rest.indexOf('*/', 2);
      const token = end === -1 ? rest : rest.slice(0, end + 2);
      html += wrap('comment', token);
      i += token.length;
      continue;
    }
    if (rest.startsWith('"""')) {
      const end = rest.indexOf('"""', 3);
      const token = end === -1 ? rest : rest.slice(0, end + 3);
      html += wrap('string', token);
      i += token.length;
      continue;
    }
    if (rest[0] === '"') {
      const m = rest.match(/^"(?:\\.|[^"\\])*"?/);
      const token = m ? m[0] : rest[0];
      html += wrap('string', token);
      i += token.length;
      continue;
    }
    if (rest[0] === '\'') {
      const m = rest.match(/^'(?:\\.|[^'\\])'?/);
      const token = m ? m[0] : rest[0];
      html += wrap('string', token);
      i += token.length;
      continue;
    }
    const num = rest.match(numberRe);
    if (num) {
      html += wrap('number', num[0]);
      i += num[0].length;
      continue;
    }
    const ann = rest.match(/^@[A-Za-z_]\w*/);
    if (ann) {
      html += wrap('annotation', ann[0]);
      i += ann[0].length;
      continue;
    }
    const kw = rest.match(keywordRe);
    if (kw) {
      const token = kw[0];
      html += wrap('keyword', token);
      i += token.length;
      expectClassName = /^(?:class|interface|enum|record|new|extends|implements|throws)$/.test(
        token
      );
      continue;
    }
    const lit = rest.match(literalRe);
    if (lit) {
      html += wrap('literal', lit[0]);
      i += lit[0].length;
      continue;
    }
    const ident = rest.match(/^[A-Za-z_]\w*/);
    if (ident) {
      const name = ident[0];
      const after = rest.slice(name.length);
      const ws = after.match(/^\s*/)[0];
      const next = after.slice(ws.length, ws.length + 1);
      let type = 'field';
      if (expectClassName || /^[A-Z]/.test(name)) {
        type = 'class';
        expectClassName = false;
      } else if (next === '(') {
        type = 'method';
      }
      html += wrap(type, name);
      i += name.length;
      continue;
    }
    const op = rest.match(operatorRe);
    if (op) {
      html += wrap('operator', op[0]);
      i += op[0].length;
      continue;
    }
    const punct = rest.match(punctRe);
    if (punct) {
      html += wrap('punctuation', punct[0]);
      i += punct[0].length;
      continue;
    }
    html += sanitize(rest[0]);
    i++;
  }
  return html;
}

const LONG_CODE_THRESHOLD = 20000; // Start chunking past ~20k chars
const CHUNK_SIZE = 5000; // Process in 5k character chunks

function schedule(fn) {
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(fn);
  } else {
    setTimeout(fn, 0);
  }
}

function addLineNumbers(block) {
  const lines = block.innerHTML.split(/\n/);
  block.innerHTML = lines
    .map((line) => `<span class="line">${line}</span>`)
    .join('');
}

function processLargeBlock(block, tokenizer) {
  const text = block.textContent;
  const chunks = [];
  for (let i = 0; i < text.length; i += CHUNK_SIZE) {
    chunks.push(text.slice(i, i + CHUNK_SIZE));
  }
  let html = '';
  block.setAttribute('data-tokenized', '1');
  function run(index) {
    html += tokenizer(chunks[index]);
    if (index + 1 < chunks.length) {
      schedule(() => run(index + 1));
    } else {
      block.innerHTML = html;
      addLineNumbers(block);
    }
  }
  schedule(() => run(0));
}

function processBlocks() {
  if (typeof document === 'undefined') return;
  const blocks = document.querySelectorAll(
    'code[class^="language-"][data-tokenized="0"]'
  );
  blocks.forEach((block) => {
    const m = block.className.match(/language-([\w-]+)/);
    if (!m) return;
    const lang = m[1];
    const tokenizer = languages[lang];
    if (!tokenizer) return;
    const text = block.textContent;
    if (text.length > LONG_CODE_THRESHOLD) {
      processLargeBlock(block, tokenizer);
    } else {
      block.innerHTML = tokenizer(text);
      addLineNumbers(block);
      block.setAttribute('data-tokenized', '1');
    }
  });
}

registerLanguage('java', tokenizeJava);

if (typeof document !== 'undefined') {
  processBlocks();
  const observer = new MutationObserver(processBlocks);
  observer.observe(document.body, { childList: true, subtree: true });
}

export function toggleTheme(theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const current = root.getAttribute('data-theme');
  if (theme) {
    if (current === theme) {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }
  } else {
    root.removeAttribute('data-theme');
  }
}
