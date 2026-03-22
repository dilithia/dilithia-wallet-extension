import { PROVIDER_METHODS } from "../constants.js";
import { ProviderError } from "../errors.js";
import { requireOriginPermission } from "../validators.js";
import { enqueueApproval } from "../approvals.js";
import { getSettings } from "../storage.js";
import { getNextNonce, queryContract, simulateCall, estimateGas, submitCall } from "../qsc-rpc.js";
import { signMessage } from "../wallet.js";

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

function classifyTransactionKind(contract, method) {
  if (typeof method === "string" && method.toLowerCase() === "approve") {
    return "approval";
  }
  if (typeof contract === "string" && contract.length > 0) {
    return "contract_call";
  }
  return "transaction";
}

function buildTransactionPayloadFromParams(params) {
  if (!params || typeof params !== "object") {
    throw new ProviderError("INVALID_PARAMS", "Missing transaction payload.");
  }

  if (params.transaction && typeof params.transaction === "object") {
    return {
      ...params.transaction,
      paymaster:
        typeof params.paymaster === "string" && params.paymaster.length > 0
          ? params.paymaster
          : params.transaction.paymaster,
    };
  }

  const { contract, method, args = {}, paymaster, ...rest } = params;
  if (typeof contract !== "string" || contract.length === 0) {
    throw new ProviderError("INVALID_PARAMS", "Missing contract.");
  }
  if (typeof method !== "string" || method.length === 0) {
    throw new ProviderError("INVALID_PARAMS", "Missing method.");
  }

  return {
    contract,
    method,
    args,
    ...(typeof paymaster === "string" && paymaster.length > 0 ? { paymaster } : {}),
    ...rest,
  };
}

export async function handleSendTransaction(ctx) {
  const { origin, method, params, wallet, snapshot } = ctx;
  if (!wallet) {
    throw new ProviderError("WALLET_UNAVAILABLE", "No wallet configured.");
  }
  requireOriginPermission(origin, snapshot, method);
  if (!params.transaction || typeof params.transaction !== "object") {
    throw new ProviderError("INVALID_PARAMS", "Missing transaction payload.");
  }

  const settings = await getSettings();
  const transaction = params.transaction;
  const nonce =
    typeof transaction.nonce === "number"
      ? transaction.nonce
      : (await getNextNonce(settings.rpcUrl, wallet.address)).next_nonce;
  const chainId = transaction.chain_id ?? settings.chainId;
  const gasLimit = typeof transaction.gas_limit === "number" ? transaction.gas_limit : undefined;
  const gasPrice = typeof transaction.gas_price === "number" ? transaction.gas_price : undefined;
  const paymaster = typeof transaction.paymaster === "string" ? transaction.paymaster : undefined;

  const canonicalPayload = buildCanonicalPayload({
    from: wallet.address,
    nonce,
    chain_id: chainId,
    contract: transaction.contract,
    method: transaction.method,
    args: transaction.args ?? {},
    gas_limit: gasLimit,
    gas_price: gasPrice,
    paymaster,
    version: typeof transaction.version === "number" ? transaction.version : 1,
  });

  const simulation = await simulateCall(settings.rpcUrl, {
    from: wallet.address,
    contract: transaction.contract,
    method: transaction.method,
    args: transaction.args ?? {},
  }).catch((error) => ({
    success: false,
    error: error instanceof Error ? error.message : String(error),
    gas_used: 0,
  }));

  return enqueueApproval({
    method,
    origin,
    summary: {
      kind: classifyTransactionKind(transaction.contract, transaction.method),
      contract: transaction.contract,
      method: transaction.method,
      args: transaction.args ?? {},
      nonce,
      simulation,
    },
    execute: async () => {
      const signed = await signMessage(wallet, JSON.stringify(canonicalPayload));
      return submitCall(settings.rpcUrl, {
        from: wallet.address,
        contract: transaction.contract,
        method: transaction.method,
        args: transaction.args ?? {},
        alg: signed.algorithm,
        pk: wallet.publicKey,
        sig: signed.signature,
        nonce,
        chain_id: chainId,
        gas_limit: gasLimit,
        gas_price: gasPrice,
        version: typeof transaction.version === "number" ? transaction.version : 1,
        paymaster,
      });
    },
  });
}

export async function handleCallContract(ctx) {
  const { origin, snapshot, params } = ctx;
  requireOriginPermission(origin, snapshot, PROVIDER_METHODS.SEND_TRANSACTION);
  const transaction = buildTransactionPayloadFromParams(params);
  return handleSendTransaction({
    ...ctx,
    method: PROVIDER_METHODS.SEND_TRANSACTION,
    params: {
      transaction,
    },
  });
}

export async function handleQueryContract(ctx) {
  const { origin, method, params, snapshot } = ctx;
  requireOriginPermission(origin, snapshot, method);
  if (typeof params.contract !== "string" || params.contract.length === 0) {
    throw new ProviderError("INVALID_PARAMS", "Missing contract.");
  }
  if (typeof params.method !== "string" || params.method.length === 0) {
    throw new ProviderError("INVALID_PARAMS", "Missing method.");
  }
  return queryContract(snapshot.settings.rpcUrl, params.contract, params.method, params.args ?? {});
}

export async function handleSimulateCall(ctx) {
  const { origin, method, params, snapshot } = ctx;
  requireOriginPermission(origin, snapshot, method);
  const settings = await getSettings();
  if (!params.call || typeof params.call !== "object") {
    throw new ProviderError("INVALID_PARAMS", "Missing call payload.");
  }
  return simulateCall(settings.rpcUrl, params.call);
}

export async function handleEstimateGas(ctx) {
  const { origin, method, params, snapshot } = ctx;
  requireOriginPermission(origin, snapshot, method);
  if (!params.call || typeof params.call !== "object") {
    throw new ProviderError("INVALID_PARAMS", "Missing call payload.");
  }
  return estimateGas(snapshot.settings.rpcUrl, params.call);
}
