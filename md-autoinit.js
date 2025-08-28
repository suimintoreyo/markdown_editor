// md-autoinit.js
// Markdown の静的プレビューとライブエディタのための自動初期化モジュール。
// ページ読み込み時の処理順序:
//   1. `.md-temp-preview` 要素を Markdown から HTML に一度だけ変換する。
//   2. `.md-editor-set` ブロックを設定し、テキストエリアの入力が
//      `.md-preview` 要素をリアルタイム (120ms のデバウンス付き) で更新する。
// これにより、エディタウィジェットが同期を開始する前に静的プレビューが描画される。

import { parseMarkdown } from './markdown_editor.js';

// 初期化済みのテキストエリアを追跡し、イベントの重複バインドを避ける。
const initializedEditors = new WeakMap();

/**
 * Convert all elements with class `md-temp-preview` from Markdown to HTML.
 * Each element is processed only once using the data attribute `data-md-temp-done`.
 */
function initTempPreviews(root = document) {
  const tempEls = root.querySelectorAll('.md-temp-preview');
  tempEls.forEach((el) => {
    if (el.dataset.mdTempDone) return; // 既に処理された要素をスキップする。
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
    if (initializedEditors.has(ta)) return; // 二重初期化を防ぐ
    initializedEditors.set(ta, true);

    // このテキストエリアにリンクされたプレビュー要素を特定する。
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

    // 入力イベントをデバウンスする (120ms)
    let timer;
    const onInput = () => {
      clearTimeout(timer);
      timer = setTimeout(render, 120);
    };

    ta.addEventListener('input', onInput);
    render(); // 初期描画

    // このルートでまだ設定されていない場合、タブ切り替えを設定する
    if (!root.dataset.mdTabsBound) {
      const tabButtons = Array.from(root.querySelectorAll('.tabs button'));
      const panes = Array.from(root.querySelectorAll('.pane'));
      const previewPane = previews[0] ? previews[0].closest('.pane') : null;

      tabButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
          const targetId = btn.dataset.target;
          panes.forEach((pane) => {
            pane.classList.toggle('active', pane.id === targetId);
          });
          tabButtons.forEach((b) => {
            b.classList.toggle('active', b === btn);
          });
          if (previewPane && targetId === previewPane.id) {
            render();
          }
        });
      });

      root.dataset.mdTabsBound = '1';
    }
  });
}

/**
 * Initialize all markdown related elements in the document.
 * The processing order is important:
 *   - First handle static `.md-temp-preview` conversions.
 *   - Then wire up dynamic `.md-editor-set` editors.
 */
function autoInit(root = document) {
  // 手順1: 静的変換
  initTempPreviews(root);

  // 手順2: 動的エディタの配線
  const sets = root.querySelectorAll('#md-editor-set, .md-editor-set');
  sets.forEach((set) => initEditorSet(set));
}

// DOMContentLoaded 時に自動実行、または既に読み込まれていれば即時実行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => autoInit(), { once: true });
} else {
  autoInit();
}

// 手動呼び出し用にオプションでグローバルに公開する
if (typeof window !== 'undefined') {
  window.MdAutoInit = autoInit;
}

export { autoInit };
