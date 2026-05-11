export const sessionId = (location.pathname.match(/^\/([0-9a-f]{4,32})\/?$/) ?? [])[1] ?? "";
export const eventsUrl = `/${sessionId}/events?tail=50`;
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

/** Agent identity state — used by sse.js and infinite-scroll.js */
export const agentInfo = { name: "", model: "" };
export const getAgentInfoState = () => ({ name: agentInfo.name, model: agentInfo.model });
export const setAgentInfoState = (s) => {
  agentInfo.name = s?.name ?? "";
  agentInfo.model = s?.model ?? "";
};

const spinner = document.getElementById("spinner");
const cancelBtn = document.getElementById("cancel-turn");

export const setBusy = (b) => {
  state.isProcessing = b;
  if (spinner) spinner.hidden = !b;
  if (cancelBtn) cancelBtn.hidden = !b;
};
