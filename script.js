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

// Parses Markdown line by line and delegates each construct to specialized
// handlers for code blocks, tables, headings, blockquotes, rules, lists and
// inline formatting.
function parseMarkdown(md) {
  const lines = md.split(/\n/);
  const out = [];
  let inCodeBlock = false;
  let codeBlockLang = "";
  let inPre = false;
  let tableBuffer = [];
  let listStack = []; // ネストリスト用スタック

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

  // Handle fenced code blocks (``` or ~~~).
  function handleCodeBlock(line) {
    // Toggle code block when encountering a fence line.
    if (/^```|^~~~/.test(line)) {
      inCodeBlock = !inCodeBlock;
      out.push(inCodeBlock ? "<pre><code>" : "</code></pre>");
      return true;
    }
    // Inside a code block, escape HTML to preserve code.
    if (inCodeBlock) {
      out.push(escapeHtml(line));
      return true;
    }
    return false;
  }

  // Handle four-space indented preformatted text.
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

  // Handle table lines delimited by pipes.
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

  // Handle headings defined by leading # symbols.
  function handleHeading(line) {
    if (/^#{1,6} /.test(line)) {
      closeLists(0);
      const level = line.match(/^#+/)[0].length;
      out.push(`<h${level}>${line.slice(level).trim()}</h${level}>`);
      return true;
    }
    return false;
  }

  // Handle blockquotes starting with >.
  function handleBlockquote(line) {
    if (/^>+ /.test(line)) {
      closeLists(0);
      line = line.replace(/^>+ /, "").trim();
      out.push(`<blockquote>${line}</blockquote>`);
      return true;
    }
    return false;
  }

  // Handle horizontal rules of three or more *, -, or _.
  function handleHorizontalRule(line) {
    if (/^\*{3,}|-{3,}|_{3,}/.test(line)) {
      closeLists(0);
      out.push("<hr>");
      return true;
    }
    return false;
  }

  // Handle ordered and unordered lists with nesting.
  function handleList(line) {
    const ulMatch = line.match(/^(\s*)[-+*] (.*)/);
    const olMatch = line.match(/^(\s*)\d+\. (.*)/);
    if (ulMatch || olMatch) {
      const indentSpaces = getIndent(line);
      // 2スペースごとに階層を増やす
      const indentLevel = Math.floor(indentSpaces / 2);
      const type = ulMatch ? "ul" : "ol";
      const itemText = applyInlineFormatting(
        ulMatch ? ulMatch[2] : olMatch[2]
      );
      // Adjust nesting based on indentation.
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

  // Apply inline formatting for bold, italics, links, etc.
  function applyInlineFormatting(text) {
    return text
      .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
      .replace(/___(.+?)___/g, "<strong><em>$1</em></strong>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/__(.+?)__/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/_(.+?)_/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, "<code>$1</code>")
      .replace(/!\[(.*?)\]\((.*?)\)/g, '<img alt="$1" src="$2">')
      .replace(
        /\[(.*?)\]\((.*?)\)/g,
        '<a href="$2" target="_blank">$1</a>'
      );
  }

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Handle fenced code blocks first.
    if (handleCodeBlock(line)) continue;

    // Handle preformatted text blocks.
    if (handlePreformatted(line)) continue;

    // Handle table syntax.
    if (handleTable(line)) continue;

    if (/^\s*$/.test(line)) {
      // Blank lines break paragraphs and lists.
      closeLists(0);
      out.push("<br>");
      continue;
    }

    // Handle headings (# to ######).
    if (handleHeading(line)) continue;

    // Handle blockquotes (lines starting with >).
    if (handleBlockquote(line)) continue;

    // Handle horizontal rules (***, --- or ___).
    if (handleHorizontalRule(line)) continue;

    // Handle ordered and unordered lists.
    if (handleList(line)) continue;

    // Apply inline formatting for remaining text.
    line = applyInlineFormatting(line);
    out.push(`<p>${line}</p>`);
  }

  closeLists(0);
  if (inPre) out.push("</pre>");
  if (tableBuffer.length > 0) out.push(renderTable(tableBuffer));

  return out.join("\n");
}

function renderTable(lines) {
  const header = lines[0]
    .split("|")
    .map((cell) => cell.trim())
    .filter(Boolean);
  const aligns = lines[1]
    .split("|")
    .map((cell) => cell.trim())
    .filter(Boolean);
  const rows = lines.slice(2).map((row) =>
    row
      .split("|")
      .map((cell) => cell.trim())
      .filter(Boolean)
  );

  let thead =
    "<thead><tr>" +
    header.map((h) => `<th>${h}</th>`).join("") +
    "</tr></thead>";
  let tbody =
    "<tbody>" +
    rows
      .map(
        (r) => "<tr>" + r.map((c) => `<td>${c}</td>`).join("") + "</tr>"
      )
      .join("") +
    "</tbody>";

  return `<table>${thead}${tbody}</table>`;
}
