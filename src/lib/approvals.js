import { ProviderError } from "./errors.js";

const MAX_PENDING_APPROVALS = 32;
const MAX_REQUESTS_PER_ORIGIN = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;

let nextApprovalId = 1;
const pendingApprovals = new Map();
const originRequestCounts = new Map();

export function checkRateLimit(origin) {
  const now = Date.now();
  let entry = originRequestCounts.get(origin);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    entry = { count: 0, windowStart: now };
    originRequestCounts.set(origin, entry);
  }
  entry.count++;
  if (entry.count > MAX_REQUESTS_PER_ORIGIN) {
    throw new ProviderError("INTERNAL_ERROR", "Rate limit exceeded. Try again later.");
  }
}

export function updateBadge() {
  const count = pendingApprovals.size;
  if (!chrome.action?.setBadgeText) return;
  chrome.action.setBadgeBackgroundColor({ color: "#8F3F1D" });
  chrome.action.setBadgeText({ text: count > 0 ? String(Math.min(count, 99)) : "" });
}

export function openExtensionPopup() {
  try {
    if (typeof chrome !== "undefined" && chrome.action?.openPopup) {
      chrome.action.openPopup().catch(() => {});
      return;
    }
    if (typeof browser !== "undefined" && browser.browserAction?.openPopup) {
      browser.browserAction.openPopup().catch(() => {});
      return;
    }
    if (typeof browser !== "undefined" && browser.action?.openPopup) {
      browser.action.openPopup().catch(() => {});
      return;
    }
  } catch {
    // Not supported
  }
}

export function enqueueApproval({ method, origin, summary, execute }) {
  if (pendingApprovals.size >= MAX_PENDING_APPROVALS) {
    throw new ProviderError("INTERNAL_ERROR", "Too many pending approvals. Please approve or reject existing requests first.");
  }
  const approvalId = nextApprovalId++;
  return new Promise((resolve, reject) => {
    pendingApprovals.set(approvalId, {
      approvalId, method, origin,
      createdAt: new Date().toISOString(),
      summary, execute, resolve, reject,
    });
    updateBadge();
    openExtensionPopup();
    if (chrome.notifications?.create) {
      chrome.notifications.create(`approval-${approvalId}`, {
        type: "basic",
        iconUrl: "src/assets/icon-128.png",
        title: "Dilithia Wallet",
        message: `${origin}: ${method.replace("dilithia_", "")} — tap to review`,
        priority: 2,
      }).catch(() => {});
    }
  });
}

export async function approvePending(approvalId) {
  const entry = pendingApprovals.get(approvalId);
  if (!entry) return { error: "Approval not found or already handled." };
  try {
    const result = await entry.execute();
    entry.resolve(result);
  } catch (error) {
    entry.reject(error);
  }
  pendingApprovals.delete(approvalId);
  updateBadge();
  return { ok: true };
}

export function rejectPending(approvalId) {
  const entry = pendingApprovals.get(approvalId);
  if (!entry) return { error: "Approval not found or already handled." };
  entry.reject(new ProviderError("USER_REJECTED", "User rejected the request."));
  pendingApprovals.delete(approvalId);
  updateBadge();
  return { ok: true };
}

export function listPendingApprovals() {
  return Array.from(pendingApprovals.values()).map((entry) => ({
    approvalId: entry.approvalId,
    method: entry.method,
    origin: entry.origin,
    createdAt: entry.createdAt,
    summary: entry.summary,
  }));
}

export function getPendingCount() {
  return pendingApprovals.size;
}
