import { ProviderError } from "../errors.js";
import { requireOriginPermission } from "../validators.js";
import { enqueueApproval, openExtensionPopup } from "../approvals.js";
import { buildOwnershipProofPayload, canonicalPayloadJson } from "../payloads.js";
import { signMessage } from "../wallet.js";

export async function handleSignMessage(ctx) {
  const { origin, method, params, wallet } = ctx;
  if (!wallet) {
    // No wallet yet — open popup so user can create/import one
    openExtensionPopup();
    throw new ProviderError("WALLET_UNAVAILABLE", "No wallet configured. Please set up your wallet first.");
  }
  // signMessage does NOT require prior connect — it serves as auth itself.
  // The approval popup is the user's consent. No permissions needed.
  if (!params.message || typeof params.message !== "string") {
    throw new ProviderError("INVALID_PARAMS", "Missing message string.");
  }
  return enqueueApproval({
    method,
    origin,
    summary: {
      kind: "sign",
      message: params.message,
      offchain: true,
    },
    execute: () => signMessage(wallet, params.message),
  });
}

export async function handleSignPayload(ctx) {
  const { origin, method, params, wallet, snapshot } = ctx;
  if (!wallet) {
    throw new ProviderError("WALLET_UNAVAILABLE", "No wallet configured.");
  }
  requireOriginPermission(origin, snapshot, method);
  if (!params.payload || typeof params.payload !== "object" || Array.isArray(params.payload)) {
    throw new ProviderError("INVALID_PARAMS", "Missing payload object.");
  }
  const payloadJson = canonicalPayloadJson(params.payload);
  return enqueueApproval({
    method,
    origin,
    summary: {
      kind: "sign_payload",
      message: payloadJson,
      payload: params.payload,
      offchain: true,
    },
    execute: async () => {
      const signed = await signMessage(wallet, payloadJson);
      return {
        ...signed,
        payload: params.payload,
        payload_json: payloadJson,
      };
    },
  });
}

export async function handleBuildOwnershipProof(ctx) {
  const { origin, method, params, wallet, snapshot } = ctx;
  if (!wallet) {
    throw new ProviderError("WALLET_UNAVAILABLE", "No wallet configured.");
  }
  requireOriginPermission(origin, snapshot, method);
  const challenge = typeof params.challenge === "string" && params.challenge.length > 0 ? params.challenge : null;
  if (!challenge) {
    throw new ProviderError("INVALID_PARAMS", "Missing challenge string.");
  }
  return buildOwnershipProofPayload({
    origin,
    chainId: snapshot.settings.chainId,
    address: wallet.address,
    publicKey: wallet.publicKey,
    challenge,
    statement:
      typeof params.statement === "string" && params.statement.length > 0
        ? params.statement
        : undefined,
    issuedAt:
      typeof params.issued_at === "string" && params.issued_at.length > 0
        ? params.issued_at
        : undefined,
    expiresAt:
      typeof params.expires_at === "string" && params.expires_at.length > 0
        ? params.expires_at
        : undefined,
  });
}
