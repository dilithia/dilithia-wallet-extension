import { bundledRegistry } from "../networks/bundled-registry.js";

const BUNDLED_REGISTRY_PATH = "../networks/registry.json";

export function getBundledRegistryUrl() {
  try {
    return new URL(BUNDLED_REGISTRY_PATH, import.meta.url).href;
  } catch {
    return chrome.runtime.getURL("src/networks/registry.json");
  }
}

export function resolveRegistryUrl(settings) {
  if (typeof settings?.networkRegistryUrl === "string" && settings.networkRegistryUrl.trim().length > 0) {
    return settings.networkRegistryUrl.trim();
  }
  return getBundledRegistryUrl();
}

export async function fetchNetworkRegistry(settings) {
  const registryUrl = resolveRegistryUrl(settings);
  const bundledRegistryUrl = getBundledRegistryUrl();

  async function load(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load network registry: ${response.status}`);
    }
    const registry = await response.json();
    if (!Array.isArray(registry.networks)) {
      throw new Error("Network registry has no networks array.");
    }
    return {
      registryUrl: url,
      registry,
    };
  }

  try {
    return await load(registryUrl);
  } catch (error) {
    if (registryUrl === bundledRegistryUrl) {
      return {
        registryUrl: "bundled:js",
        registry: bundledRegistry,
        fallbackFrom: bundledRegistryUrl,
        fallbackError: error instanceof Error ? error.message : String(error),
      };
    }
    let fallback;
    try {
      fallback = await load(bundledRegistryUrl);
    } catch (bundledError) {
      return {
        registryUrl: "bundled:js",
        registry: bundledRegistry,
        fallbackFrom: registryUrl,
        fallbackError:
          bundledError instanceof Error ? bundledError.message : String(bundledError),
      };
    }
    return {
      ...fallback,
      fallbackFrom: registryUrl,
      fallbackError: error instanceof Error ? error.message : String(error),
    };
  }
}

export function findNetworkById(registry, networkId) {
  return registry.networks.find((network) => network.id === networkId) ?? null;
}

export function getPreferredRpcEndpoint(network) {
  if (!Array.isArray(network?.rpc_endpoints) || network.rpc_endpoints.length === 0) {
    return "";
  }
  return String(network.rpc_endpoints[0]);
}
