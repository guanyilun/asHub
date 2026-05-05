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

stream.addEventListener("scroll", () => {
  stickToBottom = isAtBottom();
  if (pill && stickToBottom) pill.hidden = true;
});
pill?.addEventListener("click", scrollToBottom);

export const maybeScroll = () => {
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
