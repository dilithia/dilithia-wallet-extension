import { truncateAddress } from "../lib/format.js";
import { getActiveAccountLabel } from "../lib/wallet-model.js";

// ── SVG Icons ────────────────────────────────────────────────────────

const BackIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

const ChevronDown = () => (
  <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 6l4 4 4-4" />
  </svg>
);

// ── Components ───────────────────────────────────────────────────────

/**
 * Standard inner-screen header with back button.
 */
export function NavHeader({ title, onBack, right }) {
  return (
    <div class="header">
      {onBack ? (
        <button class="header-back" onClick={onBack} aria-label="Back"><BackIcon /></button>
      ) : (
        <div class="header-spacer" />
      )}
      <h1 class="header-title">{title}</h1>
      {right ?? <div class="header-spacer" />}
    </div>
  );
}

/**
 * Home header with account switcher pill + settings gear.
 * Shows: [Account Label · dili1abc...def ▾]  [⚙]
 * Tapping the pill opens Accounts, gear opens Settings.
 */
export function HomeHeader({ wallet, onAccounts, onSettings }) {
  const label = getActiveAccountLabel(wallet);
  const address = wallet?.address ?? "";

  return (
    <div class="header">
      <button class="account-pill" onClick={onAccounts} aria-label="Switch account">
        {label}
      </button>
      <div style={{ flex: 1 }} />
      <button class="header-action" onClick={onSettings} aria-label="Settings">
        <SettingsIcon />
      </button>
    </div>
  );
}
