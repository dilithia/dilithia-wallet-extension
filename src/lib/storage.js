import { DEFAULT_SETTINGS, STORAGE_KEYS } from "./constants.js";
import { fetchNetworkRegistry, findNetworkById, getPreferredRpcEndpoint } from "./network-registry.js";

function chromeGet(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
}

function chromeSet(value) {
  return new Promise((resolve) => chrome.storage.local.set(value, resolve));
}

export async function getWallet() {
  const data = await chromeGet([STORAGE_KEYS.wallet]);
  return data[STORAGE_KEYS.wallet] ?? null;
}

export async function setWallet(wallet) {
  await chromeSet({ [STORAGE_KEYS.wallet]: wallet });
}

export async function getWalletRecovery() {
  const data = await chromeGet([STORAGE_KEYS.walletRecovery]);
  return data[STORAGE_KEYS.walletRecovery] ?? null;
}

export async function setWalletRecovery(walletRecovery) {
  await chromeSet({ [STORAGE_KEYS.walletRecovery]: walletRecovery });
}

export async function getSettings() {
  const data = await chromeGet([STORAGE_KEYS.settings]);
  const baseSettings = { ...DEFAULT_SETTINGS, ...(data[STORAGE_KEYS.settings] ?? {}) };

  try {
    const { registryUrl, registry, fallbackFrom, fallbackError } = await fetchNetworkRegistry(baseSettings);
    const network = findNetworkById(registry, baseSettings.networkId) ?? registry.networks[0] ?? null;
    if (!network) {
      return {
        ...baseSettings,
        network: null,
        resolvedRegistryUrl: registryUrl,
        registryFallbackFrom: fallbackFrom ?? null,
        registryFallbackError: fallbackError ?? null,
        registryError: null,
      };
    }

    return {
      ...baseSettings,
      rpcUrl: baseSettings.rpcUrlSource === "registry" ? getPreferredRpcEndpoint(network) : baseSettings.rpcUrl,
      chainId: baseSettings.chainIdSource === "registry" ? network.chain_id : baseSettings.chainId,
      network,
      resolvedRegistryUrl: registryUrl,
      registryFallbackFrom: fallbackFrom ?? null,
      registryFallbackError: fallbackError ?? null,
      registryError: null,
    };
  } catch (error) {
    return {
      ...baseSettings,
      network: null,
      resolvedRegistryUrl: null,
      registryFallbackFrom: null,
      registryFallbackError: null,
      registryError: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function setSettings(settings) {
  await chromeSet({ [STORAGE_KEYS.settings]: settings });
}

export async function getConnections() {
  const data = await chromeGet([STORAGE_KEYS.connections]);
  return data[STORAGE_KEYS.connections] ?? {};
}

export async function setConnections(connections) {
  await chromeSet({ [STORAGE_KEYS.connections]: connections });
}

export async function getCustomChains() {
  const data = await chromeGet([STORAGE_KEYS.customChains]);
  return Array.isArray(data[STORAGE_KEYS.customChains]) ? data[STORAGE_KEYS.customChains] : [];
}

export async function setCustomChains(customChains) {
  await chromeSet({ [STORAGE_KEYS.customChains]: customChains });
}

export async function getShieldedState() {
  const data = await chromeGet([STORAGE_KEYS.shieldedState]);
  return data[STORAGE_KEYS.shieldedState] ?? { notesByAddress: {} };
}

export async function setShieldedState(shieldedState) {
  await chromeSet({ [STORAGE_KEYS.shieldedState]: shieldedState });
}

// ── Lock config ───────────────────────────────────────────────────────

export async function getLockConfig() {
  const data = await chromeGet([STORAGE_KEYS.lockConfig]);
  return data[STORAGE_KEYS.lockConfig] ?? null;
}

export async function setLockConfig(lockConfig) {
  await chromeSet({ [STORAGE_KEYS.lockConfig]: lockConfig });
}

async function sha256Hex(text) {
  const encoded = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, "0")).join("");
}

export async function hashPassword(password) {
  return sha256Hex(`dilithia-lock:${password}`);
}

export async function verifyPassword(password, storedHash) {
  const hash = await hashPassword(password);
  return hash === storedHash;
}
