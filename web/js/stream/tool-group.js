import { hideEmptyState, maybeScroll } from "./scroll.js";

const stream = document.getElementById("stream");

const TOOL_GROUP_COLLAPSE = 2;
const groupState = new WeakMap();
let currentToolGroup = null;

const toolCount = (g) => g.querySelectorAll(".tool-row").length;

const updateToolGroupHead = (g) => {
  const { head } = groupState.get(g);
  const arrow = g.classList.contains("collapsed") ? "▸" : "▾";
  head.textContent = `${arrow} ${toolCount(g)} tools`;
};

const openToolGroup = () => {
  if (currentToolGroup) return currentToolGroup;
  const g = document.createElement("div");
  g.className = "tool-group";
  const head = document.createElement("button");
  head.type = "button";
  head.className = "tool-group-head";
  head.hidden = true;
  head.addEventListener("click", () => {
    g.dataset.userToggled = "1";
    g.classList.toggle("collapsed");
    updateToolGroupHead(g);
  });
  const body = document.createElement("div");
  body.className = "tool-group-body";
  g.append(head, body);
  groupState.set(g, { head, body });
  hideEmptyState();
  stream.appendChild(g);
  currentToolGroup = g;
  maybeScroll();
  return g;
};

export const appendToGroup = (node) => {
  const g = openToolGroup();
  groupState.get(g).body.appendChild(node);
  maybeScroll();
};

export const bumpToolCount = () => {
  const g = openToolGroup();
  if (toolCount(g) >= TOOL_GROUP_COLLAPSE) {
    groupState.get(g).head.hidden = false;
    updateToolGroupHead(g);
  }
};

// Collapse here, not in bumpToolCount, so rows stay visible while running.
const closeToolGroup = () => {
  const g = currentToolGroup;
  if (!g) return;
  currentToolGroup = null;
  if (groupState.get(g).body.children.length === 0) { g.remove(); return; }
  if (toolCount(g) >= TOOL_GROUP_COLLAPSE) {
    if (!g.dataset.userToggled) g.classList.add("collapsed");
    updateToolGroupHead(g);
  }
};

export const append = (node) => {
  closeToolGroup();
  hideEmptyState();
  stream.appendChild(node);
  maybeScroll();
};
