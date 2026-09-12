// Resolve the wallet's side on a binary fill. Fill.takerSide is a lagging
// denormalized field; the taker order and maker side are role-specific truth.

const BINARY_SIDES = new Set(["BUY_YES", "SELL_YES", "BUY_NO", "SELL_NO"]);

function normalized(value) {
  return value === undefined || value === null ? "" : String(value).toLowerCase();
}

function sideOrUnknown(value) {
  const side = String(value ?? "").toUpperCase();
  return BINARY_SIDES.has(side) ? side : "UNKNOWN";
}

export function attributeFillSide(fill = {}, walletAddress) {
  const wallet = normalized(walletAddress);
  const maker = normalized(fill.maker);
  const taker = normalized(fill.taker);
  const takerOrderOwner = normalized(fill.takerOrder?.owner);
  const isMaker = Boolean(wallet) && maker === wallet;
  const isTaker = Boolean(wallet) && (taker === wallet || takerOrderOwner === wallet);

  // A self-fill or contradictory row cannot be assigned safely to one seat.
  if (isMaker && isTaker) return { role: "UNKNOWN", side: "UNKNOWN", resolved: false };
  if (isTaker) {
    const orderSide = fill.takerOrder?.side;
    return {
      role: "TAKER",
      side: sideOrUnknown(orderSide ?? fill.takerSide),
      resolved: BINARY_SIDES.has(String(orderSide ?? fill.takerSide ?? "").toUpperCase()),
    };
  }
  if (isMaker) {
    return {
      role: "MAKER",
      side: sideOrUnknown(fill.makerSide),
      resolved: BINARY_SIDES.has(String(fill.makerSide ?? "").toUpperCase()),
    };
  }
  return { role: "UNKNOWN", side: "UNKNOWN", resolved: false };
}

function comparable(value) {
  if (value === undefined || value === null || value === "") return null;
  try { return BigInt(value); } catch { return null; }
}

function compareFills(a, b) {
  const aTimestamp = comparable(a.row?.timestamp);
  const bTimestamp = comparable(b.row?.timestamp);
  if (aTimestamp !== null && bTimestamp !== null && aTimestamp !== bTimestamp) {
    return aTimestamp < bTimestamp ? -1 : 1;
  }
  const aBlock = comparable(a.row?.blockNumber);
  const bBlock = comparable(b.row?.blockNumber);
  if (aBlock !== null && bBlock !== null && aBlock !== bBlock) {
    return aBlock < bBlock ? -1 : 1;
  }
  const aLog = comparable(a.row?.logIndex);
  const bLog = comparable(b.row?.logIndex);
  if (aLog !== null && bLog !== null && aLog !== bLog) {
    return aLog < bLog ? -1 : 1;
  }
  // SDK rows are newest-first. If ordering metadata ties or is absent, keep
  // that contract by reversing the stable input order.
  return b.index - a.index;
}

// SDK getUserFills is newest-first. Return a copy in oldest-first order for
// trailing-history calculations, leaving the display cache untouched.
export function normalizeFillsChronologically(fills) {
  return (Array.isArray(fills) ? fills : [])
    .map((row, index) => ({ row, index }))
    .sort(compareFills)
    .map(({ row }) => row);
}
