(function injectDilithiaProvider() {
  "use strict";

  if (window.dilithia) {
    return;
  }

  const MAX_PENDING_REQUESTS = 64;
  const REQUEST_TIMEOUT_MS = 120_000;

  let nextRequestId = 1;
  const pending = new Map();
  const listeners = new Map();

  function emit(eventName, detail) {
    const handlers = listeners.get(eventName);
    if (!handlers) {
      return;
    }
    for (const handler of handlers) {
      try {
        handler(detail);
      } catch (error) {
        console.error("[dilithia] listener error:", error);
      }
    }
  }

  window.addEventListener("message", (event) => {
    if (event.source !== window || event.origin !== window.location.origin) {
      return;
    }
    if (event.data?.target !== "DILITHIA_PAGE") {
      return;
    }

    const entry = pending.get(event.data.requestId);
    if (!entry) {
      return;
    }

    clearTimeout(entry.timer);
    pending.delete(event.data.requestId);
    if (event.data.ok) {
      entry.resolve(event.data.result);
    } else {
      const error = new Error(event.data.error || "Unknown provider error");
      if (event.data.errorCode) {
        error.code = event.data.errorCode;
      }
      entry.reject(error);
    }
  });

  window.addEventListener("message", (event) => {
    if (event.source !== window || event.origin !== window.location.origin) {
      return;
    }
    if (event.data?.target !== "DILITHIA_PAGE_EVENT") {
      return;
    }
    if (typeof event.data.eventName !== "string") {
      return;
    }
    emit(event.data.eventName, event.data.detail ?? null);
  });

  const provider = Object.freeze({
    isDilithia: true,
    providerVersion: "0.2.0",
    supportedMethods: Object.freeze([
      "dilithia_connect",
      "dilithia_requestPermissions",
      "dilithia_permissions",
      "dilithia_accounts",
      "dilithia_chainId",
      "dilithia_switchChain",
      "dilithia_addChain",
      "dilithia_getNonce",
      "dilithia_getBalance",
      "dilithia_getNetworkInfo",
      "dilithia_getPublicKey",
      "dilithia_signMessage",
      "dilithia_signPayload",
      "dilithia_buildOwnershipProof",
      "dilithia_sendTransaction",
      "dilithia_simulateCall",
      "dilithia_estimateGas",
      "dilithia_getReceipt",
      "dilithia_callContract",
      "dilithia_queryContract",
      "dilithia_getTransactionHistory",
      "dilithia_shieldedDeposit",
      "dilithia_shieldedWithdraw",
      "dilithia_shieldedBalance",
      "dilithia_shieldedComplianceProof",
      "dilithia_disconnect"
    ]),
    on(eventName, handler) {
      if (typeof eventName !== "string" || typeof handler !== "function") {
        return () => {};
      }
      const handlers = listeners.get(eventName) ?? new Set();
      handlers.add(handler);
      listeners.set(eventName, handlers);
      return () => this.removeListener(eventName, handler);
    },
    removeListener(eventName, handler) {
      const handlers = listeners.get(eventName);
      if (!handlers) {
        return;
      }
      handlers.delete(handler);
      if (handlers.size === 0) {
        listeners.delete(eventName);
      }
    },
    async enable() {
      return this.request({ method: "dilithia_connect" });
    },
    async request({ method, params = {} }) {
      if (typeof method !== "string" || method.length === 0) {
        throw new Error("Invalid method");
      }
      if (pending.size >= MAX_PENDING_REQUESTS) {
        throw new Error("Too many pending requests");
      }
      return new Promise((resolve, reject) => {
        const requestId = nextRequestId++;
        const timer = setTimeout(() => {
          pending.delete(requestId);
          reject(new Error(`Request ${method} timed out`));
        }, REQUEST_TIMEOUT_MS);
        pending.set(requestId, { resolve, reject, timer });
        window.postMessage(
          {
            target: "DILITHIA_EXTENSION",
            requestId,
            method,
            params
          },
          window.location.origin
        );
      });
    }
  });

  Object.defineProperty(window, "dilithia", {
    value: provider,
    configurable: false,
    enumerable: true,
    writable: false
  });

  window.dispatchEvent(new Event("dilithia#initialized"));
})();
