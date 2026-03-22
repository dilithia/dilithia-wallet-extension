import { ProviderError } from "../errors.js";
import { requireOriginPermission } from "../validators.js";
import { getSettings } from "../storage.js";
import { getNextNonce, getBalance, getNetworkInfo, getReceipt, getAddressTxs } from "../qsc-rpc.js";

export async function handleGetNonce(ctx) {
  const { params, wallet } = ctx;
  const settings = await getSettings();
  const targetAddress =
    typeof params.address === "string" && params.address.length > 0 ? params.address : wallet?.address;
  if (!targetAddress) {
    throw new ProviderError("INVALID_PARAMS", "No address available for nonce lookup.");
  }
  return getNextNonce(settings.rpcUrl, targetAddress);
}

export async function handleGetBalance(ctx) {
  const { origin, method, params, wallet, snapshot } = ctx;
  requireOriginPermission(origin, snapshot, method);
  const targetAddress =
    typeof params.address === "string" && params.address.length > 0 ? params.address : wallet?.address;
  if (!targetAddress) {
    throw new ProviderError("INVALID_PARAMS", "No address available for balance lookup.");
  }
  return getBalance(snapshot.settings.rpcUrl, targetAddress);
}

export async function handleGetPublicKey(ctx) {
  const { origin, method, wallet, snapshot } = ctx;
  if (!wallet) {
    throw new ProviderError("WALLET_UNAVAILABLE", "No wallet configured.");
  }
  requireOriginPermission(origin, snapshot, method);
  return wallet.publicKey;
}

export async function handleGetNetworkInfo(ctx) {
  const { origin, method, snapshot } = ctx;
  requireOriginPermission(origin, snapshot, method);
  return getNetworkInfo(snapshot.settings.rpcUrl, snapshot.settings);
}

export async function handleGetReceipt(ctx) {
  const { origin, method, params, snapshot } = ctx;
  requireOriginPermission(origin, snapshot, method);
  if (typeof params.txHash !== "string" || params.txHash.length === 0) {
    throw new ProviderError("INVALID_PARAMS", "Missing txHash.");
  }
  return getReceipt(snapshot.settings.rpcUrl, params.txHash);
}

export async function handleGetTransactionHistory(ctx) {
  const { origin, method, params, wallet, snapshot } = ctx;
  requireOriginPermission(origin, snapshot, method);
  const targetAddress =
    typeof params.address === "string" && params.address.length > 0 ? params.address : wallet?.address;
  if (!targetAddress) {
    throw new ProviderError("INVALID_PARAMS", "No address available for transaction history.");
  }
  return getAddressTxs(snapshot.settings.rpcUrl, targetAddress);
}
