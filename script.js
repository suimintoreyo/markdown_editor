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

// 強調、コード、画像、リンクなどのインラインMarkdown機能を適用する関数
function applyInlineFormatting(text) {
  return (
    text
      // 太字＋斜体（三重アスタリスクまたはアンダースコア）
      .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
      .replace(/___(.+?)___/g, "<strong><em>$1</em></strong>")
      // 太字（二重アスタリスクまたはアンダースコア）
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/__(.+?)__/g, "<strong>$1</strong>")
      // 斜体（一重アスタリスクまたはアンダースコア）
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/_(.+?)_/g, "<em>$1</em>")
      // インラインコード（バッククォート）
      .replace(/`(.+?)`/g, "<code>$1</code>")
      // 画像: ![alt](src)
      .replace(/!\[(.*?)\]\((.*?)\)/g, '<img alt="$1" src="$2">')
      // リンク: [text](url)
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
  );
}

// Markdownを1行ずつ解析し、コードブロック、テーブル、見出し、引用、罫線、リスト、インライン整形など各構文を専用の処理に委譲する
function parseMarkdown(md) {
  const lines = md.split(/\n/); // 入力を1行ずつ分割
  const out = []; // 変換後のHTML行を蓄積する配列
  let inCodeBlock = false; // フェンス付きコードブロック内かどうかを記録
  let codeBlockLang = ""; // ```の後の言語ID（ハイライト用）を記録
  let inPre = false; // 4スペースインデントのプリフォーマットブロック内かどうか
  let tableBuffer = []; // テーブルの複数行を一時的に保存
  let listStack = []; // ネストしたリストの状態を保存するスタック

  function getIndent(line) {
    const match = line.match(/^\s*/);
    return match ? match[0].length : 0;
  }

  function closeLists(currentIndent) {
    while (
      listStack.length > 0 &&
      listStack[listStack.length - 1].indent >= currentIndent
    ) {
      out.push(listStack.pop().type === "ul" ? "</ul>" : "</ol>");
    }
  }

  // フェンス付きコードブロック（``` または ~~~）の処理
  function handleCodeBlock(line) {
    const fenceMatch = line.match(/^(```|~~~)\s*(\w+)?$/);
    if (fenceMatch) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        // fenceMatch[2]は言語名（例: ```js）
        codeBlockLang = fenceMatch[2] || "";
        const cls = codeBlockLang ? ` class="language-${codeBlockLang}"` : ""; // シンタックスハイライター用クラス追加
        out.push(`<pre><code${cls}>`);
      } else {
        inCodeBlock = false;
        codeBlockLang = "";
        out.push("</code></pre>");
      }
      return true;
    }
    if (inCodeBlock) {
      out.push(escapeHtml(line));
      return true;
    }
    return false;
  }

  // 4つ以上のスペースでインデントされたプリフォーマットテキストの処理
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

  // パイプ区切りのテーブル行の処理
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

  // #記号で始まる見出しの処理
  function handleHeading(line) {
    if (/^#{1,6} /.test(line)) {
      closeLists(0);
      const level = line.match(/^#+/)[0].length;
      out.push(`<h${level}>${line.slice(level).trim()}</h${level}>`);
      return true;
    }
    return false;
  }

  // >で始まる引用の処理
  function handleBlockquote(line) {
    if (/^>+ /.test(line)) {
      closeLists(0);
      line = line.replace(/^>+ /, "").trim();
      out.push(`<blockquote>${line}</blockquote>`);
      return true;
    }
    return false;
  }

  // ***や---、___などの水平罫線の処理
  function handleHorizontalRule(line) {
    if (/^\*{3,}|-{3,}|_{3,}/.test(line)) {
      closeLists(0);
      out.push("<hr>");
      return true;
    }
    return false;
  }

  // 順序付き・順序なしリスト（ネスト対応）の処理
  function handleList(line) {
    const ulMatch = line.match(/^\s*[-+*] (.*)/);
    const olMatch = line.match(/^\s*\d+\. (.*)/);
    if (ulMatch || olMatch) {
      const indentSpaces = getIndent(line);
      // 2スペースごとに階層を増やす
      const indentLevel = Math.floor(indentSpaces / 2);
      const type = ulMatch ? "ul" : "ol";
      // リスト項目のテキストにインラインMarkdown機能を適用
      const itemText = applyInlineFormatting(
        ulMatch ? ulMatch[2] : olMatch[2]
      );
      // インデントに応じてネスト調整
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

    // 最初にフェンス付きコードブロックの処理
    if (handleCodeBlock(line)) continue;

    // プリフォーマットテキストブロックの処理
    if (handlePreformatted(line)) continue;

    // テーブル構文の処理
    if (handleTable(line)) continue;

    if (/^\s*$/.test(line)) {
      // 空行は段落やリストを分割
      closeLists(0);
      out.push("<br>");
      continue;
    }

    // 見出し（#〜######）の処理
    if (handleHeading(line)) continue;

    // 引用（>で始まる行）の処理
    if (handleBlockquote(line)) continue;

    // 水平罫線（***, --- or ___）の処理
    if (handleHorizontalRule(line)) continue;

    // 順序付き・順序なしリストの処理
    if (handleList(line)) continue;

    // その他のテキストにインラインMarkdown機能を適用
    line = applyInlineFormatting(line);
    out.push(`<p>${line}</p>`);
  }

  closeLists(0);
  if (inPre) out.push("</pre>");
  if (tableBuffer.length > 0) out.push(renderTable(tableBuffer));

  return out.join("\n");
}

// Markdownテーブルの行配列（ヘッダー、アライメント、データ行）をHTMLテーブル文字列に変換する関数
function renderTable(lines) {
  // ヘッダー行から列タイトルを抽出
  const header = lines[0]
    .split("|")
    .map((cell) => cell.trim())
    .filter(Boolean);

  // アライメント定義行（例: :---, ---:, :-:）を解析
  const aligns = lines[1]
    .split("|")
    .map((cell) => cell.trim())
    .filter(Boolean);

  // 残りの行をテーブルのセル配列に変換
  const rows = lines.slice(2).map((row) =>
    row
      .split("|")
      .map((cell) => cell.trim())
      .filter(Boolean)
  );

  // アライメント記号をCSSのtext-align値に変換
  const alignment = aligns.map((cell) => {
    if (/^:-+:$/.test(cell)) return "center";
    if (/^-+:$/.test(cell)) return "right";
    if (/^:-+$/.test(cell)) return "left";
    return null;
  });

  // アライメントを適用しつつテーブルヘッダーHTMLを生成
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

  // 各行のテーブルボディHTMLを生成
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