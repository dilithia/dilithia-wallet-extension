# HD Wallet Alignment With qsc-rs

## Why this matters

`qsc-rs` has moved the wallet model forward. The canonical path is now:

1. generate or import a 24-word mnemonic
2. derive a deterministic 32-byte seed with `seed_from_mnemonic()`
3. derive a genuine ML-DSA-65 keypair with `keygen_mldsa65_from_seed()`
4. use `create_hd_wallet_account()` / `recover_hd_account()` semantics

This makes the mnemonic a real recovery primitive instead of a cosmetic backup phrase.

## Current status in the extension

`crypto-wasm` now wraps `dilithia-core` directly and follows the same mnemonic-first HD flow as `qsc-rs`.

## Required migration

The extension crypto backend is now centered around these operations:

1. `generate_mnemonic`
2. `validate_mnemonic`
3. `seed_from_mnemonic`
4. `keygen_mldsa65_from_seed`
5. `create_hd_wallet_account_from_mnemonic`
6. `recover_hd_account`

## Address compatibility

The extension must stop assuming only one address length.

The node surface now implies support for:

- `64` raw hex
- `72` checksummed hex (`64 + 8`)
- `128` raw hex
- `136` checksummed hex (`128 + 8`)

The raw length depends on the active hash algorithm in `qsc-rs`.

## Consequences for the provider

The public provider API does not need to change.

`window.dilithia` can keep returning:

- `address`
- `publicKey`
- `signature`
- `algorithm`

But the wallet internals must change so that:

- mnemonic recovery is deterministic and protocol-faithful
- address validation accepts raw and checksummed forms
- sign/recover flows match `qsc-rs`

## Consequences for DiliScan and dapps

- DiliScan should accept both raw and checksummed address lengths.
- Dapps should treat the address as opaque hex, not assume one fixed width.
- Ownership/auth flows should be built on public key + signature, not on UI formatting assumptions.
