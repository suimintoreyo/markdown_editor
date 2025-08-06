export function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
  };
  return text.replace(/[&<>]/g, (char) => map[char]);
}
