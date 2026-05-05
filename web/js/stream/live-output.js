import { maybeScroll } from "./scroll.js";

const stream = document.getElementById("stream");

let liveToolOutput = null;  // { callId, lines, blockEl, rafPending }
const completedTools = new Set();

const flushLiveOutput = () => {
  if (!liveToolOutput) return;
  liveToolOutput.rafPending = false;
  const el = liveToolOutput.blockEl;
  el.textContent = liveToolOutput.lines.join("\n");
  el.scrollTop = el.scrollHeight;
  maybeScroll();
};

const scheduleLiveOutput = () => {
  if (!liveToolOutput || liveToolOutput.rafPending) return;
  liveToolOutput.rafPending = true;
  requestAnimationFrame(flushLiveOutput);
};

export const finalizeLiveOutput = () => {
  if (!liveToolOutput) return;
  if (liveToolOutput.rafPending) flushLiveOutput();
  liveToolOutput.blockEl.classList.add("final");
  liveToolOutput = null;
};

export const resetCompletedTools = () => {
  completedTools.clear();
};

// Output-chunk events have no toolCallId; attach to the latest tool-row.
export const appendLiveOutputChunk = (chunk) => {
  if (!chunk) return;
  const rows = stream.querySelectorAll(".tool-row");
  const row = rows.length > 0 ? rows[rows.length - 1] : null;
  const callId = row?.dataset.callId ?? "";

  if (callId && completedTools.has(callId)) return;

  if (!liveToolOutput || liveToolOutput.callId !== callId) {
    const block = document.createElement("pre");
    block.className = "tool-body tool-body-live";
    liveToolOutput = { callId, lines: [], blockEl: block, rafPending: false };
    const parent = row ? row.parentNode : null;
    if (parent && row) {
      parent.insertBefore(block, row.nextSibling);
    }
  }

  const parts = chunk.split("\n");
  if (liveToolOutput.lines.length > 0) {
    liveToolOutput.lines[liveToolOutput.lines.length - 1] += parts[0];
  } else {
    liveToolOutput.lines.push(parts[0]);
  }
  for (let i = 1; i < parts.length; i++) {
    liveToolOutput.lines.push(parts[i]);
  }
  scheduleLiveOutput();
};

// Returns true if the buffered output became the tool body; false → caller
// falls back to resultDisplay.
export const absorbAsToolBody = (callId) => {
  if (callId) completedTools.add(callId);
  if (!liveToolOutput || liveToolOutput.callId !== callId) return false;
  if (liveToolOutput.rafPending) flushLiveOutput();
  const blockEl = liveToolOutput.blockEl;
  blockEl.classList.add("final");
  const lines = liveToolOutput.lines;
  const all = lines.join("\n");
  const LIMIT = 6;

  const textEl = document.createElement("span");
  textEl.className = "tool-body-text";
  textEl.textContent = all;
  blockEl.textContent = "";
  blockEl.appendChild(textEl);

  const actions = document.createElement("div");
  actions.className = "tool-body-actions";

  if (lines.length > LIMIT) {
    textEl.textContent = lines.slice(0, LIMIT).join("\n");
    const toggle = document.createElement("button");
    toggle.className = "tool-body-btn";
    toggle.textContent = `show ${lines.length - LIMIT} more`;
    let expanded = false;
    toggle.addEventListener("click", () => {
      expanded = !expanded;
      textEl.textContent = expanded ? all : lines.slice(0, LIMIT).join("\n");
      toggle.textContent = expanded
        ? "show less"
        : `show ${lines.length - LIMIT} more`;
      blockEl.classList.toggle("expanded", expanded);
    });
    actions.appendChild(toggle);
  }
  if (actions.children.length > 0) {
    blockEl.appendChild(actions);
  }
  liveToolOutput = null;
  return true;
};
