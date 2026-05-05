// Entry point: wires modules in dependency order; Escape handler is the
// only cross-cutting bit (edit → config → cancel-turn priorities).
import { cancelTurn } from "./composer.js";
import { setConfigOpen } from "./config-panel.js";
import "./prefs.js";
import "./links.js";
import "./version.js";
import "./sidebar.js";
import "./context-panel.js";
import "./files-panel.js";
import "./sse.js";

const stream = document.getElementById("stream");

document.addEventListener("keydown", (ev) => {
  if (ev.key !== "Escape") return;
  const editingBox = stream.querySelector(".agent-box.editing");
  if (editingBox && editingBox._cancelEdit) { editingBox._cancelEdit(); return; }
  const configOverlay = document.getElementById("config-overlay");
  if (configOverlay && !configOverlay.hidden) { setConfigOpen(false); return; }
  cancelTurn();
});
