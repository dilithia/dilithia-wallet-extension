# Architecture

## Overview

Dilithia Wallet is a Chrome Extension MV3 application with four main layers:

1. popup UI
2. background runtime
3. injected provider bridge
4. Rust/WASM crypto backend

The extension is designed so that:

- wallet state is local
- signing is local
- blockchain reads and execution go through RPC
- explorer navigation is externalized to DiliScan

## Component Model

### Popup

The popup is the main end-user interface.

Current popup pages:

- onboarding
- home / overview
- accounts
- settings
- networks
- recovery
- send
- receive
- shielded (deposit, withdraw, compliance proof)

Main files:

- `src/popup/popup.html`
- `src/popup/popup.css`
- `src/popup/popup.js`

The popup is page-driven by a view state rather than route URLs.

## Background Runtime

The background script owns:

- approval queue
- provider request dispatch
- connection state
- provider event broadcasts

Main file:

- `src/background.js`

This is the authority for:

- pending connection approvals
- message signing approvals
- transaction approvals
- per-origin permissions

## In-Page Provider

The extension injects a provider into the page:

- `window.dilithia`

Files:

- `src/inpage.js`
- `src/content-script.js`

Responsibilities:

- expose provider API to websites
- relay requests to the extension runtime
- surface provider events back to the page

## Storage Model

Persisted state is kept in extension storage.

Main file:

- `src/lib/storage.js`

Stored categories include:

- wallet (address, keys, wallet file)
- wallet recovery metadata (mnemonic, acknowledged flag)
- settings (network, RPC, locale)
- connected origins (per-origin permissions)
- custom chains (user-added networks)
- shielded state (notes indexed by address)

The storage layer should be treated as product state, not as a protocol source of truth.

## RPC Layer

The wallet uses the node RPC for:

- balance
- address summary
- recent address transactions
- nonce
- simulate
- call
- receipt

Main file:

- `src/lib/qsc-rpc.js`

The popup does not execute protocol logic locally beyond signing and local wallet state management.

## Crypto Layer

The browser crypto backend is a Rust/WASM wrapper over `dilithia-core`.

Main files:

- `crypto-wasm/src/lib.rs`
- `crypto-wasm/Cargo.toml`

Responsibilities:

- create wallet from recovery phrase flow
- import wallet from recovery phrase
- recover wallet file
- HD account derivation (indexed accounts)
- sign messages and verify signatures
- validate addresses and public keys
- shielded pool: Poseidon commitments, STARK preimage proofs, range proofs

This layer should stay thin and protocol-faithful.

## Network Registry

Network resolution uses:

- configured remote registry URL if present
- bundled registry fallback

Main files:

- `src/lib/network-registry.js`
- `src/networks/registry.json`
- `src/networks/bundled-registry.js`

This keeps the extension usable even when a local registry service is offline.

## Explorer Integration

Explorer links are built in the popup layer and should target DiliScan hash routes:

- `#/address/...`
- `#/contract/...`
- `#/tx/...`
- `#/block/...`

This avoids requiring server-side SPA fallback routes in the explorer backend.

## Design Principles

- wallet first
- recovery phrase first
- explorer links are contextual, not noisy
- no fake signer fallback
- no hidden server dependency for core wallet creation
- minimal UI by default, technical detail behind disclosure
