const WASM_MODULE_PATH = "crypto-wasm/pkg/dilithia_wallet_crypto_wasm.js";
const WASM_BINARY_PATH = "crypto-wasm/pkg/dilithia_wallet_crypto_wasm_bg.wasm";
let backendPromise;
let backendLoadError = null;

function formatBackendError(error) {
  if (error instanceof Error) {
    return error.stack ? `${error.message}\n\n${error.stack}` : error.message;
  }
  return String(error);
}

function toHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function digestHex(algorithm, value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest(algorithm, bytes);
  return toHex(new Uint8Array(digest));
}

async function loadWasmBackend() {
  const moduleUrl = chrome.runtime.getURL(WASM_MODULE_PATH);
  const wasmUrl = chrome.runtime.getURL(WASM_BINARY_PATH);
  const wasmModule = await import(moduleUrl);

  if (typeof wasmModule.default === "function") {
    const response = await fetch(wasmUrl, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load wallet WASM: ${response.status}`);
    }
    const bytes = await response.arrayBuffer();
    await wasmModule.default({ module_or_path: bytes });
  }

  return {
    id: "dilithia-core-wasm",
    available: true,
    async createWallet(password = "") {
      const generated = await wasmModule.create_wallet_file(password);
      return {
        version: 2,
        mode: "dilithia-core-wasm",
        algorithm: "mldsa65",
        address: generated.address,
        publicKey: generated.public_key,
        secretKey: generated.secret_key,
        walletFile: generated.wallet_file,
        recovery: {
          mnemonic: generated.mnemonic,
          passwordProtected: password.length > 0,
          createdAt: new Date().toISOString(),
          acknowledged: false
        },
        accountIndex: generated.account_index ?? 0
      };
    },
    async importWalletFromRecovery(walletFile, mnemonic, password = "") {
      const recoverFn =
        walletFile?.account_index !== undefined && walletFile?.account_index !== null
          ? wasmModule.recover_hd_wallet_file
          : wasmModule.recover_wallet_file;
      const recovered = await recoverFn(walletFile, mnemonic, password);
      return {
        version: 2,
        mode: "dilithia-core-wasm",
        algorithm: "mldsa65",
        address: recovered.address,
        publicKey: recovered.public_key,
        secretKey: recovered.secret_key,
        walletFile: recovered.wallet_file,
        recovery: {
          mnemonic: mnemonic.trim().toLowerCase(),
          passwordProtected: password.length > 0,
          createdAt: new Date().toISOString(),
          acknowledged: true
        },
        accountIndex: recovered.wallet_file?.account_index ?? 0
      };
    },
    async importWalletFromMnemonic(mnemonic, password = "") {
      const normalizedMnemonic = mnemonic.trim().toLowerCase();
      await wasmModule.validate_mnemonic(normalizedMnemonic);
      const created = await wasmModule.create_hd_wallet_file_from_mnemonic(
        normalizedMnemonic,
        password
      );
      return {
        version: 2,
        mode: "dilithia-core-wasm",
        algorithm: "mldsa65",
        address: created.address,
        publicKey: created.public_key,
        secretKey: created.secret_key,
        walletFile: created.wallet_file,
        recovery: {
          mnemonic: created.mnemonic,
          passwordProtected: password.length > 0,
          createdAt: new Date().toISOString(),
          acknowledged: true
        },
        accountIndex: created.account_index ?? created.wallet_file?.account_index ?? 0
      };
    },
    async createAccountFromMnemonic(mnemonic, password = "", accountIndex = 0) {
      const normalizedMnemonic = mnemonic.trim().toLowerCase();
      await wasmModule.validate_mnemonic(normalizedMnemonic);
      const created = await wasmModule.create_hd_wallet_account_from_mnemonic(
        normalizedMnemonic,
        password,
        accountIndex
      );
      return {
        version: 2,
        mode: "dilithia-core-wasm",
        algorithm: "mldsa65",
        address: created.address,
        publicKey: created.public_key,
        secretKey: created.secret_key,
        walletFile: created.wallet_file,
        recovery: {
          mnemonic: created.mnemonic,
          passwordProtected: password.length > 0,
          createdAt: new Date().toISOString(),
          acknowledged: true
        },
        accountIndex: created.account_index ?? accountIndex
      };
    },
    async validateMnemonic(mnemonic) {
      await wasmModule.validate_mnemonic(mnemonic);
      return true;
    },
    async signMessage(wallet, message) {
      const signature = await wasmModule.sign_message(wallet.secretKey, message);
      return {
        algorithm: signature.algorithm,
        address: wallet.address,
        publicKey: wallet.publicKey,
        message,
        signature: signature.signature
      };
    },
    async createShieldedDeposit(amount) {
      const secretBytes = crypto.getRandomValues(new Uint32Array(1));
      const nonceBytes = crypto.getRandomValues(new Uint32Array(1));
      const value = Number(amount);
      const secret = Number(secretBytes[0]);
      const nonce = Number(nonceBytes[0]);
      const commitment = await wasmModule.shielded_commitment(value, secret, nonce);
      return {
        value,
        amount: value,
        secret,
        nonce,
        commitment,
      };
    },
    async createShieldedWithdrawProof(note) {
      const proof = await wasmModule.shielded_preimage_proof(note.value, note.secret, note.nonce);
      const nullifier = await digestHex("SHA-256", `${note.secret}:${note.nonce}:${note.commitment}`);
      return {
        proof: proof.proof,
        commitment: proof.commitment,
        nullifier,
      };
    },
    async createShieldedComplianceProof(proofType, params = {}, state = {}) {
      if (proofType !== "balance_range") {
        throw new Error(`Unsupported shielded compliance proof type: ${proofType}`);
      }
      const min = Number(params.min ?? 0);
      const max = Number(params.max ?? 0);
      const value = Number(params.value ?? state.totalValue ?? 0);
      if (!Number.isFinite(min) || !Number.isFinite(max) || !Number.isFinite(value)) {
        throw new Error("Invalid balance range parameters.");
      }
      const proof = await wasmModule.shielded_range_proof(value, min, max);
      return {
        proof: proof.proof,
        publicInputs: JSON.stringify({
          proof_type: "balance_range",
          value,
          min: proof.min,
          max: proof.max,
        }),
      };
    }
  };
}

export async function getCryptoBackend() {
  if (!backendPromise) {
    backendPromise = loadWasmBackend().catch((error) => {
      backendLoadError = error;
      throw new Error(
        `Real dilithia-core WASM backend unavailable.\n\n${formatBackendError(error)}`
      );
    });
  }
  return backendPromise;
}

export async function getCryptoBackendStatus() {
  try {
    const backend = await getCryptoBackend();
    return {
      id: backend.id,
      isRealCrypto: backend.id === "dilithia-core-wasm",
      available: true,
      loadError: null
    };
  } catch (error) {
    return {
      id: "unavailable",
      isRealCrypto: false,
      available: false,
      loadError: formatBackendError(error ?? backendLoadError ?? "Unknown error")
    };
  }
}
