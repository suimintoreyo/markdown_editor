# markdown_editor

JavaScript で書かれたシンプルな Markdown エディタとプレビュー用ユーティリティです。

## API

### `MarkdownEditor`

`textarea` 要素とプレビュー領域を組み合わせたエディタを構築します。

```html
<div class="tabs">
  <button class="active" data-target="editor-pane">編集</button>
  <button data-target="preview-pane">プレビュー</button>
</div>
<div id="editor-pane" class="pane active">
  <textarea id="editor"></textarea>
</div>
<div id="preview-pane" class="pane">
  <div id="preview"></div>
</div>

<script src="markdown_editor.js"></script>
<script>
  const editor = new MarkdownEditor({
    textarea: document.getElementById('editor'),
    preview: document.getElementById('preview'),
    tabButtons: document.querySelectorAll('.tabs button'),
    panes: document.querySelectorAll('.pane'),
  });
  // 不要になったタイミングで
  // editor.destroy();
</script>
```

生成されたインスタンスの `destroy()` を呼び出すと、イベントリスナが解除され参照がクリアされます。

### `renderMarkdownPreview`

Markdown 文字列を指定した要素に HTML として描画します。

```html
<div id="preview-only"></div>
<script src="markdown_editor.js"></script>
<script>
  renderMarkdownPreview(
    document.getElementById('preview-only'),
    '# Hello\n\nSome **markdown**.'
  );
</script>
```

## 複数エディタの組み込み例

既存の HTML に複数の入力・出力要素がある場合、各ペアごとに `MarkdownEditor` を生成します。

```html
<textarea id="editor1"></textarea>
<div id="preview1"></div>
<textarea id="editor2"></textarea>
<div id="preview2"></div>

<script src="markdown_editor.js"></script>
<script>
  [1,2].forEach((i) => {
    new MarkdownEditor({
      textarea: document.getElementById(`editor${i}`),
      preview: document.getElementById(`preview${i}`),
    });
  });
</script>
```

## プレビュー専用要素との併用

同一ページでプレビュー専用要素とエディタ要素を同時に利用する場合は、
`renderMarkdownPreview` でプレビューを初期化した後に `MarkdownEditor` を設定します。

```html
<div id="static-preview"></div>
<textarea id="live-editor"></textarea>
<div id="live-preview"></div>

<script src="markdown_editor.js"></script>
<script>
  // プレビュー専用要素の初期化
  renderMarkdownPreview(
    document.getElementById('static-preview'),
    '*static* **markdown**'
  );

  // エディタの初期化
  new MarkdownEditor({
    textarea: document.getElementById('live-editor'),
    preview: document.getElementById('live-preview'),
  });
</script>
```

