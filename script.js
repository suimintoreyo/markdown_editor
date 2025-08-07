const editor = document.getElementById("editor");
const preview = document.getElementById("preview");

editor.addEventListener("input", () => {
  preview.innerHTML = parseMarkdown(editor.value);
});

function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
  };
  return text.replace(/[&<>]/g, (char) => map[char]);
}

// JavaScriptの構文をハイライトする
function highlightJsSyntax(code) {
  code = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const keywordPattern = `\\b(?:function|const|let|var|if|else|return|for|while|do|switch|case|break|continue)\\b`;
  const regex = new RegExp(
    `(".*?")|('.*?')|(\\/\\/.*)|(\\/\\*[\\s\\S]*?\\*\\/)|(${keywordPattern})|(\\b\\d+\\b)|(\\b[a-zA-Z_]\\w*(?=\\s*\\())`,
    "g"
  );

  return code.replace(
    regex,
    (match, string1, string2, comment1, comment2, keyword, number, funcName) => {
      if (string1 || string2) return `<span class="string">${match}</span>`;
      if (comment1 || comment2) return `<span class="comment">${match}</span>`;
      if (keyword) return `<span class="keyword">${match}</span>`;
      if (number) return `<span class="number">${match}</span>`;
      if (funcName) return `<span class="function-name">${match}</span>`;
      return match;
    }
  );
}

// 強調、コード、画像、リンクなどのインラインMarkdown機能を適用する。
function applyInlineFormatting(text) {
  return (
    text
      // 三重のアスタリスクまたはアンダースコアで太字＋斜体
      .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
      .replace(/___(.+?)___/g, "<strong><em>$1</em></strong>")
      // 二重のアスタリスクまたはアンダースコアで太字
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/__(.+?)__/g, "<strong>$1</strong>")
      // 単一のアスタリスクまたはアンダースコアで斜体
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/_(.+?)_/g, "<em>$1</em>")
      // バッククォートでインラインコード
      .replace(/`(.+?)`/g, "<code>$1</code>")
      // 画像: ![alt](src)
      .replace(/!\[(.*?)\]\((.*?)\)/g, '<img alt="$1" src="$2">')
      // リンク: [text](url)
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
  );
}

