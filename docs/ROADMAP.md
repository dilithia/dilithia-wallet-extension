# Dilithia Wallet Roadmap

## Direction

The wallet should become the canonical non-custodial entry point for:

- DiliScan ownership verification
- explorer administration approvals
- future QSC dapps through `window.dilithia`

The roadmap intentionally prioritizes protocol stability and security UX before broad feature count.

## Current Baseline

- Manifest V3 Chrome extension (v0.2.0)
- injected `window.dilithia` with 26 provider methods
- popup and options UI
- real `dilithia-core` WASM crypto backend (ML-DSA-65)
- HD wallet derivation from BIP-39 mnemonic
- shielded pool with STARK proofs
- network registry discovery
- origin approval queue with per-method permissions
- transaction simulation through the node
- browser SDK for dapp integration
- no fallback signer

## Phase 1: Protocol Freeze — Done

- formal provider specification
- canonical payload formats
- origin permission model
- ownership proof payload for DiliScan
- stable method names and error semantics
- `requestPermissions` and per-origin permissions
- provider event bridge (accountsChanged, chainChanged, permissionsChanged, disconnect)
- connected-site revocation UI

## Phase 2: Wallet UX Hardening — In Progress

- dedicated approval screens by request type
- clearer signing previews for structured payloads
- site permission management
- export/import hardening
- lock/unlock flow

## Phase 3: Real Crypto Runtime — Done

- browser-safe `dilithia-core` WASM backend (`wasm32-unknown-unknown`)
- end-to-end real signing from popup and provider
- deterministic HD wallet derivation aligned with `qsc-rs`
- shielded pool operations (deposit, withdraw, compliance proofs)
- address handling for raw and checksummed forms

## Phase 4: DApp Ergonomics — Done

- browser SDK (`@dilithia/browser-sdk`)
- provider events (accountsChanged, chainChanged, permissionsChanged, disconnect)
- permission negotiation per origin
- transaction and simulation summaries

## Phase 5: Ecosystem Integration — Planned

- signed network registry
- DiliScan-first onboarding
- contract verification and submission flows
- example integration app
- end-to-end tests across wallet, DiliScan, and node

## Phase 6: Full Node Coverage — Planned

Features from `qsc-rs` not yet exposed in the wallet:

- staking / unstaking / claim rewards (via staking contract)
- governance proposals and voting (via governance contract)
- name service registration and resolution (via name_service contract)
- multisig wallet creation and management
- MEV protection (commit-reveal flow)
- token registry browsing and custom QRC-20 tokens
- cross-chain messaging
- permissions management (grant/revoke)
- key rotation

## Short-Term Priorities

1. Lock/unlock flow for wallet security
2. Staking UI (stake, unstake, claim rewards)
3. Name service integration (resolve .dili names)
4. Governance voting UI
5. Keep address validation compatible with both raw and checksummed QSC addresses
