import { DEFAULT_ORIGIN_PERMISSIONS } from "../lib/constants.js";
import { getConnections, getSettings, setConnections, setSettings } from "../lib/storage.js";
import { createTranslator } from "../lib/i18n.js";
import { fetchNetworkRegistry, findNetworkById, getPreferredRpcEndpoint } from "../lib/network-registry.js";

const form = document.getElementById("settings-form");
const networkRegistryUrlField = document.getElementById("network-registry-url");
const refreshRegistryButton = document.getElementById("refresh-registry");
const registryStatus = document.getElementById("registry-status");
const networkIdField = document.getElementById("network-id");
const rpcUrlField = document.getElementById("rpc-url");
const chainIdField = document.getElementById("chain-id");
const localeField = document.getElementById("locale");
const bootstrapPeersField = document.getElementById("bootstrap-peers");
const configurationEyebrow = document.getElementById("configuration-eyebrow");
const optionsTitle = document.getElementById("options-title");
const optionsIntro = document.getElementById("options-intro");
const networkRegistryUrlLabel = document.getElementById("network-registry-url-label");
const networkLabel = document.getElementById("network-label");
const rpcUrlLabel = document.getElementById("rpc-url-label");
const chainIdLabel = document.getElementById("chain-id-label");
const languageLabel = document.getElementById("language-label");
const bootstrapPeersLabel = document.getElementById("bootstrap-peers-label");
const installEyebrow = document.getElementById("install-eyebrow");
const installHint = document.getElementById("install-hint");
const connectedSitesEyebrow = document.getElementById("connected-sites-eyebrow");
const connectedSitesList = document.getElementById("connected-sites-list");

let currentRegistry = null;

async function revokeConnection(origin) {
  const response = await chrome.runtime.sendMessage({ type: "DILITHIA_POPUP_REVOKE_CONNECTION", origin });
  if (!response?.ok) {
    throw new Error(response?.error ?? "Failed to revoke site access.");
  }
}