// Markdownを1行ずつ解析し、コードブロック・テーブル・見出し・引用・区切り線・リスト・インライン装飾を各専用ハンドラーに委譲する。
function parseMarkdown(md) {
  const lines = md.split(/\n/); // 入力を個々の行に分割する。
  const out = []; // 生成されたHTML行を蓄積する。
  let inCodeBlock = false; // フェンス付きコードブロック内にいるかを追跡する。
  let codeBlockLang = ""; // ```の後の言語識別子を記憶する。
  let inPre = false; // 4スペースのインデントによる整形済みブロック内かを追跡する。
  let tableBuffer = []; // テーブル行を一時的に保持する。
  let listStack = []; // ネストされたリストのコンテキストを保持するスタック。

  function getIndent(line) {
    const match = line.match(/^(\s*)/);
    return match ? match[1].length : 0;
  }

  function closeLists(currentIndent) {
    while (
      listStack.length > 0 &&
      listStack[listStack.length - 1].indent >= currentIndent
    ) {
      out.push(listStack.pop().type === "ul" ? "</ul>" : "</ol>");
    }
  }

  // フェンス付きコードブロック（``` または ~~~）を処理する。
  function handleCodeBlock(line) {
    const fenceMatch = line.match(/^(```|~~~)\s*(\w+)?$/);
    if (fenceMatch) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        // fenceMatch[2] には ```js のような言語名が入る。
        codeBlockLang = fenceMatch[2] || "";
        const cls = codeBlockLang ? ` class="language-${codeBlockLang}"` : ""; // シンタックスハイライタ用のクラスを追加する。
        out.push(`<pre><code${cls}>`);
      } else {
        inCodeBlock = false;
        codeBlockLang = "";
        out.push("</code></pre>");
      }
      return true;
    }
    if (inCodeBlock) {
      if (codeBlockLang === "js") {
        out.push(highlightJsSyntax(line));
      } else {
        out.push(escapeHtml(line));
      }
      return true;
    }
    return false;
  }

  // 4スペースでインデントされた整形済みテキストを処理する。
  function handlePreformatted(line) {
    if (/^\s{4,}/.test(line)) {
      if (!inPre) {
        out.push("<pre>");
        inPre = true;
      }
      out.push(escapeHtml(line));
      return true;
    } else if (inPre) {
      out.push("</pre>");
      inPre = false;
    }
    return false;
  }

  // パイプで区切られたテーブル行を処理する。
  function handleTable(line) {
    if (/^\|.*\|$/.test(line)) {
      tableBuffer.push(line);
      return true;
    } else if (tableBuffer.length > 0) {
      out.push(renderTable(tableBuffer));
      tableBuffer = [];
    }
    return false;
  }

  // 先頭の#で定義された見出しを処理する。
  function handleHeading(line) {
    if (/^#{1,6} /.test(line)) {
      closeLists(0);
      const level = line.match(/^#+/)[0].length;
      out.push(`<h${level}>${line.slice(level).trim()}</h${level}>`);
      return true;
    }
    return false;
  }

  // > で始まる引用を処理する。
  function handleBlockquote(line) {
    if (/^>+ /.test(line)) {
      closeLists(0);
      line = line.replace(/^>+ /, "").trim();
      out.push(`<blockquote>${line}</blockquote>`);
      return true;
    }
    return false;
  }

  // 3つ以上の*, -, _による水平線を処理する。
  function handleHorizontalRule(line) {
    if (/^\*{3,}|-{3,}|_{3,}/.test(line)) {
      closeLists(0);
      out.push("<hr>");
      return true;
    }
    return false;
  }

  // 入れ子のある順序付き・順序なしリストを処理する。
  function handleList(line) {
    const ulMatch = line.match(/^(\s*)[-+*] (.*)/);
    const olMatch = line.match(/^(\s*)\d+\. (.*)/);
    if (ulMatch || olMatch) {
      const indentSpaces = getIndent(line);
      // 2スペースごとに階層を増やす
      const indentLevel = Math.floor(indentSpaces / 2);
      const type = ulMatch ? "ul" : "ol";
      // リスト項目のテキストにインラインMarkdown機能を適用する。
      const itemText = applyInlineFormatting(
        ulMatch ? ulMatch[2] : olMatch[2]
      );
      // インデントに基づいてネストを調整する。
      if (
        listStack.length === 0 ||
        listStack[listStack.length - 1].indent < indentLevel
      ) {
        out.push(type === "ul" ? "<ul>" : "<ol>");
        listStack.push({ type, indent: indentLevel });
      } else {
        closeLists(indentLevel);
        if (
          listStack.length === 0 ||
          listStack[listStack.length - 1].type !== type
        ) {
          out.push(type === "ul" ? "<ul>" : "<ol>");
          listStack.push({ type, indent: indentLevel });
        }
      }
      out.push(`<li>${itemText}</li>`);
      return true;
    } else {
      closeLists(0);
    }
    return false;
  }

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // まずフェンス付きコードブロックを処理する。
    if (handleCodeBlock(line)) continue;

    // 整形済みテキストブロックを処理する。
    if (handlePreformatted(line)) continue;

    // テーブル構文を処理する。
    if (handleTable(line)) continue;

    if (/^\s*$/.test(line)) {
      // 空行は段落とリストを区切る。
      closeLists(0);
      out.push("<br>");
      continue;
    }

    // 見出し（# から ######）を処理する。
    if (handleHeading(line)) continue;

    // 引用（>で始まる行）を処理する。
    if (handleBlockquote(line)) continue;

    // 水平線（***、---、___）を処理する。
    if (handleHorizontalRule(line)) continue;

    // 順序付き・順序なしリストを処理する。
    if (handleList(line)) continue;

    // 残りのテキストにインラインMarkdown機能を適用する。
    line = applyInlineFormatting(line);
    out.push(`<p>${line}</p>`);
  }

  closeLists(0);
  if (inPre) out.push("</pre>");
  if (tableBuffer.length > 0) out.push(renderTable(tableBuffer));

  return out.join("\n");
}

// Markdownのテーブル行配列をHTMLテーブル文字列に変換する。
function renderTable(lines) {
  // ヘッダー行を解析して列タイトルを抽出する。
  const header = lines[0]
    .split("|")
    .map((cell) => cell.trim())
    .filter(Boolean);

  // 配置定義行（例: :---, ---:, :-:）を解析する。
  const aligns = lines[1]
    .split("|")
    .map((cell) => cell.trim())
    .filter(Boolean);

  // 残りの行をテーブルセル配列に変換する。
  const rows = lines.slice(2).map((row) =>
    row
      .split("|")
      .map((cell) => cell.trim())
      .filter(Boolean)
  );

  // 配置マーカーをCSSのtext-align値に変換する。
  const alignment = aligns.map((cell) => {
    if (/^:-+:$/.test(cell)) return "center";
    if (/^-+:$/.test(cell)) return "right";
    if (/^:-+$/.test(cell)) return "left";
    return null;
  });

  // 配置スタイルを適用しつつテーブルヘッダーのHTMLを構築する。
  let thead =
    "<thead><tr>" +
    header
      .map((h, i) => {
        const align = alignment[i]
          ? ` style="text-align:${alignment[i]}"`
          : "";
        return `<th${align}>${h}</th>`;
      })
      .join("") +
    "</tr></thead>";

  // 各行のテーブルボディHTMLを構築する。
  let tbody =
    "<tbody>" +
    rows
      .map(
        (r) =>
          "<tr>" +
          r
            .map((c, i) => {
              const align = alignment[i]
                ? ` style="text-align:${alignment[i]}"`
                : "";
              return `<td${align}>${c}</td>`;
            })
            .join("") +
          "</tr>"
      )
      .join("") +
    "</tbody>";

  return `<table>${thead}${tbody}</table>`;
}
