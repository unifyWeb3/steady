import { isHexHash } from "./dom.js";

function candidateHash(value) {
  return isHexHash(value) ? String(value) : "";
}

export function currentAttemptTransactionHash(error, attempt = {}) {
  const candidates = [
    error?.transactionHash,
    error?.hash,
    error?.data?.transactionHash,
    error?.data?.hash,
    error?.receipt?.transactionHash,
    error?.receipt?.hash,
    error?.cause?.transactionHash,
    error?.cause?.hash,
    error?.cause?.data?.transactionHash,
    error?.cause?.data?.hash,
    attempt?.txHash,
  ];
  for (const value of candidates) {
    const hash = candidateHash(value);
    if (hash) return hash;
  }
  return "";
}

function isTimeoutError(error) {
  return /timeout|timed out|UND_ERR|ConnectTimeout/i.test(String(error?.message ?? error ?? ""));
}

export function classifyTradeSubmissionError({ error, attempt = {} }) {
  const txHash = currentAttemptTransactionHash(error, attempt);
  const mayHaveBroadcast = attempt?.submissionStarted === true || attempt?.signedOrBroadcast === true;
  const timedOut = isTimeoutError(error);
  if (timedOut && (txHash || mayHaveBroadcast)) {
    return {
      state: "UNKNOWN",
      tradeAttemptId: String(attempt?.tradeAttemptId ?? ""),
      txHash,
      duplicateBlocked: true,
      receiptPollable: Boolean(txHash),
    };
  }
  return {
    state: "FAILED",
    tradeAttemptId: String(attempt?.tradeAttemptId ?? ""),
    txHash,
    duplicateBlocked: false,
    receiptPollable: false,
  };
}
