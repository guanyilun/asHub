import { sessionId } from "./state.js";

const app = document.querySelector(".app");
const filesPanel = document.getElementById("files-panel");
const filesToggle = document.getElementById("files-toggle");
const filesClose = document.getElementById("files-close");
const filesRefresh = document.getElementById("files-refresh");
const filesBody = document.getElementById("files-body");
const filesCwd = document.getElementById("files-cwd");
const filesEmpty = document.getElementById("files-empty");

const LS_FILES = "ash.files-open";

const showFilesEmpty = (msg, sub) => {
  if (!filesEmpty) return;
  filesEmpty.hidden = false;
  filesEmpty.innerHTML = msg;
  const subEl = filesEmpty.querySelector(".files-empty-sub");
  if (sub) {
    if (!subEl) filesEmpty.insertAdjacentHTML("beforeend", `<span class="files-empty-sub">${sub}</span>`);
    else subEl.textContent = sub;
  } else {
    if (subEl) subEl.remove();
  }
};

const renderFiles = (files) => {
  if (!filesBody || !filesEmpty) return;
  filesBody.querySelectorAll(".files-entry").forEach((el) => el.remove());
  if (files.length === 0) {
    showFilesEmpty("no files", "the working directory is empty or contains only hidden files");
    return;
  }
  filesEmpty.hidden = true;
  const frag = document.createDocumentFragment();
  for (const f of files) {
    const el = document.createElement("div");
    el.className = `files-entry ${f.kind}`;
    const icon = document.createElement("span");
    icon.className = `files-entry-icon ${f.kind}`;
    icon.innerHTML = f.kind === "dir"
      ? `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 3.5a1.5 1.5 0 0 1 1.5-1.5h3L7 4h4.5a1.5 1.5 0 0 1 1.5 1.5V11a1.5 1.5 0 0 1-1.5 1.5H2.5A1.5 1.5 0 0 1 1 11V3.5z"/>
         </svg>`
      : `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 1.5h5l3 3v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V2.5a1 1 0 0 1 1-1z"/>
          <polyline points="8 1.5 8 4.5 11 4.5"/>
         </svg>`;
    const name = document.createElement("span");
    name.className = "files-entry-name";
    name.textContent = f.name;
    const kb = document.createElement("span");
    kb.className = "files-entry-kb";
    el.appendChild(icon);
    el.appendChild(name);
    el.appendChild(kb);
    el.addEventListener("dblclick", () => {
      const inp = document.getElementById("query");
      if (!inp) return;
      const current = inp.value.trim();
      const sep = current.length > 0 ? " " : "";
      inp.value = current + sep + f.name;
      inp.focus();
      inp.setSelectionRange(inp.value.length, inp.value.length);
    });
    el.title = `double-click to insert "${f.name}"`;
    frag.appendChild(el);
  }
  filesBody.appendChild(frag);
};

const fetchFiles = async () => {
  if (!filesBody || !filesCwd || !filesEmpty) return;
  if (!sessionId) { showFilesEmpty("no session", "create a session from the sidebar to browse files"); return; }
  showFilesEmpty("loading…");
  filesBody.querySelectorAll(".files-entry").forEach((el) => el.remove());
  try {
    const resp = await fetch(`/${sessionId}/files`);
    const data = await resp.json();
    filesCwd.textContent = data.cwd || "";
    filesCwd.title = data.cwd || "";
    renderFiles(data.files || []);
  } catch {
    showFilesEmpty("failed to load", "check that the working directory exists");
  }
};

const setFilesOpen = (on) => {
  if (on) { filesPanel.removeAttribute("hidden"); app.classList.add("files-open"); fetchFiles(); }
  else { filesPanel.setAttribute("hidden", ""); app.classList.remove("files-open"); }
  try { localStorage.setItem(LS_FILES, on ? "1" : "0"); } catch {}
};

filesToggle?.addEventListener("click", () => setFilesOpen(filesPanel.hasAttribute("hidden")));
filesClose?.addEventListener("click", () => setFilesOpen(false));
filesRefresh?.addEventListener("click", () => fetchFiles());

try {
  if (localStorage.getItem(LS_FILES) === "1") setFilesOpen(true);
} catch {}

// Called from sse.js on shell:cwd-change so the listing tracks the agent.
export const refreshFilesIfOpen = () => {
  if (filesPanel && !filesPanel.hasAttribute("hidden")) fetchFiles();
};
