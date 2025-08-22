# markdown_editor

JavaScript で書かれたシンプルな Markdown エディタとプレビュー用ユーティリティです。

このプロジェクトでは既存の HTML 内の要素に `id="editor"` と `id="preview"` を加えることで、それぞれテキストを Markdown に変換する機能と Markdown エディタ機能を提供します。
複数の異なる要素にそれぞれ異なるオブジェクトとして `editor` と `preview` を提供することもできます。

任意の ID を使いたい場合は `new MarkdownEditor({ textarea: ..., preview: ... })` のように要素を明示的に渡してください。例えば:

```html
<textarea id="my-editor"></textarea>
<div id="my-preview"></div>
<script type="module">
  import { MarkdownEditor } from './markdown_editor.js';

  new MarkdownEditor({
    textarea: document.getElementById('my-editor'),
    preview: document.getElementById('my-preview'),
  });
</script>
```
