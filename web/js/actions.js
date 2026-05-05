import { escape } from "./utils.js";
import { sessionId, submitUrl, state } from "./state.js";

// Atomic server-side rewind — keeps the snapshot→rewind gap race-free.
const rewindToTurn = async (turn) => {
  const res = await fetch(`/${sessionId}/context/rewind-to-turn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ turn }),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `rewind failed (${res.status})`);
  }
};

const submitAndReload = async (text) => {
  const trimmed = text.trim();
  let endpoint, body;
  if (trimmed.startsWith("/")) {
    const space = trimmed.indexOf(" ");
    endpoint = `/${sessionId}/command`;
    body = JSON.stringify({
      name: space === -1 ? trimmed : trimmed.slice(0, space),
      args: space === -1 ? "" : trimmed.slice(space + 1),
    });
  } else {
    endpoint = submitUrl;
    body = JSON.stringify({ query: trimmed });
  }
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  if (!res.ok) throw new Error(await res.text());
};

const deleteTurn = async (el) => {
  if (state.isProcessing) return;
  const turn = Number(el.dataset.turn);
  if (!Number.isInteger(turn) || turn < 0) return;
  if (!confirm("Delete this turn and everything after it?")) return;
  try {
    await rewindToTurn(turn);
    location.reload();
  } catch (e) {
    alert(`Delete failed: ${e.message ?? e}`);
  }
};

const regenTurn = async (box) => {
  if (state.isProcessing) return;
  const turn = Number(box.dataset.turn);
  const query = box._queryText;
  if (!Number.isInteger(turn) || turn < 0 || !query) return;

  try {
    await rewindToTurn(turn);
  } catch (e) {
    alert(`Regenerate failed: ${e.message ?? e}`);
    return;
  }

  try {
    await submitAndReload(query);
  } catch (e) {
    alert(`Regenerate: message resubmit failed.\n${e.message ?? e}`);
  }
  location.reload();
};

const cancelEdit = (box) => {
  if (box._editingLocked) return;
  box._editingLocked = true;
  try {
    const qText = box.querySelector(".q-text");
    if (qText && box._oldQTextHTML != null) qText.innerHTML = box._oldQTextHTML;
    box.classList.remove("editing");
    box._oldQTextHTML = null;
    const actions = box.querySelector(".msg-actions");
    if (actions) {
      actions.innerHTML = `
        <button class="msg-action-btn" data-action="edit" title="Edit message">✎</button>
        <button class="msg-action-btn" data-action="regen" title="Regenerate response">↻</button>
        <button class="msg-action-btn danger" data-action="delete" title="Delete turn">✕</button>`;
      actions.querySelector('[data-action="edit"]')?.addEventListener("click", () => editUserMsg(box));
      actions.querySelector('[data-action="regen"]')?.addEventListener("click", () => regenTurn(box));
      actions.querySelector('[data-action="delete"]')?.addEventListener("click", () => deleteTurn(box));
    }
  } finally {
    box._editingLocked = false;
  }
};

const saveEdit = async (box) => {
  if (state.isProcessing) return;
  if (box._editingLocked) return;
  const textarea = box.querySelector(".msg-edit-area");
  const newText = textarea?.value?.trim() ?? "";
  if (!newText) {
    if (textarea) {
      textarea.classList.add("error");
      setTimeout(() => textarea.classList.remove("error"), 800);
    }
    return;
  }
  const turn = Number(box.dataset.turn);
  if (!Number.isInteger(turn) || turn < 0) return;

  box._editingLocked = true;

  try {
    await rewindToTurn(turn);
  } catch (e) {
    box._editingLocked = false;
    alert(`Edit failed: ${e.message ?? e}`);
    return;
  }

  try {
    await submitAndReload(newText);
  } catch (e) {
    alert(`Edit: message resubmit failed.\n${e.message ?? e}`);
  }
  location.reload();
};

const editUserMsg = (box) => {
  if (state.isProcessing) return;
  if (box.classList.contains("editing")) return;
  if (box._editingLocked) return;

  const qText = box.querySelector(".q-text");
  if (!qText) return;

  const actions = box.querySelector(".msg-actions");
  if (actions) {
    actions.innerHTML = `
      <button class="msg-action-btn" data-action="save" title="Save (Enter)">✓</button>
      <button class="msg-action-btn" data-action="cancel" title="Cancel (Esc)">✗</button>`;
    actions.querySelector('[data-action="save"]')?.addEventListener("click", () => saveEdit(box));
    actions.querySelector('[data-action="cancel"]')?.addEventListener("click", () => cancelEdit(box));
  }

  box.classList.add("editing");
  const orig = box._queryText ?? "";
  const textarea = document.createElement("textarea");
  textarea.className = "msg-edit-area";
  textarea.value = orig;
  textarea.rows = Math.max(1, Math.min(12, orig.split("\n").length));

  box._oldQTextHTML = qText.innerHTML;

  qText.innerHTML = "";
  qText.appendChild(textarea);
  textarea.focus();
  textarea.setSelectionRange(textarea.value.length, textarea.value.length);

  textarea.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") { ev.preventDefault(); cancelEdit(box); }
    if (ev.key === "Enter" && !ev.shiftKey) { ev.preventDefault(); saveEdit(box); }
  });

  const resize = () => {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  };
  textarea.addEventListener("input", resize);
  resize();
};

export const createUserBox = (queryText) => {
  const box = document.createElement("div");
  box.className = "agent-box";
  box.innerHTML = `
    <div class="agent-box-head">
      <span class="abh-l">&gt;</span>
      <span class="abh-r">you</span>
    </div>
    <div class="q-text">${escape(queryText)}</div>`;
  const actions = document.createElement("div");
  actions.className = "msg-actions";
  actions.innerHTML = `
    <button class="msg-action-btn" data-action="edit" title="Edit message">✎</button>
    <button class="msg-action-btn" data-action="regen" title="Regenerate response">↻</button>
    <button class="msg-action-btn danger" data-action="delete" title="Delete turn">✕</button>`;
  actions.querySelector('[data-action="edit"]')?.addEventListener("click", () => editUserMsg(box));
  actions.querySelector('[data-action="regen"]')?.addEventListener("click", () => regenTurn(box));
  actions.querySelector('[data-action="delete"]')?.addEventListener("click", () => deleteTurn(box));
  box.appendChild(actions);
  box._queryText = queryText;
  return box;
};
