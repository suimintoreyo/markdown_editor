const editor = document.getElementById("editor");
const preview = document.getElementById("preview");

// Set marked.js options for GFM compatibility
marked.setOptions({
  breaks: true, // GFM-style line breaks
  gfm: true,
});

editor.addEventListener("input", () => {
  const markdownText = editor.value;
  const rawHtml = marked.parse(markdownText);
  const sanitizedHtml = DOMPurify.sanitize(rawHtml);
  preview.innerHTML = sanitizedHtml;
});

// Initial render on page load
const initialMarkdown = editor.value;
const rawHtml = marked.parse(initialMarkdown);
const sanitizedHtml = DOMPurify.sanitize(rawHtml);
preview.innerHTML = sanitizedHtml;
