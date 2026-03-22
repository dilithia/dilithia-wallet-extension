# Dilithia Provider Specification

## Injected Object

The extension injects:

```js
window.dilithia
```

Exposed fields:

- `isDilithia: true`
- `providerVersion: string`
- `supportedMethods: string[]`
- `enable(): Promise<ConnectResult>`
- `request({ method, params? }): Promise<any>`
- `on(eventName, handler): () => void`
- `removeListener(eventName, handler): void`

## Core Methods

- `dilithia_connect`
- `dilithia_requestPermissions`
- `dilithia_permissions`
- `dilithia_accounts`
- `dilithia_chainId`
- `dilithia_switchChain`
- `dilithia_addChain`
- `dilithia_getNonce`
- `dilithia_getBalance`
- `dilithia_getNetworkInfo`
- `dilithia_getPublicKey`
- `dilithia_signMessage`
- `dilithia_signPayload`
- `dilithia_buildOwnershipProof`
- `dilithia_sendTransaction`
- `dilithia_simulateCall`
- `dilithia_estimateGas`
- `dilithia_getReceipt`
- `dilithia_callContract`
- `dilithia_queryContract`
- `dilithia_getTransactionHistory`
- `dilithia_shieldedDeposit`
- `dilithia_shieldedWithdraw`
- `dilithia_shieldedBalance`
- `dilithia_shieldedComplianceProof`
- `dilithia_disconnect`

## Permission Model

Permissions are stored per origin.

After approval, an origin receives an allowlist of methods. The default permission set includes:

- `dilithia_accounts`
- `dilithia_chainId`
- `dilithia_getBalance`
- `dilithia_getNetworkInfo`
- `dilithia_getNonce`
- `dilithia_getPublicKey`
- `dilithia_signMessage`
- `dilithia_signPayload`
- `dilithia_buildOwnershipProof`
- `dilithia_sendTransaction`
- `dilithia_simulateCall`
- `dilithia_estimateGas`
- `dilithia_getReceipt`
- `dilithia_callContract`
- `dilithia_queryContract`
- `dilithia_getTransactionHistory`
- `dilithia_shieldedDeposit`
- `dilithia_shieldedWithdraw`
- `dilithia_shieldedBalance`
- `dilithia_shieldedComplianceProof`

Methods not requiring permission (always available):

- `dilithia_connect`
- `dilithia_disconnect`
- `dilithia_switchChain`
- `dilithia_addChain`
- `dilithia_requestPermissions`
- `dilithia_permissions`

Sensitive methods must fail if:

- the origin is not connected
- the origin has not been granted the specific method

The wallet UI also allows revocation per origin, which removes the stored connection and permissions.

## Connect Result

`dilithia_connect` returns:

```json
{
  "address": "hex",
  "publicKey": "hex",
  "networkId": "dili-devnet",
  "networkLabel": "Dilithia Devnet",
  "permissions": ["dilithia_signPayload"],
  "chainId": "dili-devnet-local",
  "rpcUrl": "http://127.0.0.1:8000/rpc",
  "mode": "dilithia-core-wasm"
}
```

## Provider Events

The provider now emits:

- `accountsChanged`
- `chainChanged`
- `permissionsChanged`
- `disconnect`

Events are bridged from the extension runtime to the in-page provider.

## Error Codes

Provider rejections should carry a stable `code` alongside the human-readable message.

Current codes:

- `WALLET_UNAVAILABLE`
- `INVALID_PARAMS`
- `METHOD_NOT_SUPPORTED`
- `ORIGIN_NOT_CONNECTED`
- `PERMISSION_DENIED`
- `INTERNAL_ERROR`

## Canonical Payloads

Structured payloads are signed as canonical JSON with object keys sorted recursively.

This keeps signatures deterministic across:

- wallet
- DiliScan
- future SDKs

## Ownership Proof Payload

`dilithia_buildOwnershipProof` returns a payload with this shape:

```json
{
  "address": "hex",
  "chain_id": "dili-devnet-local",
  "challenge": "string",
  "expires_at": null,
  "issued_at": "2026-03-12T00:00:00Z",
  "kind": "diliscan.ownership_proof",
  "origin": "http://127.0.0.1:4173",
  "public_key": "hex",
  "statement": "DiliScan ownership verification",
  "version": 1
}
```

The wallet signs the canonical JSON form of that payload through `dilithia_signPayload`.

## Message Signing

`dilithia_signMessage` is for raw text payloads.

It should be treated as simple text signing. New integrations should prefer:

1. build a structured payload
2. canonicalize it
3. sign it with `dilithia_signPayload`

## Transaction Flow

Recommended flow:

1. dapp prepares transaction
2. wallet fetches nonce if needed
3. wallet simulates against the node
4. user approves
5. wallet signs
6. wallet submits signed call to the node

Simulation belongs to the node, not to the extension runtime.
