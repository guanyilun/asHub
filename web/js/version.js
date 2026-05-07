import { t } from "./i18n.js";

const versionLabel = document.getElementById("version-label");

// Track state for langchange refresh
let versionState = "checking"; // "checking" | "current" | "update" | "error"
let versionCurrent = "";

// Set initial title (JS manages this dynamically, so no data-i18n-title in HTML)
if (versionLabel) versionLabel.title = t("checking.updates");

const refreshVersionLabel = () => {
  if (!versionLabel) return;
  switch (versionState) {
    case "checking":
      versionLabel.title = t("checking.updates");
      break;
    case "current":
      versionLabel.title = `asHub v${versionCurrent}`;
      break;
    case "update":
      versionLabel.textContent = t("version.available", { ver: versionCurrent });
      versionLabel.title = t("version.update.hint", { ver: versionCurrent });
      break;
    case "error":
      versionLabel.textContent = "";
      versionLabel.title = "";
      break;
  }
};

document.addEventListener("langchange", refreshVersionLabel);

(async () => {
  if (!versionLabel) return;

  try {
    const resp = await fetch("/api/version");
    const data = await resp.json();
    const current = data.version || "0.0.0";
    if (!versionLabel.classList.contains("has-update")) {
      versionLabel.textContent = `v${current}`;
      versionLabel.classList.add("visible", "up-to-date");
      versionLabel.title = `asHub v${current}`;
      versionState = "current";
      versionCurrent = current;
    }
  } catch {
    if (!versionLabel.classList.contains("has-update")) {
      versionLabel.textContent = "";
      versionLabel.title = "";
      versionState = "error";
    }
  }

  if (window.electronAPI?.onUpdateAvailable) {
    let updateClickBound = false;
    window.electronAPI.onUpdateAvailable((newVersion) => {
      if (!versionLabel) return;
      versionState = "update";
      versionCurrent = newVersion;
      versionLabel.textContent = t("version.available", { ver: newVersion });
      versionLabel.classList.add("visible");
      versionLabel.classList.remove("up-to-date");
      versionLabel.classList.add("has-update");
      versionLabel.title = t("version.update.hint", { ver: newVersion });
      if (!updateClickBound) {
        updateClickBound = true;
        let checking = false;
        versionLabel.addEventListener("click", async () => {
          if (checking) return;
          checking = true;
          try {
            await window.electronAPI.checkForUpdate?.();
          } finally {
            checking = false;
          }
        });
      }
    });
  }
})();
