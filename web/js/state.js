// @ts-check
import { signal } from "../vendor/signals-core.js";

export const sessionId = (location.pathname.match(/^\/([0-9a-f]{4,32})\/?$/) ?? [])[1] ?? "";
export const eventsUrl = `/${sessionId}/events?tail=50`;
export const submitUrl = `/${sessionId}/submit`;

export const homeDir = signal("");

export const headerTopic = signal("");
export const headerCwd = signal("");

export const state = {
  isProcessing: false,
  isSubmitting: false,
  currentTurn: -1,
  cwd: "",
  lastQuery: "",
  lastUsage: null,
  contextWindow: 0,
  replaying: false,
};

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
