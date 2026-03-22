# Dilithia Wallet Extension

Non-custodial browser wallet for the Dilithia blockchain with post-quantum signing (ML-DSA-65), shielded pool privacy, and an injected `window.dilithia` provider for dapps.

## Overview

| Feature | Details |
|---------|---------|
| **Signing** | ML-DSA-65 (FIPS 204) via Rust/WASM `dilithia-core` |
| **Wallet** | BIP-39 mnemonic, HD derivation, encrypted local storage |
| **Privacy** | Shielded pool with STARK proofs (deposit, withdraw, compliance) |
| **Provider** | `window.dilithia` with 26 methods |
| **Security** | Password lock, auto-lock timer, per-origin permissions, rate limiting |
| **UI** | Preact + Vite 8, Apple HIG-inspired, 100KB / 27KB gzip |
| **Browsers** | Chrome 116+, Firefox 109+ (fully compatible) |

## Dependencies

All crates from [crates.io](https://crates.io) with exact pinning (`=`):

| Crate | Version | Purpose |
|-------|---------|---------|
| [`dilithia-core`](https://crates.io/crates/dilithia-core) | 0.2.0 | ML-DSA-65 signing, HD wallets, address derivation |
| [`dilithia-stark`](https://crates.io/crates/dilithia-stark) | 0.2.0 | STARK proofs for shielded pool (preimage, range) |
| [`winter-math`](https://crates.io/crates/winter-math) | 0.13.1 | Finite field arithmetic for STARK proofs |

## Quick Start

```bash
# Build WASM backend
cd crypto-wasm && wasm-pack build --target web --out-dir pkg && cd ..

# Build popup
npm install && npm run build

# Load in Chrome: chrome://extensions → Developer mode → Load unpacked
```

## Repository Layout

```
manifest.json           Chrome MV3 manifest
vite.config.js          Vite 8 build config
src/
  background.js         Service worker: approvals, provider dispatch, session
  content-script.js     Bridge: page ↔ extension
  inpage.js             Injected window.dilithia provider
  popup/
    index.html          Vite entry point
    main.jsx            Preact app root + router
    screens/            One file per screen (Home, Send, Privacy, Settings, ...)
    components/         Shared UI (NavHeader, TabBar, Dialog, ApprovalSheet)
    hooks/              Data hooks (useSession, useWallet, useOverview, ...)
    lib/                Shared logic (format, wallet-model)
    styles/             CSS with design tokens
  lib/                  Shared modules (storage, RPC, crypto, i18n, errors)
  networks/             Bundled network registry
crypto-wasm/            Rust/WASM crypto backend
docs/                   Documentation (Architecture, Provider, Guides)
```

## Screens

| Screen | Description |
|--------|-------------|
| **Home** | Balance, Send/Receive/Swap tabs, token list, NFTs, activity |
| **Privacy** | Shielded pool deposit, withdraw, compliance proofs, notes |
| **Activity** | Transaction history with DiliScan links |
| **Accounts** | HD account derivation, rename, delete, switch |
| **Settings** | Network, Services (gas sponsor, oracle, swap), Security, Language |
| **Send** | 4-step flow: simulate → sign → submit → receipt polling |
| **Swap** | Token exchange with slippage, fees, price impact |
| **Recovery** | Mnemonic display, wallet file export |
| **Lock** | Password unlock, forgot → mnemonic recovery |

## Provider API

```javascript
// Connect
const session = await window.dilithia.request({ method: "dilithia_connect" });

// Sign message (offchain, no gas)
const sig = await window.dilithia.request({
  method: "dilithia_signMessage",
  params: { message: "login:nonce:abc123" }
});

// Send transaction (onchain, gas required)
const tx = await window.dilithia.request({
  method: "dilithia_sendTransaction",
  params: { transaction: { contract: "token", method: "transfer", args: { to, amount } } }
});
```

26 methods: connect, disconnect, accounts, chainId, switchChain, addChain, getNonce, getBalance, getNetworkInfo, getPublicKey, signMessage, signPayload, buildOwnershipProof, sendTransaction, callContract, queryContract, simulateCall, estimateGas, getReceipt, getTransactionHistory, shieldedDeposit, shieldedWithdraw, shieldedBalance, shieldedComplianceProof, requestPermissions, permissions.

## Browser Support

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome 116+ | Supported | Primary target |
| Firefox 109+ | Compatible | Fully compatible, no Chrome-only APIs |
| Edge | Untested | Chromium-based, should work |
| Brave | Untested | Chromium-based, should work |

## Documentation

- `docs/` — Full documentation with MkDocs Material
- `docs/ARCHITECTURE.md` — Layers, storage, crypto
- `docs/PROVIDER_SPEC.md` — Provider methods, permissions, events
- `docs/DEVELOPMENT.md` — Local workflow, testing
- `docs/ROADMAP.md` — Phases and priorities
- `docs/QSC_WALLET_PROTOCOL.md` — Mnemonic and HD wallet protocol
- `docs/HD_WALLET_ALIGNMENT.md` — Compatibility with dilithia-node
