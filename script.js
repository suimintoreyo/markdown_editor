const editor = document.getElementById("editor");
const preview = document.getElementById("preview");

function renderMarkdown(text) {
  const rawHtml = marked.parse(text);
  const sanitizedHtml = DOMPurify.sanitize(rawHtml);
  preview.innerHTML = sanitizedHtml;
}

// Set marked.js options for GFM compatibility and syntax highlighting
marked.setOptions({
  breaks: true, // GFM-style line breaks
  gfm: true,
  langPrefix: "hljs language-",
  highlight: function (code, lang) {
    const language = hljs.getLanguage(lang) ? lang : "plaintext";
    return hljs.highlight(code, { language }).value;
  },
});

renderMarkdown(editor.value);

editor.addEventListener("input", () => {
  renderMarkdown(editor.value);
});

