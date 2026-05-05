const configOverlay = document.getElementById("config-overlay");
const configToggle = document.getElementById("config-toggle");
const configClose = document.getElementById("config-close");
const configReset = document.getElementById("config-reset");

const configBodySimple = document.getElementById("config-body-simple");
const configProvider = document.getElementById("config-provider");
const configProviderDesc = document.getElementById("config-provider-desc");
const configApikey = document.getElementById("config-apikey");
const configApikeyToggle = document.getElementById("config-apikey-toggle");
const configSaveSimple = document.getElementById("config-save-simple");

const configBodyAdvanced = document.getElementById("config-body-advanced");
const configEditor = document.getElementById("config-editor");
const configSave = document.getElementById("config-save");
const configFormat = document.getElementById("config-format");
const configValid = document.getElementById("config-valid");
const configInvalid = document.getElementById("config-invalid");

const configModeTabs = document.getElementById("config-mode-tabs");

let configMode = "simple";
let originalConfig = "";
let originalApiKey = "";

const PROVIDERS = {
  deepseek: {
    name: "DeepSeek",
    description: "DeepSeek V4 models with 1M context window",
    baseURL: "https://api.deepseek.com",
    defaultModel: "deepseek-v4-flash",
    models: [
      {
        id: "deepseek-v4-pro",
        contextWindow: 1000000,
        maxTokens: 300000,
        echoReasoning: true,
      },
      {
        id: "deepseek-v4-flash",
        contextWindow: 1000000,
        maxTokens: 300000,
        echoReasoning: true,
      },
    ],
  },
};

const buildConfig = () => {
  const providerId = configProvider.value;
  const apiKey = configApikey.value.trim();
  const providerDef = PROVIDERS[providerId];
  if (!providerDef) return null;

  let existing = {};
  try { existing = JSON.parse(originalConfig || "{}"); } catch {}

  const config = {
    providers: {
      [providerId]: {
        baseURL: providerDef.baseURL,
        apiKey: apiKey || "YOUR_API_KEY",
        defaultModel: providerDef.defaultModel,
        models: providerDef.models,
      },
    },
    defaultProvider: providerId,
  };

  for (const [key, val] of Object.entries(existing)) {
    if (key !== "providers" && key !== "defaultProvider") {
      config[key] = val;
    }
  }

  if (existing.providers && typeof existing.providers === "object") {
    for (const [key, val] of Object.entries(existing.providers)) {
      if (!(key in config.providers)) {
        config.providers[key] = val;
      }
    }
  }

  return config;
};

const parseConfigToSimple = (config) => {
  if (!config || typeof config !== "object" || Object.keys(config).length === 0) {
    configProvider.value = "deepseek";
    configApikey.value = "";
    return;
  }

  const dp = config.defaultProvider;
  let detectedProvider = null;
  let detectedApiKey = "";

  if (dp && PROVIDERS[dp]) {
    detectedProvider = dp;
  } else if (config.providers && typeof config.providers === "object") {
    for (const key of Object.keys(config.providers)) {
      if (PROVIDERS[key]) {
        detectedProvider = key;
        break;
      }
    }
  }

  if (detectedProvider) {
    configProvider.value = detectedProvider;
    if (config.providers && config.providers[detectedProvider]) {
      const p = config.providers[detectedProvider];
      if (typeof p.apiKey === "string" && p.apiKey !== "YOUR_API_KEY") {
        detectedApiKey = p.apiKey;
      }
    }
  } else {
    configProvider.value = "deepseek";
  }

  configApikey.value = detectedApiKey;
};

const updateProviderDesc = () => {
  const providerId = configProvider.value;
  const def = PROVIDERS[providerId];
  if (def && configProviderDesc) {
    configProviderDesc.textContent = def.description;
  }
};

const validateJson = () => {
  const val = configEditor.value;
  try {
    JSON.parse(val);
    configValid.hidden = false;
    configInvalid.hidden = true;
    configEditor.classList.remove("config-error");
    return true;
  } catch {
    configValid.hidden = true;
    configInvalid.hidden = false;
    configEditor.classList.add("config-error");
    return false;
  }
};

const switchConfigMode = (mode) => {
  configMode = mode;

  configModeTabs.querySelectorAll(".config-mode-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.mode === mode);
  });

  if (mode === "simple") {
    configBodySimple.removeAttribute("hidden");
    configBodyAdvanced.setAttribute("hidden", "");
    try {
      const parsed = JSON.parse(configEditor.value || "{}");
      parseConfigToSimple(parsed);
    } catch {
      parseConfigToSimple({});
    }
    updateProviderDesc();
  } else {
    configBodySimple.setAttribute("hidden", "");
    configBodyAdvanced.removeAttribute("hidden");
    const config = buildConfig();
    configEditor.value = config
      ? JSON.stringify(config, null, 2)
      : originalConfig || "{}";
    validateJson();
    configEditor.focus();
  }
};

