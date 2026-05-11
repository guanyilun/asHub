import { lang, setLang } from "./i18n.js";

const LS_THEME = "ash-theme";
const LS_SIDEBAR = "ash.sidebar-collapsed";
const LS_SIDEBAR_W = "ash.sidebar-width";
const SIDEBAR_MIN = 200;
const SIDEBAR_MAX = 480;

const app = document.querySelector(".app");
const themeToggle = document.getElementById("theme-toggle");
const themeIconSun = document.getElementById("theme-icon-sun");
const themeIconMoon = document.getElementById("theme-icon-moon");
const hljsDark = document.getElementById("hljs-dark");
const hljsLight = document.getElementById("hljs-light");
const sidebarToggle = document.getElementById("sidebar-toggle");
const langToggle = document.getElementById("lang-toggle");

const setTheme = (theme) => {
  document.documentElement.setAttribute("data-theme", theme);
  if (hljsDark) hljsDark.disabled = theme === "light";
  if (hljsLight) hljsLight.disabled = theme === "dark";
  if (themeIconSun) themeIconSun.hidden = theme !== "light";
  if (themeIconMoon) themeIconMoon.hidden = theme !== "dark";
  try { localStorage.setItem(LS_THEME, theme); } catch {}
};

const toggleTheme = () => {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  setTheme(current === "light" ? "dark" : "light");
};

try {
  const stored = localStorage.getItem(LS_THEME);
  setTheme(stored === "dark" ? "dark" : "light");
} catch { setTheme("light"); }

themeToggle?.addEventListener("click", toggleTheme);

const setSidebarCollapsed = (on) => {
  app.classList.toggle("sidebar-collapsed", on);
  if (sidebarToggle) sidebarToggle.textContent = on ? "›" : "‹";
  try { localStorage.setItem(LS_SIDEBAR, on ? "1" : "0"); } catch {}
};

try {
  if (localStorage.getItem(LS_SIDEBAR) === "1") setSidebarCollapsed(true);
} catch {}

sidebarToggle?.addEventListener("click", () => {
  setSidebarCollapsed(!app.classList.contains("sidebar-collapsed"));
});

const sidebarResize = document.getElementById("sidebar-resize");

const setSidebarWidth = (w) => {
  const clamped = Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, w));
  app.style.setProperty("--sidebar-w", `${clamped}px`);
  return clamped;
};

try {
  const stored = parseInt(localStorage.getItem(LS_SIDEBAR_W) ?? "", 10);
  if (Number.isFinite(stored)) setSidebarWidth(stored);
} catch {}

sidebarResize?.addEventListener("mousedown", (ev) => {
  if (app.classList.contains("sidebar-collapsed")) return;
  ev.preventDefault();
  app.classList.add("sidebar-resizing");
  const onMove = (e) => {
    setSidebarWidth(e.clientX);
  };
  const onUp = () => {
    app.classList.remove("sidebar-resizing");
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    const cur = getComputedStyle(app).getPropertyValue("--sidebar-w").trim();
    const px = parseInt(cur, 10);
    if (Number.isFinite(px)) {
      try { localStorage.setItem(LS_SIDEBAR_W, String(px)); } catch {}
    }
  };
  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);
});

sidebarResize?.addEventListener("dblclick", () => {
  app.style.removeProperty("--sidebar-w");
  try { localStorage.removeItem(LS_SIDEBAR_W); } catch {}
});

langToggle?.addEventListener("click", () => {
  setLang(lang() === "zh" ? "en" : "zh");
});
