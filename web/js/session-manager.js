import { signal, computed, effect } from "../vendor/signals-core.js";

export const sessions = new Map();
export const activeSessionId = signal("");

export const activeSession = computed(() => {
  const id = activeSessionId.value;
  return id ? sessions.get(id) ?? null : null;
});

export const registerSession = (view) => {
  sessions.set(view.id, view);
  if (!activeSessionId.value) activeSessionId.value = view.id;
};

export const unregisterSession = (view) => {
  sessions.delete(view.id);
  if (activeSessionId.value === view.id) activeSessionId.value = "";
};

/** True when the SPA-switching flag is set in localStorage. */
export const spaEnabled = () => {
  try { return localStorage.getItem("ash_spa") === "1"; }
  catch { return false; }
};

// Show only the active <session-view>; the rest stay mounted (live SSE,
// rendering into hidden DOM) until evicted.
effect(() => {
  const active = activeSessionId.value;
  for (const [id, el] of sessions) el.hidden = id !== active;
});

const host = () => document.querySelector("session-view")?.parentElement ?? document.body;

// Construct a hidden <session-view> next to the active one. The element's
// connectedCallback opens its own EventSource and registers itself.
export const preloadSession = (id) => {
  if (!id) throw new Error("preloadSession: id required");
  if (sessions.has(id)) return sessions.get(id);
  const el = document.createElement("session-view");
  el.setAttribute("session-id", id);
  el.hidden = true;
  host().appendChild(el);
  return el;
};

/**
 * Switch the active session to `id`, lazily constructing a SessionView if
 * none exists. Pushes to history unless `push: false` (used by popstate).
 */
export const switchTo = (id, { push = true } = {}) => {
  if (!id || activeSessionId.peek() === id) return;
  if (!sessions.has(id)) preloadSession(id);
  if (push) history.pushState({ sessionId: id }, "", `/${id}/`);
  activeSessionId.value = id;
};

window.addEventListener("popstate", (ev) => {
  const id = ev.state?.sessionId
    ?? (location.pathname.match(/^\/([0-9a-f]{4,32})\/?$/) ?? [])[1];
  if (id) switchTo(id, { push: false });
});

window.__ash = { preload: preloadSession, switchTo, sessions, activeSessionId };
