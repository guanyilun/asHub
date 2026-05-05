const versionLabel = document.getElementById("version-label");

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
    }
  } catch {
    if (!versionLabel.classList.contains("has-update")) {
      versionLabel.textContent = "";
      versionLabel.title = "";
    }
  }

  if (window.electronAPI?.onUpdateAvailable) {
    let updateClickBound = false;
    window.electronAPI.onUpdateAvailable((newVersion) => {
      if (!versionLabel) return;
      versionLabel.textContent = `v${newVersion} available`;
      versionLabel.classList.add("visible");
      versionLabel.classList.remove("up-to-date");
      versionLabel.classList.add("has-update");
      versionLabel.title = `Update to v${newVersion} — click to download`;
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
