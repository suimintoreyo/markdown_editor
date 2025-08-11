// JavaScript syntax highlighting helper
function highlightJsSyntax(code) {
  code = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const keywordPattern = `\\b(?:function|const|let|var|if|else|return|for|while|do|switch|case|break|continue)\\b`;
  const regex = new RegExp(
    `(".*?")|('.*?')|(\\/\\/.*)|(\\/\\*[\\s\\S]*?\\*\\/)|(${keywordPattern})|(\\b\\d+\\b)|(\\b[a-zA-Z_]\\w*(?=\\s*\\())`,
    "g"
  );

  return code.replace(
    regex,
    (match, string1, string2, comment1, comment2, keyword, number, funcName) => {
      if (string1 || string2) return `<span class="string">${match}</span>`;
      if (comment1 || comment2) return `<span class="comment">${match}</span>`;
      if (keyword) return `<span class="keyword">${match}</span>`;
      if (number) return `<span class="number">${match}</span>`;
      if (funcName) return `<span class="function-name">${match}</span>`;
      return match;
    }
  );
}

window.highlightJsSyntax = highlightJsSyntax;