let apiKeyVisible = false;
configApikeyToggle?.addEventListener("click", () => {
  apiKeyVisible = !apiKeyVisible;
  configApikey.type = apiKeyVisible ? "text" : "password";
  configApikeyToggle.classList.toggle("showing", apiKeyVisible);
});

configProvider?.addEventListener("change", updateProviderDesc);

export const setConfigOpen = async (on) => {
  if (on) {
    configOverlay.removeAttribute("hidden");
    let rawConfig = {};
    try {
      const r = await fetch("/api/config");
      rawConfig = await r.json();
    } catch {}
    originalConfig = JSON.stringify(rawConfig, null, 2);
    configEditor.value = originalConfig;

    originalApiKey = "";
    if (rawConfig.providers && rawConfig.defaultProvider && rawConfig.providers[rawConfig.defaultProvider]) {
      const pk = rawConfig.providers[rawConfig.defaultProvider].apiKey;
      if (typeof pk === "string" && pk !== "YOUR_API_KEY") {
        originalApiKey = pk;
      }
    }

    const hasExtraProviders = rawConfig.providers &&
      typeof rawConfig.providers === "object" &&
      Object.keys(rawConfig.providers).some((k) => !(k in PROVIDERS));
    const hasExtensions = Array.isArray(rawConfig.extensions) && rawConfig.extensions.length > 0;
    const hasExtraFields = Object.keys(rawConfig).some(
      (k) => !["providers", "defaultProvider", "extensions", "defaultBackend"].includes(k)
    );

    if (hasExtraProviders || hasExtensions || hasExtraFields) {
      switchConfigMode("advanced");
    } else {
      switchConfigMode("simple");
    }

    if (configMode === "simple") {
      parseConfigToSimple(rawConfig);
    } else {
      validateJson();
    }
  } else {
    configOverlay.setAttribute("hidden", "");
  }
};

configModeTabs?.addEventListener("click", (ev) => {
  const tab = ev.target.closest(".config-mode-tab");
  if (!tab) return;
  switchConfigMode(tab.dataset.mode);
});

configEditor?.addEventListener("input", validateJson);

configEditor?.addEventListener("keydown", (ev) => {
  if (ev.key === "Tab") {
    ev.preventDefault();
    const start = configEditor.selectionStart;
    const end = configEditor.selectionEnd;
    configEditor.value = configEditor.value.substring(0, start) + "  " + configEditor.value.substring(end);
    configEditor.selectionStart = configEditor.selectionEnd = start + 2;
  }
  if (ev.key === "s" && (ev.metaKey || ev.ctrlKey)) {
    ev.preventDefault();
    configSave?.click();
  }
});

const doSave = async (jsonStr) => {
  try {
    const r = await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: jsonStr,
    });
    if (!r.ok) throw new Error(await r.text());
    originalConfig = jsonStr;
    setConfigOpen(false);
  } catch (e) {
    alert(`save failed: ${e.message ?? e}`);
  }
};

configSave?.addEventListener("click", async () => {
  if (!validateJson()) return;
  await doSave(configEditor.value);
});

configSaveSimple?.addEventListener("click", async () => {
  const config = buildConfig();
  if (!config) return;

  if (!configApikey.value.trim() && originalApiKey) {
    const providerId = configProvider.value;
    config.providers[providerId].apiKey = originalApiKey;
  }

  await doSave(JSON.stringify(config, null, 2) + "\n");
});

configFormat?.addEventListener("click", () => {
  try {
    const parsed = JSON.parse(configEditor.value);
    configEditor.value = JSON.stringify(parsed, null, 2);
    validateJson();
  } catch {}
});

configReset?.addEventListener("click", () => {
  if (configMode === "advanced") {
    configEditor.value = originalConfig;
    validateJson();
  } else {
    parseConfigToSimple(JSON.parse(originalConfig || "{}"));
  }
});

configToggle?.addEventListener("click", () => setConfigOpen(configOverlay.hasAttribute("hidden")));
configClose?.addEventListener("click", () => setConfigOpen(false));
configOverlay?.addEventListener("click", (ev) => {
  if (ev.target === configOverlay) setConfigOpen(false);
});
