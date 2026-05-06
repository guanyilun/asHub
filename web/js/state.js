export const sessionId = (location.pathname.match(/^\/([0-9a-f]{4,32})\/?$/) ?? [])[1] ?? "";
export const eventsUrl = `/${sessionId}/events`;
export const submitUrl = `/${sessionId}/submit`;

export const state = {
  isProcessing: false,
  isSubmitting: false,
  currentTurn: -1,
  cwd: "",
  homeDir: "",
  lastQuery: "",
  lastUsage: null,
  contextWindow: 0,
  /** True while SSE replay frames are being batched. */
  replaying: false,
};

const spinner = document.getElementById("spinner");
const cancelBtn = document.getElementById("cancel-turn");

export const setBusy = (b) => {
  state.isProcessing = b;
  if (spinner) spinner.hidden = !b;
  if (cancelBtn) cancelBtn.hidden = !b;
};
