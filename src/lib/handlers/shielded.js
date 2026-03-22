import { ProviderError } from "../errors.js";
import { requireOriginPermission, normalizeNumber } from "../validators.js";
import { enqueueApproval } from "../approvals.js";
import { getSettings } from "../storage.js";
import { getNextNonce, simulateCall, submitCall, shieldedCommitmentExists, shieldedNullifierSpent } from "../qsc-rpc.js";
import { appendShieldedNote, listShieldedNotes, updateShieldedNote } from "../shielded-state.js";
import { getCryptoBackend, signMessage } from "../wallet.js";

function buildCanonicalPayload(transaction) {
  const payload = {
    from: transaction.from,
    nonce: transaction.nonce,
    chain_id: transaction.chain_id,
    contract: transaction.contract,
    method: transaction.method,
    args: transaction.args,
  };
  if (typeof transaction.gas_limit === "number" && transaction.gas_limit > 0) {
    payload.gas_limit = transaction.gas_limit;
  }
  if (typeof transaction.gas_price === "number" && transaction.gas_price > 0) {
    payload.gas_price = transaction.gas_price;
  }
  if (typeof transaction.paymaster === "string" && transaction.paymaster.length > 0) {
    payload.paymaster = transaction.paymaster;
  }
  if (typeof transaction.version === "number" && transaction.version > 1) {
    payload.version = transaction.version;
  }
  return payload;
}

export async function handleShieldedBalance(ctx) {
  const { origin, method, wallet, snapshot } = ctx;
  requireOriginPermission(origin, snapshot, method);
  if (!wallet) {
    throw new ProviderError("WALLET_UNAVAILABLE", "No wallet configured.");
  }
  const notes = await listShieldedNotes(wallet.address);
  const liveNotes = [];
  for (const note of notes) {
    const spentInfo = await shieldedNullifierSpent(snapshot.settings.rpcUrl, note.nullifier).catch(() => ({ spent: false }));
    if (!spentInfo.spent && !note.spent) {
      liveNotes.push(note);
    }
  }
  return {
    commitments: liveNotes.map((note) => note.commitment),
    totalValue: liveNotes.reduce((total, note) => total + Number(note.amount ?? 0), 0),
  };
}

export async function handleShieldedDeposit(ctx) {
  const { origin, method, params, wallet, snapshot } = ctx;
  if (!wallet) {
    throw new ProviderError("WALLET_UNAVAILABLE", "No wallet configured.");
  }
  requireOriginPermission(origin, snapshot, method);
  const amount = normalizeNumber(params.amount, "amount");
  const backend = await getCryptoBackend();
  const noteDraft = await backend.createShieldedDeposit(amount);
  const settings = await getSettings();
  const nonce = (await getNextNonce(settings.rpcUrl, wallet.address)).next_nonce;
  const chainId = settings.chainId;
  const transaction = {
    contract: "shielded",
    method: "deposit_stark",
    args: {
      value: noteDraft.value,
      secret: noteDraft.secret,
      nonce: noteDraft.nonce,
      amount: noteDraft.amount,
    },
    nonce,
    chain_id: chainId,
    paymaster: typeof params.paymaster === "string" ? params.paymaster : undefined,
  };
  const canonicalPayload = buildCanonicalPayload({
    from: wallet.address,
    nonce,
    chain_id: chainId,
    contract: transaction.contract,
    method: transaction.method,
    args: transaction.args,
    paymaster: transaction.paymaster,
    version: 1,
  });
  const simulation = await simulateCall(settings.rpcUrl, {
    from: wallet.address,
    contract: transaction.contract,
    method: transaction.method,
    args: transaction.args,
  }).catch((error) => ({
    success: false,
    error: error instanceof Error ? error.message : String(error),
    gas_used: 0,
  }));
  return enqueueApproval({
    method,
    origin,
    summary: {
      kind: "shielded_deposit",
      amount,
      commitment: noteDraft.commitment,
      nonce,
      simulation,
    },
    execute: async () => {
      const signed = await signMessage(wallet, JSON.stringify(canonicalPayload));
      const submitted = await submitCall(settings.rpcUrl, {
        from: wallet.address,
        contract: transaction.contract,
        method: transaction.method,
        args: transaction.args,
        alg: signed.algorithm,
        pk: wallet.publicKey,
        sig: signed.signature,
        nonce,
        chain_id: chainId,
        version: 1,
        paymaster: transaction.paymaster,
      });
      await appendShieldedNote(wallet.address, {
        ...noteDraft,
        commitment: noteDraft.commitment.padStart(64, "0"),
        nullifier: null,
        spent: false,
        txHash: submitted.tx_hash ?? submitted.txHash ?? null,
        createdAt: new Date().toISOString(),
      });
      return {
        commitment: noteDraft.commitment.padStart(64, "0"),
        txHash: submitted.tx_hash ?? submitted.txHash ?? null,
      };
    },
  });
}

