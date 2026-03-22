import { getLockConfig, getConnections, verifyPassword } from "./storage.js";
import { disconnectOrigin } from "./provider-state.js";
import { isSessionLocked, unlockSession, lockSession } from "./session.js";
import { listPendingApprovals, approvePending, rejectPending } from "./approvals.js";

function errorMsg(error) {
  return error instanceof Error ? error.message : String(error);
}

const POPUP_HANDLERS = {
  DILITHIA_POPUP_GET_PENDING(message, sendResponse) {
    sendResponse({ ok: true, result: listPendingApprovals() });
    return false;
  },

  DILITHIA_POPUP_APPROVE(message, sendResponse) {
    approvePending(message.approvalId)
      .then((result) => sendResponse({ ok: true, result }))
      .catch((error) => sendResponse({ ok: false, error: errorMsg(error) }));
    return true;
  },

  DILITHIA_POPUP_REJECT(message, sendResponse) {
    rejectPending(message.approvalId, message.reason)
      .then((result) => sendResponse({ ok: true, result }))
      .catch((error) => sendResponse({ ok: false, error: errorMsg(error) }));
    return true;
  },

  DILITHIA_POPUP_UNLOCK(message, sendResponse) {
    (async () => {
      try {
        const lockConfig = await getLockConfig();
        if (!lockConfig?.passwordHash) {
          sendResponse({ ok: true, result: { unlocked: true } });
          return;
        }
        const valid = await verifyPassword(message.password ?? "", lockConfig.passwordHash);
        if (!valid) {
          sendResponse({ ok: false, error: "Incorrect password" });
          return;
        }
        unlockSession(lockConfig.autoLockMinutes ?? 15);
        sendResponse({ ok: true, result: { unlocked: true } });
      } catch (error) {
        sendResponse({ ok: false, error: errorMsg(error) });
      }
    })();
    return true;
  },

  DILITHIA_POPUP_LOCK(message, sendResponse) {
    lockSession();
    sendResponse({ ok: true, result: { locked: true } });
    return false;
  },

  DILITHIA_POPUP_IS_LOCKED(message, sendResponse) {
    (async () => {
      const lockConfig = await getLockConfig();
      const hasPassword = Boolean(lockConfig?.passwordHash);
      sendResponse({ ok: true, result: { locked: hasPassword && isSessionLocked(), hasPassword } });
    })();
    return true;
  },

  DILITHIA_POPUP_GET_CONNECTIONS(message, sendResponse) {
    getConnections()
      .then((result) => sendResponse({ ok: true, result }))
      .catch((error) => sendResponse({ ok: false, error: errorMsg(error) }));
    return true;
  },

  DILITHIA_POPUP_REVOKE_CONNECTION(message, sendResponse) {
    disconnectOrigin(message.origin)
      .then((result) => sendResponse({ ok: true, result }))
      .catch((error) => sendResponse({ ok: false, error: errorMsg(error) }));
    return true;
  },
};

export function handlePopupMessage(message, sendResponse) {
  const handler = POPUP_HANDLERS[message?.type];
  if (handler) return handler(message, sendResponse);
  return null;
}
