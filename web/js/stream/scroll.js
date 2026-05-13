const jumpToBottom = (streamEl) => {
  streamEl.scrollTo({ top: streamEl.scrollHeight, behavior: "instant" });
};

/** Force-scroll to bottom immediately (used after replay flush). */
export const forceScrollBottom = (session) => {
  if (!session?.streamEl) return;
  jumpToBottom(session.streamEl);
  session.scroll.stickToBottom = true;
  if (session.pillEl) session.pillEl.hidden = true;
};

export const maybeScroll = (session) => {
  if (!session || session.state.replaying) return;
  if (session.scroll.stickToBottom ?? true) {
    if (session.streamEl) jumpToBottom(session.streamEl);
  } else if (session.pillEl) {
    session.pillEl.hidden = false;
  }
};

export const hideEmptyState = (session) => {
  const el = session?.emptyStateEl;
  if (el && !el.hidden) el.hidden = true;
};