export async function handleShieldedWithdraw(ctx) {
  const { origin, method, params, wallet, snapshot } = ctx;
  if (!wallet) {
    throw new ProviderError("WALLET_UNAVAILABLE", "No wallet configured.");
  }
  requireOriginPermission(origin, snapshot, method);
  const commitmentIndex = normalizeNumber(params.commitmentIndex, "commitmentIndex");
  const amount = normalizeNumber(params.amount, "amount");
  const recipient =
    typeof params.recipient === "string" && params.recipient.length > 0 ? params.recipient : wallet.address;
  const notes = await listShieldedNotes(wallet.address);
  const note = notes[commitmentIndex];
  if (!note) {
    throw new ProviderError("INVALID_PARAMS", "Unknown shielded commitment index.");
  }
  if (note.spent) {
    throw new ProviderError("INVALID_PARAMS", "Shielded note already spent.");
  }
  const spentInfo =
    typeof note.nullifier === "string" && note.nullifier.length > 0
      ? await shieldedNullifierSpent(snapshot.settings.rpcUrl, note.nullifier).catch(() => ({ spent: false }))
      : { spent: false };
  if (spentInfo.spent) {
    throw new ProviderError("INVALID_PARAMS", "Shielded note already spent on-chain.");
  }
  const existsInfo = await shieldedCommitmentExists(snapshot.settings.rpcUrl, note.commitment).catch(() => ({ exists: true }));
  if (!existsInfo.exists) {
    throw new ProviderError("INVALID_PARAMS", "Shielded commitment not found on-chain.");
  }
  const backend = await getCryptoBackend();
  const proof = await backend.createShieldedWithdrawProof(note);
  const settings = await getSettings();
  const nonce = (await getNextNonce(settings.rpcUrl, wallet.address)).next_nonce;
  const chainId = settings.chainId;
  const transaction = {
    contract: "shielded",
    method: "withdraw_stark",
    args: {
      nullifier: proof.nullifier,
      amount,
      recipient,
      proof: proof.proof,
      commitment: proof.commitment,
    },
    nonce,
    chain_id: chainId,
    paymaster: typeof params.paymaster === "string" ? params.paymaster : undefined,
  };
  const canonicalPayload = buildCanonicalPayload({
    from: wallet.address,
    nonce,
    chain_id: chainId,
    contract: transaction.contract,
    method: transaction.method,
    args: transaction.args,
    paymaster: transaction.paymaster,
    version: 1,
  });
  const simulation = await simulateCall(settings.rpcUrl, {
    from: wallet.address,
    contract: transaction.contract,
    method: transaction.method,
    args: transaction.args,
  }).catch((error) => ({
    success: false,
    error: error instanceof Error ? error.message : String(error),
    gas_used: 0,
  }));
  return enqueueApproval({
    method,
    origin,
    summary: {
      kind: "shielded_withdraw",
      amount,
      recipient,
      commitment: note.commitment,
      nonce,
      simulation,
    },
    execute: async () => {
      const signed = await signMessage(wallet, JSON.stringify(canonicalPayload));
      const submitted = await submitCall(settings.rpcUrl, {
        from: wallet.address,
        contract: transaction.contract,
        method: transaction.method,
        args: transaction.args,
        alg: signed.algorithm,
        pk: wallet.publicKey,
        sig: signed.signature,
        nonce,
        chain_id: chainId,
        version: 1,
        paymaster: transaction.paymaster,
      });
      await updateShieldedNote(wallet.address, note.commitment, (entry) => ({
        ...entry,
        nullifier: proof.nullifier,
        spent: true,
        withdrawnAt: new Date().toISOString(),
        withdrawTxHash: submitted.tx_hash ?? submitted.txHash ?? null,
      }));
      return {
        nullifier: proof.nullifier,
        proof: proof.proof,
        txHash: submitted.tx_hash ?? submitted.txHash ?? null,
      };
    },
  });
}

export async function handleShieldedComplianceProof(ctx) {
  const { origin, method, params, wallet, snapshot } = ctx;
  if (!wallet) {
    throw new ProviderError("WALLET_UNAVAILABLE", "No wallet configured.");
  }
  requireOriginPermission(origin, snapshot, method);
  if (typeof params.proofType !== "string" || params.proofType.length === 0) {
    throw new ProviderError("INVALID_PARAMS", "Missing proofType.");
  }
  const backend = await getCryptoBackend();
  const notes = await listShieldedNotes(wallet.address);
  const liveNotes = notes.filter((note) => !note.spent);
  const proof = await backend.createShieldedComplianceProof(params.proofType, params, {
    totalValue: liveNotes.reduce((total, note) => total + Number(note.amount ?? 0), 0),
    noteCount: liveNotes.length,
  });
  return proof;
}
