# QSC Wallet Protocol Notes

This document captures the current wallet and mnemonic behavior found in `dilithia-node` so the Chrome extension stays protocol-compatible.

## Source of Truth

The current logic lives in the published `dilithia-core` crate, primarily in:

- `src/wallet.rs`
- `src/crypto.rs`
- `src/hash.rs`
- `src/bip39_english.txt`

## Current 24-Word Mnemonic Protocol

QSC currently uses a 24-word mnemonic with the BIP-39 English wordlist, but the full derivation is not standard BIP-39 wallet behavior.

What matches BIP-39:

- 2048-word English wordlist
- 256 bits of entropy
- 24 words
- 24 x 11-bit packing

What differs from standard BIP-39 implementations:

- The checksum byte is derived from `blake3(entropy)[0]`, not SHA-256
- Wallet encryption keys are derived with `blake3::derive_key`, not PBKDF2
- The mnemonic feeds the QSC deterministic HD wallet flow, not standard BIP-32/BIP-44 derivation

## Canonical Wallet Flow In `dilithia-node`

The canonical flow is now `create_hd_wallet_account()` / `recover_hd_account()` / `recover_hd_wallet_account()` from `dilithia-core`.

Behavior:

1. Generate 256-bit entropy
2. Encode a 24-word mnemonic from the BIP-39 English wordlist
3. Derive a deterministic seed with `seed_from_mnemonic()`
4. Derive a deterministic ML-DSA-65 keypair with `keygen_mldsa65_from_seed()`
5. Derive an encryption key from `"{mnemonic}:{password}"` with:
   - context: `qsc-wallet-encryption-key-v1`
6. Encrypt the secret key using a BLAKE3-CTR style keystream with a 16-byte nonce
7. Authenticate the ciphertext with a BLAKE3 keyed MAC using:
   - context: `qsc-wallet-mac-key-v1`
8. Store a wallet file with:
   - `version`
   - `address`
   - `public_key`
   - `encrypted_sk`
   - `nonce`
   - `tag`

This is the flow the extension should mirror for signing compatibility.

## Deterministic HD Flow In `dilithia-node`

`dilithia-node` exposes:

- `seed_from_mnemonic()`
- `keygen_mldsa65_from_seed()`
- `create_hd_wallet_account()`
- `recover_hd_account()`
- `recover_hd_wallet_account()`

This is now the intended wallet path and is exported by `dilithia-core` for both native and browser-WASM targets.

## Address Derivation

Addresses are derived through the `dilithia-core` hash policy exposed by:

- `address_from_pk(pk)`
- `validate_address(address)`

The extension should keep hex as the canonical address representation and avoid hardcoding an older address hash policy in the UI layer.

## Implications For The Extension

The extension uses the canonical wallet mode:

- deterministic ML-DSA-65 keypair derived from mnemonic
- 24-word mnemonic backup
- encrypted local storage for secret key via BLAKE3-CTR keystream
- signing-compatible with `dilithia-node`
- HD account derivation via indexed `create_hd_wallet_account` / `recover_hd_account`
- wallet file structure compatible with `WalletFile` from `dilithia-core`
