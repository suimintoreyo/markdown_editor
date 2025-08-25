# markdown_editor

JavaScript で書かれたシンプルな Markdown エディタとプレビュー用ユーティリティです。

## 使い方

本リポジトリの JS ファイルをコピーするだけでモジュールとして利用できます。依存関係はありません。

### 素の HTML での利用

```html
<textarea class="editor"></textarea>
<div class="preview"></div>
<script type="module">
  import { MarkdownEditor } from './markdown_editor.js';
  import { toggleTheme } from './codeBlockSyntax_java.js';

  new MarkdownEditor({
    textarea: document.querySelector('.editor'),
    preview: document.querySelector('.preview'),
  });

  // オプション: テーマ切り替え
  window.toggleTheme = toggleTheme;
</script>
```

### Spring Boot プロジェクトでの利用

`markdown_editor.js` と `codeBlockSyntax_java.js` を `src/main/resources/static/js/` に配置します。

テンプレート (例: `src/main/resources/templates/index.html`) から次のように読み込みます。

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <script type="module" src="/js/markdown_editor.js"></script>
    <script type="module" src="/js/codeBlockSyntax_java.js"></script>
  </head>
  <body>
    <textarea class="editor"></textarea>
    <div class="preview"></div>
    <script type="module">
      import { MarkdownEditor } from '/js/markdown_editor.js';
      new MarkdownEditor({
        textarea: document.querySelector('.editor'),
        preview: document.querySelector('.preview'),
      });
    </script>
  </body>
</html>
```

その他のフレームワークでも、同様に JS ファイルを配置して `import` すれば利用できます。

