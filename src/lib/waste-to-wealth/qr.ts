export function makeQrPayload(lotId: string) {
  // Keep it human-readable for demo + offline tracking.
  return JSON.stringify({
    scheme: "sanjha",
    kind: "collection-lot",
    lotId,
  });
}

export function parseQrPayload(payload: string) {
  try {
    const obj = JSON.parse(payload) as { lotId?: string; kind?: string };
    if (obj.kind !== "collection-lot" || !obj.lotId) return null;
    return { lotId: obj.lotId };
  } catch {
    return null;
  }
}

