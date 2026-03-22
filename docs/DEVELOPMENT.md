# Development Guide

## Local Workflow

### 1. Build the WASM package

```bash
cd crypto-wasm
wasm-pack build --target web --out-dir pkg
```

### 2. Reload the extension

1. Open `chrome://extensions`
2. Find `Dilithia Wallet`
3. Click `Reload`

### 3. Reopen the popup

The popup does not need a bundler. UI changes are loaded directly from the unpacked extension directory.

## UI Development

Main files:

- `src/popup/popup.html`
- `src/popup/popup.css`
- `src/popup/popup.js`

Guidelines:

- keep onboarding minimal
- keep overview quiet
- avoid technical copy in user-facing surfaces
- use icons when text is repetitive
- keep settings and networks as separate pages

## RPC Development

The popup currently expects:

- balance endpoint
- address summary endpoint
- address transactions endpoint
- nonce endpoint
- simulate endpoint
- call endpoint
- receipt endpoint

If the configured RPC is offline, the overview should show:

- a concise connection message
- collapsible technical detail

## Network Development

Bundled registry lives in:

- `src/networks/registry.json`

If you want to change local defaults:

- edit the bundled registry
- or configure a remote registry URL in the wallet

## DiliScan Integration

The wallet assumes DiliScan uses hash routing.

Expected explorer patterns:

- `#/address/{address}`
- `#/contract/{address}`
- `#/tx/{hash}`
- `#/block/{height}`

If DiliScan changes routing, wallet link builders must be updated in:

- `src/popup/popup.js`

## Tests

### Popup view-state test

```bash
node --test test/popup-view-state.test.mjs
```

### Browser SDK

The browser SDK is published separately as [`@dilithia/browser-sdk`](https://www.npmjs.com/package/@dilithia/browser-sdk). Install it in your dapp:

```bash
npm install @dilithia/browser-sdk
```

## Packaging Notes

This repo is meant to be loaded unpacked during development.

For publication later:

- build WASM
- make sure assets and icons are final
- review permissions in `manifest.json`
- create a clean zip from the extension root

## What Not To Do

- do not add fake signing fallbacks
- do not reintroduce noisy technical messages in overview
- do not put explorer-only concepts into onboarding
- do not diverge from `dilithia-core` wallet semantics in the extension layer
