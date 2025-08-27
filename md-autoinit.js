// md-autoinit.js
// Auto-initialization module for Markdown static previews and live editors.
// Order of operations on page load:
//   1. Convert all `.md-temp-preview` elements from Markdown to HTML once.
//   2. Setup `.md-editor-set` blocks so that textarea inputs update `.md-preview`
//      elements in real time (with 120ms debounce).
// This ensures static previews are rendered before editor widgets start syncing.

import { parseMarkdown } from './markdown_editor.js';

// Track initialized textareas to avoid duplicate event binding.
const initializedEditors = new WeakMap();

/**
 * Convert all elements with class `md-temp-preview` from Markdown to HTML.
 * Each element is processed only once using the data attribute `data-md-temp-done`.
 */
function initTempPreviews(root = document) {
  const tempEls = root.querySelectorAll('.md-temp-preview');
  tempEls.forEach((el) => {
    if (el.dataset.mdTempDone) return; // Skip already processed elements.
    const md = el.textContent || '';
    el.innerHTML = parseMarkdown(md);
    el.dataset.mdTempDone = '1';
  });
}

/**
 * Initialize live Markdown editors within the given root element.
 * Each textarea.md-editor updates associated .md-preview elements.
 */
function initEditorSet(root) {
  const textareas = root.querySelectorAll('textarea.md-editor');
  textareas.forEach((ta) => {
    if (initializedEditors.has(ta)) return; // Prevent double initialization
    initializedEditors.set(ta, true);

    // Determine preview elements linked to this textarea.
    const previews = Array.from(root.querySelectorAll('.md-preview')).filter((pv) => {
      const target = pv.dataset.mdFor;
      return !target || (ta.id && target === ta.id);
    });

    const render = () => {
      const html = parseMarkdown(ta.value);
      previews.forEach((pv) => {
        pv.innerHTML = html;
      });
    };

    // Debounce input events (120ms)
    let timer;
    const onInput = () => {
      clearTimeout(timer);
      timer = setTimeout(render, 120);
    };

    ta.addEventListener('input', onInput);
    render(); // Initial render
  });
}

/**
 * Initialize all markdown related elements in the document.
 * The processing order is important:
 *   - First handle static `.md-temp-preview` conversions.
 *   - Then wire up dynamic `.md-editor-set` editors.
 */
function autoInit(root = document) {
  // Step 1: static conversion
  initTempPreviews(root);

  // Step 2: dynamic editor wiring
  const sets = root.querySelectorAll('#md-editor-set, .md-editor-set');
  sets.forEach((set) => initEditorSet(set));
}

// Auto-run on DOMContentLoaded or immediately if already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => autoInit(), { once: true });
} else {
  autoInit();
}

// Optional global exposure for manual invocation
if (typeof window !== 'undefined') {
  window.MdAutoInit = autoInit;
}

export { autoInit };
