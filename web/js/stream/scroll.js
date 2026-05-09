import { state } from "../state.js";

const stream = document.getElementById("stream");
const pill = document.getElementById("scroll-pill");
const emptyState = document.getElementById("stream-empty");

const SCROLL_SLOP = 40;
let stickToBottom = true;

const isAtBottom = () =>
  stream.scrollHeight - stream.scrollTop - stream.clientHeight <= SCROLL_SLOP;

const jumpToBottom = () => {
  stream.scrollTo({ top: stream.scrollHeight, behavior: "instant" });
};

const scrollToBottom = () => {
  stream.scrollTo({ top: stream.scrollHeight, behavior: "smooth" });
  stickToBottom = true;
  if (pill) pill.hidden = true;
};

/** Force-scroll to bottom immediately (used after replay flush). */
export const forceScrollBottom = () => {
  jumpToBottom();
  stickToBottom = true;
  if (pill) pill.hidden = true;
};

stream.addEventListener("scroll", () => {
  stickToBottom = isAtBottom();
  if (pill && stickToBottom) pill.hidden = true;
});
pill?.addEventListener("click", scrollToBottom);

/** Save/restore for infinite-scroll replay (prevents scroll-state corruption). */
export const getScrollState = () => ({
  stickToBottom,
  pillHidden: pill?.hidden ?? true,
});
export const setScrollState = (s) => {
  stickToBottom = s.stickToBottom ?? true;
  if (pill) pill.hidden = s.pillHidden ?? true;
};

export const maybeScroll = () => {
  // During SSE replay batching, skip scroll to avoid hundreds of forced
  // layouts — the replay exit code will scroll once at the end.
  if (state.replaying) return;
  if (stickToBottom) {
    jumpToBottom();
  } else if (pill) {
    pill.hidden = false;
  }
};

export const hideEmptyState = () => {
  if (emptyState && !emptyState.hidden) emptyState.hidden = true;
};

document.getElementById("stream-empty-prompt")?.addEventListener("click", () => {
  document.getElementById("query")?.focus();
});
