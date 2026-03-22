# Dilithia Wallet Extension

Non-custodial browser wallet for the Dilithia blockchain with post-quantum signing.

!!! abstract "v0.2.0"
    Preact popup, password lock/unlock, HD accounts, shielded pool, approval sheets,
    12 language stubs, Vite 8 build, Chrome MV3 hardened.

## Overview

| Feature | Details |
|---------|---------|
| **Signing** | ML-DSA-65 (FIPS 204) via `dilithia-core` WASM |
| **Wallet** | BIP-39 mnemonic, HD derivation, encrypted storage |
| **Privacy** | Shielded pool with STARK proofs (deposit, withdraw, compliance) |
| **Provider** | `window.dilithia` with 26 methods for dapps |
| **Security** | Password lock, auto-lock timer, per-origin permissions, CSP |
| **Build** | Preact + Vite 8, 100KB JS (27KB gzip) |

## Dependencies

All crates consumed from [crates.io](https://crates.io) with exact pinning:

| Crate | Version | Purpose |
|-------|---------|---------|
| [`dilithia-core`](https://crates.io/crates/dilithia-core) | 0.2.0 | ML-DSA-65 signing, HD wallets, address derivation |
| [`dilithia-stark`](https://crates.io/crates/dilithia-stark) | 0.2.0 | STARK proofs for shielded pool |
| [`winter-math`](https://crates.io/crates/winter-math) | 0.13.1 | Finite field arithmetic |

## Quick Start

```bash
# 1. Build WASM backend
cd crypto-wasm && wasm-pack build --target web --out-dir pkg

# 2. Build popup
npm install && npm run build

# 3. Load in Chrome
# chrome://extensions → Developer mode → Load unpacked → select repo root
```

## Browser Support

| Browser | Status | Notes |
|---------|--------|-------|
| **Chrome** | Supported | MV3, minimum Chrome 116 |
| **Firefox** | Compatible | MV3 since Firefox 109, fully compatible |
| **Edge** | Untested | Should work (Chromium-based) |
| **Brave** | Untested | Should work (Chromium-based) |

!!! info "Firefox"
    Fully compatible. No Chrome-only APIs used.
    See [Browser Compatibility](guides/browser-compat.md).

## Provider API

Injected as `window.dilithia` on every page:

```javascript
const session = await window.dilithia.request({ method: "dilithia_connect" });
console.log(session.address, session.chainId);

// Sign a message (offchain, no gas)
const sig = await window.dilithia.request({
  method: "dilithia_signMessage",
  params: { message: "login:nonce:abc123" }
});
```

See [Provider Specification](provider/spec.md) for all 26 methods.

## Documentation

- [Getting Started](getting-started.md) — Install, build, load
- [Architecture](architecture.md) — Layers, storage, crypto
- [Provider API](provider/spec.md) — Methods, permissions, events
- [Lock & Security](guides/lock-security.md) — Password, auto-lock, logout
- [HD Wallet](guides/hd-wallet.md) — Account derivation from mnemonic
- [Browser Compatibility](guides/browser-compat.md) — Firefox, Edge support
