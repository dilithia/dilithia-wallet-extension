"use strict";

const script = document.createElement("script");
script.src = chrome.runtime.getURL("src/inpage.js");
script.async = false;
(document.head || document.documentElement).appendChild(script);
script.remove();

const ALLOWED_EVENTS = new Set([
  "accountsChanged",
  "chainChanged",
  "permissionsChanged",
  "disconnect",
]);

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type !== "DILITHIA_PROVIDER_EVENT") {
    return false;
  }
  if (message.targetOrigin && message.targetOrigin !== window.location.origin) {
    return false;
  }
  if (!ALLOWED_EVENTS.has(message.eventName)) {
    return false;
  }

  window.postMessage(
    {
      target: "DILITHIA_PAGE_EVENT",
      eventName: message.eventName,
      detail: message.detail ?? null
    },
    window.location.origin
  );
  return false;
});

window.addEventListener("message", async (event) => {
  if (event.source !== window || event.origin !== window.location.origin) {
    return;
  }
  if (event.data?.target !== "DILITHIA_EXTENSION") {
    return;
  }

  const { requestId, method, params } = event.data;

  if (typeof method !== "string" || method.length === 0 || typeof requestId !== "number") {
    return;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: "DILITHIA_PROVIDER_REQUEST",
      origin: window.location.origin,
      method,
      params
    });

    window.postMessage(
      {
        target: "DILITHIA_PAGE",
        requestId,
        ok: response?.ok ?? false,
        result: response?.result,
        error: response?.error,
        errorCode: response?.errorCode
      },
      window.location.origin
    );
  } catch (error) {
    window.postMessage(
      {
        target: "DILITHIA_PAGE",
        requestId,
        ok: false,
        error: error instanceof Error ? error.message : String(error)
      },
      window.location.origin
    );
  }
});
