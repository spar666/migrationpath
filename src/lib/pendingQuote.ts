// Carries a selected package ID across the /quote -> /auth -> /quote
// round trip when someone picks a package before signing in.
//
// Uses localStorage (not sessionStorage) specifically so it survives the
// visitor closing the tab between leaving for /auth and coming back — the
// previous sessionStorage-based version lost the selection silently in
// that case. A short expiry keeps a stale selection from lingering
// indefinitely if they never come back.

const STORAGE_KEY = "pendingQuotePackage";
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface PendingQuotePackage {
  packageId: string;
  savedAt: number;
}

export function setPendingQuotePackage(packageId: string): void {
  const payload: PendingQuotePackage = { packageId, savedAt: Date.now() };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // localStorage can throw in private-browsing / storage-full edge cases.
    // Non-fatal — worst case the visitor just re-selects their package.
  }
}

export function getPendingQuotePackage(): string | null {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  try {
    const parsed: PendingQuotePackage = JSON.parse(raw);
    if (Date.now() - parsed.savedAt > TTL_MS) {
      clearPendingQuotePackage();
      return null;
    }
    return parsed.packageId;
  } catch {
    clearPendingQuotePackage();
    return null;
  }
}

export function clearPendingQuotePackage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
