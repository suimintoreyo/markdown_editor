import { escapeHtml } from '../utils/escapeHtml.js';

export function highlightHtml(source) {
  const esc = escapeHtml;
  return source
    .split(/(<!--[\s\S]*?-->|<\/?.*?>)/g)
    .map((part) => {
      if (!part) return "";
      if (/^<!--/.test(part)) {
        return `<span class="hl-comment">${esc(part)}</span>`;
      }
      if (/^</.test(part)) {
        const isClosing = /^<\//.test(part);
        const selfClose = /\/\s*>$/.test(part);
        const tagNameMatch = part.match(/^<\/?\s*([^\s>]+)/);
        const tagName = tagNameMatch ? tagNameMatch[1] : "";
        let result =
          "&lt;" +
          (isClosing ? "/" : "") +
          `<span class="hl-tag">${tagName}</span>`;
        let attrString = part.slice(tagNameMatch[0].length);
        attrString = attrString.replace(/\/?\s*>$/, "");
        const attrRegex = /([a-zA-Z-:]+)(\s*=\s*(".*?"|'.*?'|[^\s"'>]+))?/g;
        attrString.replace(attrRegex, (m, name, rest, value) => {
          result += ` <span class="hl-attr">${name}</span>`;
          if (value) {
            result += `=<span class="hl-string">${esc(value)}</span>`;
          }
        });
        result += selfClose ? " /&gt;" : "&gt;";
        return result;
      }
      return esc(part);
    })
    .join("");
}
