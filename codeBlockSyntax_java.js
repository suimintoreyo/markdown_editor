(function(){
  const languages = {};

  function escapeHtml(str){
    if (typeof sanitize === 'function'){
      return sanitize(str);
    }
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function wrap(type, text){
    return `<span class="tok tok-${type}">${escapeHtml(text)}</span>`;
  }

  function registerLanguage(name, tokenizer){
    languages[name] = tokenizer;
  }

  function tokenizeJava(code){
    const keywordRe = /^(?:abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|extends|final|finally|float|for|if|goto|implements|import|instanceof|int|interface|long|native|new|package|private|protected|public|return|short|static|strictfp|super|switch|synchronized|this|throw|throws|transient|try|void|volatile|while|record)\b/;
    const numberRe = /^(?:0[xX][0-9a-fA-F_]+|0[bB][01_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d[\d_]*)?)[lLfFdD]?/;
    const operatorRe = /^(?:==|!=|<=|>=|\+\+|--|&&|\|\||<<=|>>=|>>>|<<|>>|::|->|\+=|-=|\*=|\/=|%=|&=|\|=|\^=|[+\-*/%&|^!~<>=?:])/;
    const punctRe = /^[(){}\[\],.;]/;
    let html = '';
    let i = 0;
    let expectClassName = false;
    while (i < code.length){
      const rest = code.slice(i);
      if (rest.startsWith('//')){
        const end = rest.indexOf('\n');
        const token = end === -1 ? rest : rest.slice(0,end);
        html += wrap('comment', token);
        i += token.length;
        continue;
      }
      if (rest.startsWith('/*')){
        const end = rest.indexOf('*/',2);
        const token = end === -1 ? rest : rest.slice(0,end+2);
        html += wrap('comment', token);
        i += token.length;
        continue;
      }
      if (rest[0] === '"'){
        const m = rest.match(/^"(?:\\.|[^"\\])*"?/);
        const token = m ? m[0] : rest[0];
        html += wrap('string', token);
        i += token.length;
        continue;
      }
      if (rest[0] === '\''){
        const m = rest.match(/^'(?:\\.|[^'\\])'?/);
        const token = m ? m[0] : rest[0];
        html += wrap('string', token);
        i += token.length;
        continue;
      }
      const num = rest.match(numberRe);
      if (num){
        html += wrap('number', num[0]);
        i += num[0].length;
        continue;
      }
      const ann = rest.match(/^@[A-Za-z_]\w*/);
      if (ann){
        html += wrap('annotation', ann[0]);
        i += ann[0].length;
        continue;
      }
      const kw = rest.match(keywordRe);
      if (kw){
        const token = kw[0];
        html += wrap('keyword', token);
        i += token.length;
        expectClassName = /^(?:class|interface|enum|record)$/.test(token);
        continue;
      }
      const ident = rest.match(/^[A-Za-z_]\w*/);
      if (ident){
        const name = ident[0];
        const after = rest.slice(name.length);
        const ws = after.match(/^\s*/)[0];
        const next = after.slice(ws.length, ws.length+1);
        let type = 'field';
        if (expectClassName){
          type = 'class';
          expectClassName = false;
        } else if (next === '('){
          type = 'method';
        }
        html += wrap(type, name);
        i += name.length;
        continue;
      }
      const op = rest.match(operatorRe);
      if (op){
        html += wrap('operator', op[0]);
        i += op[0].length;
        continue;
      }
      const punct = rest.match(punctRe);
      if (punct){
        html += wrap('punctuation', punct[0]);
        i += punct[0].length;
        continue;
      }
      html += escapeHtml(rest[0]);
      i++;
    }
    return html;
  }

  function processBlocks(){
    if (typeof document === 'undefined') return;
    const blocks = document.querySelectorAll('code[class^="language-"][data-tokenized="0"]');
    blocks.forEach((block)=>{
      const m = block.className.match(/language-([\w-]+)/);
      if (!m) return;
      const lang = m[1];
      const tokenizer = languages[lang];
      if (!tokenizer) return;
      block.innerHTML = tokenizer(block.textContent);
      block.setAttribute('data-tokenized','1');
    });
  }

  registerLanguage('java', tokenizeJava);

  if (typeof document !== 'undefined'){
    processBlocks();
    const observer = new MutationObserver(processBlocks);
    observer.observe(document.body, {childList:true, subtree:true});
  }

  if (typeof module !== 'undefined'){
    module.exports = { registerLanguage, tokenizeJava };
  }
})();
