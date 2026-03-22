/**
 * Wallet account model — domain logic for HD account management.
 * Shared between Accounts screen, NavHeader, and main.jsx.
 *
 * These functions operate on the wallet object stored in chrome.storage
 * and define how multi-account HD wallets are structured and synced.
 */

/**
 * Normalize a raw account source into a canonical AccountRecord.
 * Handles both old single-account wallets and new multi-account format.
 */
export function makeAccountRecord(source, fallbackIndex = 0, fallbackLabel = null) {
  const accountIndex = source?.accountIndex ?? source?.walletFile?.account_index ?? fallbackIndex;
  const label = source?.label ?? fallbackLabel ?? `Account ${accountIndex + 1}`;
  const id = source?.id ?? `account-${accountIndex}`;
  return {
    id,
    label,
    accountIndex,
    address: source?.address ?? "",
    publicKey: source?.publicKey ?? source?.public_key ?? "",
    secretKey: source?.secretKey ?? source?.secret_key ?? "",
    walletFile: source?.walletFile ?? source?.wallet_file ?? null,
  };
}

/**
 * Extract the accounts array from a wallet, normalizing legacy single-account format.
 */
export function getWalletAccounts(wallet) {
  if (Array.isArray(wallet?.accounts) && wallet.accounts.length > 0) {
    return wallet.accounts.map((account, index) =>
      makeAccountRecord(
        account,
        account?.accountIndex ?? account?.walletFile?.account_index ?? index,
        account?.label ?? `Account ${index + 1}`
      )
    );
  }
  if (!wallet?.address) return [];
  return [makeAccountRecord({ ...wallet, accountIndex: wallet.accountIndex ?? 0 }, 0, "Account 1")];
}

/**
 * Sync the wallet root fields (address, publicKey, secretKey, walletFile)
 * to match the currently active account. This ensures the wallet object
 * always has the active account's keys at the top level.
 */
export function syncWalletToActiveAccount(wallet) {
  const accounts = getWalletAccounts(wallet);
  if (!accounts.length) return wallet;
  const activeAccountId = wallet?.activeAccountId ?? accounts[0].id;
  const activeAccount = accounts.find((a) => a.id === activeAccountId) ?? accounts[0];
  return {
    ...wallet,
    address: activeAccount.address,
    publicKey: activeAccount.publicKey,
    secretKey: activeAccount.secretKey,
    walletFile: activeAccount.walletFile,
    accountIndex: activeAccount.accountIndex ?? 0,
    activeAccountId: activeAccount.id,
    accounts,
  };
}

/**
 * Get the display label for the currently active account.
 */
export function getActiveAccountLabel(wallet) {
  const accounts = wallet?.accounts ?? [];
  if (!accounts.length) return wallet?.label ?? "Account 1";
  const activeId = wallet?.activeAccountId ?? accounts[0]?.id;
  const active = accounts.find((a) => a.id === activeId) ?? accounts[0];
  return active?.label ?? `Account ${(active?.accountIndex ?? 0) + 1}`;
}