function applyTranslations(settings) {
  const t = createTranslator(settings.locale);
  document.documentElement.lang = settings.locale;
  document.title = t("options_title");
  configurationEyebrow.textContent = t("configuration");
  optionsTitle.textContent = t("options_title");
  optionsIntro.textContent = t("options_intro");
  networkRegistryUrlLabel.textContent = t("network_registry_url");
  networkLabel.textContent = t("network");
  refreshRegistryButton.textContent = t("refresh_registry");
  rpcUrlLabel.textContent = t("rpc_url");
  chainIdLabel.textContent = t("chain_id");
  languageLabel.textContent = t("language");
  bootstrapPeersLabel.textContent = t("bootstrap_peers");
  installEyebrow.textContent = t("install");
  connectedSitesEyebrow.textContent = t("connected_sites");
  installHint.innerHTML = `${t("install_hint")} <span class="mono">chrome://extensions</span>.`;
  localeField.options[0].textContent = t("lang_en");
  localeField.options[1].textContent = t("lang_es");
  localeField.options[2].textContent = t("lang_fr");
  localeField.options[3].textContent = t("lang_pt");
  form.querySelector("button[type='submit']").textContent = t("save_settings");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function renderConnections(settings) {
  const connections = await getConnections();
  const entries = Object.entries(connections);
  const t = createTranslator(settings.locale);

  if (!entries.length) {
    connectedSitesList.innerHTML = `<div class="muted">${t("no_connected_sites")}</div>`;
    return;
  }

  connectedSitesList.innerHTML = "";
  for (const [origin, connection] of entries) {
    const card = document.createElement("div");
    card.className = "connection-card";
    const permissions = Array.isArray(connection.permissions) ? connection.permissions : [];
    const permissionOptions = DEFAULT_ORIGIN_PERMISSIONS.map(
      (permission) => `
        <label class="permission-item">
          <input type="checkbox" data-permission="${escapeHtml(permission)}" ${permissions.includes(permission) ? "checked" : ""} />
          <span class="mono">${escapeHtml(permission)}</span>
        </label>
      `
    ).join("");
    card.innerHTML = `
      <div><strong>${escapeHtml(origin)}</strong></div>
      <div><strong>${t("connected_address")}:</strong> <span class="mono">${escapeHtml(connection.address ?? "")}</span></div>
      <div><strong>${t("permissions")}:</strong></div>
      <div class="permissions-grid">${permissionOptions}</div>
      <div><strong>${t("connected_at")}:</strong> <span class="mono">${escapeHtml(connection.connectedAt ?? "")}</span></div>
      <div><strong>${t("last_approved_at")}:</strong> <span class="mono">${escapeHtml(connection.lastApprovedAt ?? "")}</span></div>
      <div class="actions">
        <button class="button" data-action="save-permissions">${t("save_permissions")}</button>
        <button class="button" data-action="revoke">${t("revoke_access")}</button>
      </div>
    `;
    card.querySelector('[data-action="save-permissions"]').addEventListener("click", async () => {
      const nextConnections = await getConnections();
      const checkedPermissions = Array.from(card.querySelectorAll("[data-permission]"))
        .filter((input) => input.checked)
        .map((input) => input.getAttribute("data-permission"))
        .filter(Boolean);
      nextConnections[origin] = {
        ...nextConnections[origin],
        permissions: checkedPermissions,
        lastApprovedAt: new Date().toISOString(),
      };
      await setConnections(nextConnections);
      await renderConnections(await getSettings());
    });
    card.querySelector('[data-action="revoke"]').addEventListener("click", async () => {
      await revokeConnection(origin);
      await renderConnections(await getSettings());
    });
    connectedSitesList.appendChild(card);
  }
}

function renderNetworkOptions(settings) {
  networkIdField.innerHTML = "";
  const networks = currentRegistry?.registry?.networks ?? [];
  for (const network of networks) {
    const option = document.createElement("option");
    option.value = network.id;
    option.textContent = `${network.label} (${network.chain_id})`;
    networkIdField.appendChild(option);
  }

  if (networks.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No networks available";
    networkIdField.appendChild(option);
  }

  networkIdField.value = settings.networkId;
}

function applyNetworkToFields(network, settings) {
  if (!network) {
    bootstrapPeersField.value = "";
    return;
  }

  if (!rpcUrlField.value.trim() || settings.rpcUrlSource === "registry" || rpcUrlField.dataset.source === "registry") {
    rpcUrlField.value = getPreferredRpcEndpoint(network);
    rpcUrlField.dataset.source = "registry";
  }
  if (
    !chainIdField.value.trim() ||
    settings.chainIdSource === "registry" ||
    chainIdField.dataset.source === "registry"
  ) {
    chainIdField.value = network.chain_id;
    chainIdField.dataset.source = "registry";
  }
  bootstrapPeersField.value = Array.isArray(network.bootstrap_peers)
    ? network.bootstrap_peers.join("\n")
    : "";
  registryStatus.textContent = `Registry: ${currentRegistry.registryUrl} | Network: ${network.label}`;
}

async function loadRegistry(settings) {
  currentRegistry = await fetchNetworkRegistry(settings);
  renderNetworkOptions(settings);
  const selectedNetwork =
    findNetworkById(currentRegistry.registry, settings.networkId) ??
    currentRegistry.registry.networks[0] ??
    null;
  if (selectedNetwork) {
    networkIdField.value = selectedNetwork.id;
    applyNetworkToFields(selectedNetwork, settings);
  } else {
    registryStatus.textContent = "Registry loaded with no networks.";
    bootstrapPeersField.value = "";
  }
}

async function init() {
  const settings = await getSettings();
  networkRegistryUrlField.value = settings.networkRegistryUrl;
  rpcUrlField.value = settings.rpcUrl;
  rpcUrlField.dataset.source = settings.rpcUrlSource;
  chainIdField.value = settings.chainId;
  chainIdField.dataset.source = settings.chainIdSource;
  localeField.value = settings.locale;
  applyTranslations(settings);

  try {
    await loadRegistry(settings);
  } catch (error) {
    registryStatus.textContent = `Registry error: ${error instanceof Error ? error.message : String(error)}`;
  }
  await renderConnections(settings);
}

networkIdField.addEventListener("change", () => {
  if (!currentRegistry?.registry) {
    return;
  }
  const selected = findNetworkById(currentRegistry.registry, networkIdField.value);
  rpcUrlField.dataset.source = "registry";
  chainIdField.dataset.source = "registry";
  applyNetworkToFields(selected, { networkId: networkIdField.value });
});

rpcUrlField.addEventListener("input", () => {
  rpcUrlField.dataset.source = "manual";
});

chainIdField.addEventListener("input", () => {
  chainIdField.dataset.source = "manual";
});

refreshRegistryButton.addEventListener("click", async () => {
  const settings = await getSettings();
  const nextSettings = {
    ...settings,
    networkRegistryUrl: networkRegistryUrlField.value.trim(),
    networkId: networkIdField.value,
  };
  try {
    await loadRegistry(nextSettings);
  } catch (error) {
    registryStatus.textContent = `Registry error: ${error instanceof Error ? error.message : String(error)}`;
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const settings = {
    networkRegistryUrl: networkRegistryUrlField.value.trim(),
    networkId: networkIdField.value.trim(),
    rpcUrl: rpcUrlField.value.trim(),
    rpcUrlSource: rpcUrlField.dataset.source === "manual" ? "manual" : "registry",
    chainId: chainIdField.value.trim(),
    chainIdSource: chainIdField.dataset.source === "manual" ? "manual" : "registry",
    locale: localeField.value,
  };
  await setSettings(settings);
  applyTranslations(settings);
  registryStatus.textContent = `Saved network ${settings.networkId || "(manual)"}`;
  await renderConnections(await getSettings());
});

init();
