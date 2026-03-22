import { PROVIDER_METHODS } from "./lib/constants.js";
import { ProviderError, asProviderError } from "./lib/errors.js";
import { getProviderSnapshot } from "./lib/provider-state.js";
import { getConnections, getLockConfig, getSettings, setConnections } from "./lib/storage.js";
import { isSessionLocked, hasActiveSession, lockSession, touchSession } from "./lib/session.js";
import { checkRateLimit, updateBadge, getPendingCount } from "./lib/approvals.js";
import { handlePopupMessage } from "./lib/popup-handlers.js";
import { getMethodHandler } from "./lib/provider-methods.js";

// ── MV3 service worker keepalive ────────────────────────────────────
chrome.alarms?.create?.("dilithia-keepalive", { periodInMinutes: 0.4 });
chrome.alarms?.onAlarm?.addListener?.((alarm) => {
  if (alarm.name === "dilithia-keepalive") {
    if (getPendingCount() > 0) updateBadge();
    if (hasActiveSession() && isSessionLocked()) lockSession();
  }
});

// ── Locked methods (require unlocked wallet) ────────────────────────
const LOCKED_METHODS = new Set([
  PROVIDER_METHODS.SIGN_MESSAGE,
  PROVIDER_METHODS.SIGN_PAYLOAD,
  PROVIDER_METHODS.BUILD_OWNERSHIP_PROOF,
  PROVIDER_METHODS.SEND_TRANSACTION,
  PROVIDER_METHODS.CALL_CONTRACT,
  PROVIDER_METHODS.SHIELDED_DEPOSIT,
  PROVIDER_METHODS.SHIELDED_WITHDRAW,
]);

// ── Message listener ────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "DILITHIA_PROVIDER_REQUEST") {
    handleProviderRequest(message, sender)
      .then((result) => sendResponse({ ok: true, result }))
      .catch((error) => {
        const providerError = asProviderError(error);
        sendResponse({ ok: false, error: providerError.message, errorCode: providerError.code });
      });
    return true;
  }

  const popupResult = handlePopupMessage(message, sendResponse);
  if (popupResult !== null) return popupResult;

  return false;
});

// ── Provider request dispatcher ─────────────────────────────────────
async function handleProviderRequest(message, sender) {
  const origin = message.origin ?? sender.origin ?? sender.url ?? "unknown";
  const method = message.method;
  const params = message.params ?? {};

  if (typeof method !== "string" || method.length === 0) {
    throw new ProviderError("INVALID_PARAMS", "Missing method.");
  }

  checkRateLimit(origin);
  touchSession();

  if (LOCKED_METHODS.has(method)) {
    const lockConfig = await getLockConfig();
    if (lockConfig?.passwordHash && isSessionLocked()) {
      throw new ProviderError("WALLET_UNAVAILABLE", "Wallet is locked. Unlock it first.");
    }
  }

  const handler = getMethodHandler(method);
  if (!handler) {
    throw new ProviderError("METHOD_NOT_FOUND", `Unknown method: ${method}`);
  }

  const snapshot = await getProviderSnapshot(origin);
  const wallet = snapshot.wallet;
  const settings = snapshot.settings;

  return handler({ origin, method, params, wallet, snapshot, settings });
}

// ── Connection revocation ───────────────────────────────────────────
async function revokeConnection(origin) {
  if (typeof origin !== "string" || origin.length === 0) {
    throw new Error("Missing origin.");
  }
  const connections = await getConnections();
  if (!connections[origin]) {
    return { revoked: false };
  }
  delete connections[origin];
  await setConnections(connections);
  await emitProviderEvent("accountsChanged", [], origin);
  await emitProviderEvent("permissionsChanged", { origin, permissions: [] }, origin);
  return { revoked: true };
}

// ── Provider events ─────────────────────────────────────────────────
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

// ── Storage change listeners ────────────────────────────────────────
chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName !== "local") return;

  if (changes["dilithia.settings"]) {
    const oldValue = changes["dilithia.settings"].oldValue ?? {};
    const newSettings = await getSettings();
    if ((oldValue.chainId ?? null) !== newSettings.chainId) {
      await emitProviderEvent("chainChanged", newSettings.chainId);
    }
  }

  if (changes["dilithia.wallet"]) {
    const connections = await getConnections();
    const accounts = changes["dilithia.wallet"].newValue ? [changes["dilithia.wallet"].newValue.address] : [];
    await Promise.all(
      Object.keys(connections).map((origin) => emitProviderEvent("accountsChanged", accounts, origin))
    );
  }

  if (changes["dilithia.connections"]) {
    const previous = changes["dilithia.connections"].oldValue ?? {};
    const next = changes["dilithia.connections"].newValue ?? {};
    const origins = new Set([...Object.keys(previous), ...Object.keys(next)]);
    await Promise.all(
      Array.from(origins).flatMap((origin) => {
        const oldPermissions = previous[origin]?.permissions ?? [];
        const newPermissions = next[origin]?.permissions ?? [];
        const events = [];
        if (JSON.stringify(oldPermissions) !== JSON.stringify(newPermissions)) {
          events.push(emitProviderEvent("permissionsChanged", { origin, permissions: newPermissions }, origin));
        }
        const oldAddress = previous[origin]?.address ?? null;
        const newAddress = next[origin]?.address ?? null;
        if (oldAddress !== newAddress) {
          events.push(emitProviderEvent("accountsChanged", newAddress ? [newAddress] : [], origin));
        }
        return events;
      })
    );
  }
});

chrome.runtime.onInstalled.addListener(() => { updateBadge(); });

chrome.notifications?.onClicked?.addListener?.((notificationId) => {
  if (notificationId.startsWith("approval-")) {
    chrome.notifications.clear(notificationId).catch(() => {});
  }
});
