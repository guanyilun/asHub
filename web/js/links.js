document.addEventListener("click", (ev) => {
  const a = ev.target.closest("a");
  if (!a) return;
  const href = a.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;

  let isExternal = false;
  try {
    const u = new URL(href, location.origin);
    isExternal = u.origin !== location.origin;
  } catch {
    return;
  }

  if (!isExternal) return;

  ev.preventDefault();
  if (window.electronAPI?.openExternal) {
    window.electronAPI.openExternal(href).catch(() => {});
  } else {
    window.open(href, "_blank", "noopener,noreferrer");
  }
});
