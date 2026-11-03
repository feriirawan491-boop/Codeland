// Only public listing IDs are persisted; account favourites are tab-local demo data.
const DEVICE_KEY = 'gobuking:saved:v1';
const ACCOUNT_KEY = 'gobuking:account-saved:v1';
export const SAVED_EVENT = 'gobuking:saved-changed';
function ids(raw: string | null): string[] {
  try {
    const value: unknown = JSON.parse(raw ?? '[]');
    return Array.isArray(value)
      ? [...new Set(value.filter((id): id is string => typeof id === 'string'))]
      : [];
  } catch {
    return [];
  }
}
function accounts(): Record<string, string[]> {
  try {
    return JSON.parse(sessionStorage.getItem(ACCOUNT_KEY) ?? '{}') as Record<
      string,
      string[]
    >;
  } catch {
    return {};
  }
}
export function readSavedIds(accountId?: string) {
  return accountId
    ? ids(JSON.stringify(accounts()[accountId] ?? []))
    : ids(localStorage.getItem(DEVICE_KEY));
}
export function writeSavedIds(next: string[], accountId?: string) {
  const value = [...new Set(next)];
  if (accountId)
    sessionStorage.setItem(
      ACCOUNT_KEY,
      JSON.stringify({ ...accounts(), [accountId]: value }),
    );
  else localStorage.setItem(DEVICE_KEY, JSON.stringify(value));
  window.dispatchEvent(new Event(SAVED_EVENT));
}
export function mergeAccountSaved(accountId: string) {
  const value = [...new Set([...readSavedIds(accountId), ...readSavedIds()])];
  writeSavedIds(value, accountId);
  localStorage.removeItem(DEVICE_KEY);
  window.dispatchEvent(new Event(SAVED_EVENT));
}
