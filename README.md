# markdown_editor

JavaScriptで記述された軽量なMarkdownパーサとライブプレビュー付きエディタです。

## Markdown 機能の使い方

### 主なモジュール
- `parseMarkdown` : Markdown文字列をHTMLへ変換します。以下の記法をサポートします。
  - 見出し: `#` から `######` までの記号を行頭に置く
  - リスト: `-` `+` `*` または `1.` などの数字で開始する
  - 引用: 行頭に `>` を付ける
  - コードブロック: 三つのバッククォート ``` やチルダ ~~~、または4スペースインデント
  - 表: `|` でセルを区切り次の行に `---` 等を記述してヘッダーを定義
  - リンク・画像: `[text](url)`、`![alt](url)`、参照リンク `[text][id]` と `[id]: url`
- `MarkdownEditor` : テキストエリアとプレビューを同期するエディタ。タブ切り替えやTabキーによるインデントを備えています。
- `processCodeBlocks` : `<pre><code>` ブロックにトークナイザを適用し、コピー用ボタンを設定します。

### MarkdownEditor の使用例
```html
<div class="container">
  <div class="tabs">
    <button class="active" data-target="editor-pane">編集</button>
    <button data-target="preview-pane">プレビュー</button>
  </div>
  <div id="editor-pane" class="pane active">
    <textarea class="editor"></textarea>
  </div>
  <div id="preview-pane" class="pane">
    <div class="preview"></div>
  </div>
</div>
<script type="module">
  import { MarkdownEditor } from './markdown_editor.js';
  new MarkdownEditor();
</script>
```

### md-autoinit.js による自動初期化
`<script type="module" src="./md-autoinit.js"></script>` を読み込むと、次の要素が自動で処理されます。

- `.md-temp-preview` : ページ読み込み時に一度だけMarkdownからHTMLに変換されます。
- `.md-editor` と `.md-preview` : `.md-editor-set` 内のテキストエリア入力が対応するプレビューをリアルタイムで更新します。`data-md-for` 属性でテキストエリアとプレビューを関連付けできます。
- タブ切り替え : `.tabs button` の `data-target` に対応する `.pane` が表示され、プレビューがアクティブになったときに再レンダリングされます。

