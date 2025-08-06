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

function parseMarkdown(md) {
  const lines = md.split(/\n/);
  const out = [];
  let inCodeBlock = false;
  let codeBlockLang = "";
  let inPre = false;
  let tableBuffer = [];
  let inList = false,
    inOl = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    if (/^```|^~~~/.test(line)) {
      inCodeBlock = !inCodeBlock;
      if (inCodeBlock) {
        out.push("<pre><code>");
      } else {
        out.push("</code></pre>");
      }
      continue;
    }

    if (inCodeBlock) {
      out.push(escapeHtml(line));
      continue;
    }

    if (/^\s{4,}/.test(line)) {
      if (!inPre) {
        out.push("<pre>");
        inPre = true;
      }
      out.push(escapeHtml(line));
      continue;
    } else if (inPre) {
      out.push("</pre>");
      inPre = false;
    }

    if (/^\|.*\|$/.test(line)) {
      tableBuffer.push(line);
      continue;
    } else if (tableBuffer.length > 0) {
      out.push(renderTable(tableBuffer));
      tableBuffer = [];
    }

    if (/^\s*$/.test(line)) {
      out.push("<br>");
      continue;
    }

    if (/^#{1,6} /.test(line)) {
      const level = line.match(/^#+/)[0].length;
      out.push(`<h${level}>${line.slice(level).trim()}</h${level}>`);
      continue;
    }

    if (/^>+ /.test(line)) {
      const level = line.match(/^>+/)[0].length;
      line = line.replace(/^>+ /, "").trim();
      out.push(`<blockquote>${line}</blockquote>`);
      continue;
    }

    if (/^\*{3,}|-{3,}|_{3,}/.test(line)) {
      out.push("<hr>");
      continue;
    }

    if (/^\d+\. /.test(line)) {
      if (!inOl) {
        out.push("<ol>");
        inOl = true;
      }
      out.push(`<li>${line.replace(/^\d+\. /, "")}</li>`);
      continue;
    } else if (inOl) {
      out.push("</ol>");
      inOl = false;
    }

    if (/^[-+*] /.test(line)) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${line.replace(/^[-+*] /, "")}</li>`);
      continue;
    } else if (inList) {
      out.push("</ul>");
      inList = false;
    }

    // inline formatting
    line = line
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

    out.push(`<p>${line}</p>`);
  }

  if (inPre) out.push("</pre>");
  if (inList) out.push("</ul>");
  if (inOl) out.push("</ol>");
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
