import { getCryptoBackend, getCryptoBackendStatus } from "./crypto-backend.js";

export async function createWallet(password = "") {
  const backend = await getCryptoBackend();
  return backend.createWallet(password);
}

export async function importWalletFromMnemonic(mnemonic, password = "") {
  const backend = await getCryptoBackend();
  return backend.importWalletFromMnemonic(mnemonic, password);
}

export async function importWalletFromRecovery(walletFile, mnemonic, password = "") {
  const backend = await getCryptoBackend();
  return backend.importWalletFromRecovery(walletFile, mnemonic, password);
}

export async function createAccountFromMnemonic(mnemonic, password = "", accountIndex = 0) {
  const backend = await getCryptoBackend();
  return backend.createAccountFromMnemonic(mnemonic, password, accountIndex);
}

export async function signMessage(wallet, message) {
  const backend = await getCryptoBackend();
  return backend.signMessage(wallet, message);
}

export async function validateMnemonic(mnemonic) {
  const backend = await getCryptoBackend();
  return backend.validateMnemonic(mnemonic);
}

export { getCryptoBackend, getCryptoBackendStatus };
