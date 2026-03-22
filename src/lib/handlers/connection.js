import { PROVIDER_METHODS } from "../constants.js";
import { ProviderError } from "../errors.js";
import { connectOrigin, disconnectOrigin } from "../provider-state.js";
import { enqueueApproval } from "../approvals.js";
import { getSettings, setSettings, getCustomChains, setCustomChains } from "../storage.js";

function sanitizeRequestedPermissions(value) {
  if (!Array.isArray(value) || value.length === 0) {
    return [
      PROVIDER_METHODS.GET_PUBLIC_KEY,
      PROVIDER_METHODS.SIGN_MESSAGE,
      PROVIDER_METHODS.SIGN_PAYLOAD,
      PROVIDER_METHODS.BUILD_OWNERSHIP_PROOF,
      PROVIDER_METHODS.SEND_TRANSACTION,
      PROVIDER_METHODS.SIMULATE_CALL,
      PROVIDER_METHODS.GET_NONCE,
    ];
  }
  return Array.from(
    new Set(
      value.filter((entry) => typeof entry === "string" && Object.values(PROVIDER_METHODS).includes(entry))
    )
  );
}

async function resolveChainConfig(chainId) {
  const settings = await getSettings();
  if (settings.chainId === chainId) {
    return settings;
  }

  const customChains = await getCustomChains();
  const customChain = customChains.find((entry) => entry.chainId === chainId);
  if (customChain) {
    return {
      ...settings,
      networkId: customChain.networkId ?? chainId,
      chainId: customChain.chainId,
      rpcUrl: customChain.rpcUrl,
      network: {
        id: customChain.networkId ?? chainId,
        chain_id: customChain.chainId,
        label: customChain.networkLabel ?? customChain.chainId,
        rpc_endpoints: [customChain.rpcUrl],
      },
    };
  }

  if (settings.network?.chain_id === chainId) {
    return settings;
  }

  throw new ProviderError("INVALID_PARAMS", `Unknown chain: ${chainId}`);
}

export async function handleConnect(ctx) {
  const { origin, method, params } = ctx;
  const requestedPermissions = sanitizeRequestedPermissions(params.permissions);
  return enqueueApproval({
    method,
    origin,
    summary: {
      kind: "connect",
      permissions: requestedPermissions,
    },
    execute: () => connectOrigin(origin, requestedPermissions),
  });
}

export async function handleDisconnect(ctx) {
  const { origin } = ctx;
  const result = await disconnectOrigin(origin);
  await emitProviderEvent("disconnect", { origin }, origin);
  return result;
}

export async function handleSwitchChain(ctx) {
  const { origin, params } = ctx;
  if (typeof params.chainId !== "string" || params.chainId.length === 0) {
    throw new ProviderError("INVALID_PARAMS", "Missing chainId.");
  }

  const settings = await resolveChainConfig(params.chainId);
  await setSettings({
    ...settings,
    networkId: settings.network?.id ?? settings.networkId,
    rpcUrl: settings.rpcUrl,
    chainId: settings.chainId,
    locale: settings.locale,
    networkRegistryUrl: settings.networkRegistryUrl ?? "",
    rpcUrlSource: settings.rpcUrlSource ?? "registry",
    chainIdSource: settings.chainIdSource ?? "registry",
  });
  return connectOrigin(origin, sanitizeRequestedPermissions(params.permissions));
}

export async function handleAddChain(ctx) {
  const { params } = ctx;
  if (typeof params.chainId !== "string" || params.chainId.length === 0) {
    throw new ProviderError("INVALID_PARAMS", "Missing chainId.");
  }
  if (typeof params.rpcUrl !== "string" || params.rpcUrl.length === 0) {
    throw new ProviderError("INVALID_PARAMS", "Missing rpcUrl.");
  }

  const customChains = await getCustomChains();
  const nextEntry = {
    chainId: params.chainId,
    rpcUrl: params.rpcUrl,
    networkLabel: typeof params.networkLabel === "string" ? params.networkLabel : params.chainId,
    networkId: typeof params.networkId === "string" && params.networkId.length > 0 ? params.networkId : params.chainId,
  };
  const merged = [
    ...customChains.filter((entry) => entry.chainId !== nextEntry.chainId),
    nextEntry,
  ];
  await setCustomChains(merged);
  return { added: true, chainId: nextEntry.chainId };
}

export async function handleAccounts(ctx) {
  const { snapshot, wallet } = ctx;
  return snapshot.connection && wallet ? [wallet.address] : [];
}

export async function handleChainId(ctx) {
  const { snapshot } = ctx;
  return snapshot.settings.chainId;
}

export async function handlePermissions(ctx) {
  const { snapshot } = ctx;
  return snapshot.connection?.permissions ?? [];
}

export async function handleRequestPermissions(ctx) {
  const { origin, method, params, wallet, snapshot } = ctx;
  const requestedPermissions = sanitizeRequestedPermissions(params.permissions);
  if (!wallet) {
    throw new ProviderError("WALLET_UNAVAILABLE", "No wallet configured.");
  }
  if (requestedPermissions.length === 0) {
    return snapshot.connection?.permissions ?? [];
  }
  const missingPermissions = requestedPermissions.filter(
    (permission) => !snapshot.connection?.permissions?.includes(permission)
  );
  if (missingPermissions.length === 0) {
    return snapshot.connection?.permissions ?? [];
  }
  return enqueueApproval({
    method,
    origin,
    summary: {
      kind: "connect",
      permissions: missingPermissions,
    },
    execute: async () => {
      const connection = await connectOrigin(origin, missingPermissions);
      return connection.permissions;
    },
  });
}

async function emitProviderEvent(eventName, detail, targetOrigin = null) {
  const tabs = await chrome.tabs.query({});
  await Promise.all(
    tabs
      .filter((tab) => typeof tab.id === "number")
      .map((tab) =>
        chrome.tabs
          .sendMessage(tab.id, {
            type: "DILITHIA_PROVIDER_EVENT",
            eventName,
            detail,
            targetOrigin,
          })
          .catch(() => {})
      )
  );
}
