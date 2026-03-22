import { ProviderError } from "./errors.js";

export function normalizeNumber(value, fieldName) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new ProviderError("INVALID_PARAMS", `${fieldName} must be a non-negative number.`);
  }
  return number;
}

export function requireOriginPermission(origin, snapshot, method) {
  if (!snapshot.connection) {
    throw new ProviderError("ORIGIN_NOT_CONNECTED", `Origin ${origin} is not connected to Dilithia Wallet.`);
  }
  if (!snapshot.connection.permissions?.includes(method)) {
    throw new ProviderError("PERMISSION_DENIED", `Origin ${origin} is not allowed to call ${method}. Request permissions first.`);
  }
}

export function requireWallet(wallet) {
  if (!wallet) {
    throw new ProviderError("WALLET_UNAVAILABLE", "No wallet configured.");
  }
  return wallet;
}

export function requireString(params, field) {
  const value = params?.[field];
  if (typeof value !== "string" || value.length === 0) {
    throw new ProviderError("INVALID_PARAMS", `Missing ${field}.`);
  }
  return value;
}

export function requireObject(params, field) {
  const value = params?.[field];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ProviderError("INVALID_PARAMS", `Missing ${field} payload.`);
  }
  return value;
}

export function getTargetAddress(params, wallet) {
  if (typeof params?.address === "string" && params.address.length > 0) {
    return params.address;
  }
  if (wallet?.address) {
    return wallet.address;
  }
  throw new ProviderError("INVALID_PARAMS", "No address available.");
}
