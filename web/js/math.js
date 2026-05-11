// Math extraction & rendering.
//
// Supports four delimiter pairs, with pandoc-style rules for $...$ to avoid
// false positives on prices and other plain-text dollar signs:
//
//   Inline  : $...$        — strict: opener not followed by space/digit,
//                            closer not preceded by space, not followed by
//                            digit, content stays on one line, non-empty.
//   Inline  : \( ... \)    — permissive.
//   Display : $$ ... $$    — permissive (may span lines).
//   Display : \[ ... \]    — permissive (may span lines).
//
// Math inside fenced (```...```) and inline (`...`) code is left untouched.
//
// Pipeline:
//   1. extractMath(raw) replaces each math span with an empty placeholder
//      span/div carrying the LaTeX source in a data-tex attribute.
//      Placeholders survive marked + DOMPurify untouched.
//   2. renderMathIn(root) walks the DOM, runs katex.renderToString into each
//      placeholder.  KaTeX output is trusted (trust:false sandboxes it).

const escapeAttr = (s) => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const findCloseDollarDollar = (src, start) => {
  for (let i = start; i < src.length - 1; i++) {
    if (src[i] === "\\") { i++; continue; }
    if (src[i] === "$" && src[i + 1] === "$") return i;
  }
  return -1;
};

const findCloseInlineDollar = (src, start) => {
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (c === "\n") return -1;
    if (c === "\\") { i++; continue; }
    if (c === "$") {
      if (src[i + 1] === "$") return -1;
      if (/\s/.test(src[i - 1] || "")) continue;
      if (/\d/.test(src[i + 1] || "")) continue;
      if (i === start) return -1;
      return i;
    }
  }
  return -1;
};

const findCloseEscape = (src, start, closeCh) => {
  for (let i = start; i < src.length - 1; i++) {
    if (src[i] === "\\" && src[i + 1] === closeCh) return i;
  }
  return -1;
};

const inlinePlaceholder = (tex) =>
  `<span class="math-tex" data-tex="${escapeAttr(tex)}"></span>`;

const displayPlaceholder = (tex) =>
  `\n\n<span class="math-tex" data-display="1" data-tex="${escapeAttr(tex)}"></span>\n\n`;

const skipFencedCode = (src, i) => {
  let runLen = 0;
  const runStart = i;
  while (i < src.length && src[i] === "`") { runLen++; i++; }
  if (runLen >= 3) {
    const closeRe = new RegExp("\\n[ \\t]{0,3}`{" + runLen + ",}[ \\t]*(?:\\n|$)");
    const m = closeRe.exec(src.slice(i));
    const end = m ? i + m.index + m[0].length : src.length;
    return { text: src.slice(runStart, end), next: end };
  }
  let j = i;
  while (j < src.length) {
    if (src[j] === "`") {
      let k = j;
      while (k < src.length && src[k] === "`") k++;
      if (k - j === runLen) { j = k; break; }
      j = k;
    } else j++;
  }
  return { text: src.slice(runStart, j), next: j };
};

export const extractMath = (src) => {
  if (!src) return "";
  let out = "";
  let i = 0;
  const len = src.length;

  while (i < len) {
    const ch = src[i];

    if (ch === "`") {
      const { text, next } = skipFencedCode(src, i);
      out += text;
      i = next;
      continue;
    }

    if (ch === "\\") {
      const next = src[i + 1];
      if (next === "(") {
        const end = findCloseEscape(src, i + 2, ")");
        if (end !== -1) {
          out += inlinePlaceholder(src.slice(i + 2, end));
          i = end + 2;
          continue;
        }
      }
      if (next === "[") {
        const end = findCloseEscape(src, i + 2, "]");
        if (end !== -1) {
          out += displayPlaceholder(src.slice(i + 2, end));
          i = end + 2;
          continue;
        }
      }
      out += ch;
      if (next != null) { out += next; i += 2; } else { i++; }
      continue;
    }

    if (ch === "$") {
      if (src[i + 1] === "$") {
        const end = findCloseDollarDollar(src, i + 2);
        if (end !== -1) {
          out += displayPlaceholder(src.slice(i + 2, end));
          i = end + 2;
          continue;
        }
      }
      const after = src[i + 1];
      if (after && after !== "$" && !/\s/.test(after) && !/\d/.test(after)) {
        const end = findCloseInlineDollar(src, i + 1);
        if (end !== -1) {
          out += inlinePlaceholder(src.slice(i + 1, end));
          i = end + 1;
          continue;
        }
      }
      out += ch;
      i++;
      continue;
    }

    out += ch;
    i++;
  }

  return out;
};

export const renderMathIn = (root) => {
  if (!root || !window.katex) return;
  const nodes = root.querySelectorAll(".math-tex[data-tex]");
  for (const node of nodes) {
    if (node.dataset.rendered === "1") continue;
    const tex = node.dataset.tex || "";
    const display = node.dataset.display === "1";
    try {
      node.innerHTML = window.katex.renderToString(tex, {
        displayMode: display,
        throwOnError: false,
        strict: "ignore",
        trust: false,
        output: "htmlAndMathml",
      });
      node.dataset.rendered = "1";
    } catch {
      node.classList.add("math-error");
      node.textContent = display ? `$$${tex}$$` : `$${tex}$`;
    }
  }
};
