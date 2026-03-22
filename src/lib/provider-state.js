import { DEFAULT_ORIGIN_PERMISSIONS } from "./constants.js";
import { getConnections, getSettings, getWallet, setConnections } from "./storage.js";

export async function connectOrigin(origin, requestedPermissions = DEFAULT_ORIGIN_PERMISSIONS) {
  const wallet = await getWallet();
  if (!wallet) {
    throw new Error("No wallet configured in the extension.");
  }

  const connections = await getConnections();
  const permissions = Array.from(
    new Set([...(connections[origin]?.permissions ?? []), ...requestedPermissions])
  );
  connections[origin] = {
    address: wallet.address,
    connectedAt: connections[origin]?.connectedAt ?? new Date().toISOString(),
    lastApprovedAt: new Date().toISOString(),
    permissions,
  };
  await setConnections(connections);

  const settings = await getSettings();
  return {
    address: wallet.address,
    publicKey: wallet.publicKey,
    networkId: settings.network?.id ?? settings.networkId,
    networkLabel: settings.network?.label ?? null,
    permissions,
    chainId: settings.chainId,
    rpcUrl: settings.rpcUrl,
    mode: wallet.mode
  };
}

export async function disconnectOrigin(origin) {
  const connections = await getConnections();
  delete connections[origin];
  await setConnections(connections);
  return { disconnected: true };
}

export async function getProviderSnapshot(origin) {
  const wallet = await getWallet();
  const settings = await getSettings();
  const connections = await getConnections();
  return {
    wallet,
    settings,
    connection: connections[origin] ?? null
  };
}

export function hasOriginPermission(snapshot, method) {
  return Boolean(snapshot.connection?.permissions?.includes(method));
}
