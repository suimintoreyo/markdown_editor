import { parseMarkdown } from './markdown_editor.js';

// Delay for debounced rendering (in milliseconds)
const DEBOUNCE_MS = 120;

// Track initialized textareas to prevent double registration
const initialized = new WeakSet();

/**
 * Convert all `.md-temp-preview` elements from Markdown to HTML once.
 * Processed elements receive `data-md-temp-done="1"` to avoid reprocessing.
 * @param {Document|HTMLElement} root - Root node to search within (defaults to document).
 */
function initTempPreviews(root = document) {
  const nodes = root.querySelectorAll('.md-temp-preview');
  nodes.forEach((el) => {
    if (el.dataset.mdTempDone) return; // Skip if already processed
    const md = el.textContent || '';
    el.innerHTML = parseMarkdown(md);
    el.dataset.mdTempDone = '1';
  });
}

/**
 * Initialize all `.md-editor-set` containers.
 * Within each set, `<textarea class="md-editor">` elements are wired to update
 * associated `.md-preview` elements in real-time with a debounce.
 * `data-md-for` on a preview limits updates to a specific textarea ID.
 * If `data-md-for` is absent, the preview reflects all editors in the set.
 * @param {Document|HTMLElement} root - Root node to search within (defaults to document).
 */
function initEditorSets(root = document) {
  const sets = root.querySelectorAll('#md-editor-set, .md-editor-set');
  sets.forEach((set) => {
    const previews = Array.from(set.querySelectorAll('.md-preview'));
    const editors = Array.from(set.querySelectorAll('textarea.md-editor'));

    editors.forEach((editor) => {
      if (initialized.has(editor)) return; // Prevent duplicate listeners
      initialized.add(editor);

      // Determine which preview elements to update for this editor
      const targets = previews.filter((p) => {
        const forId = p.dataset.mdFor;
        return !forId || forId === editor.id;
      });

      let timer = null;
      const render = () => {
        const html = parseMarkdown(editor.value);
        targets.forEach((t) => {
          t.innerHTML = html;
        });
      };
      const onInput = () => {
        clearTimeout(timer);
        timer = setTimeout(render, DEBOUNCE_MS);
      };

      editor.addEventListener('input', onInput);

      // Initial render to populate previews with existing value
      render();
    });
  });
}

/**
 * Perform initialization in the required order:
 *  1. Convert `.md-temp-preview` elements (static Markdown → HTML).
 *  2. Set up `.md-editor-set` live preview wiring.
 * @param {Document|HTMLElement} root - Root node to search within (defaults to document).
 */
function autoInit(root = document) {
  initTempPreviews(root);
  initEditorSets(root);
}

// Auto-run when DOM is ready. Ensures `.md-temp-preview` elements are processed
// before setting up the editor sets.
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => autoInit());
  } else {
    autoInit();
  }
}

// Optional manual access via named export
const MdAutoInit = { autoInit, initTempPreviews, initEditorSets };
export { MdAutoInit, autoInit, initTempPreviews, initEditorSets };

// Optional global exposure if explicitly desired
if (typeof window !== 'undefined') {
  window.MdAutoInit = MdAutoInit;
}
