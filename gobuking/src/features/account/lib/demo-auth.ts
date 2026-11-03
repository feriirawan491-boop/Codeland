'use client';
import { useSyncExternalStore } from 'react';
import { z } from 'zod';
import { mergeAccountSaved } from '@/lib/saved-store';
export type DemoAccount = {
  id: string;
  name: string;
  email: string;
  phone: string;
};
export type DemoSession = {
  id: string;
  accountId: string;
  device: string;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
};
type AuthStore = {
  accounts: DemoAccount[];
  activeId: string | null;
  sessions?: DemoSession[];
  activeSessionId?: string | null;
};
const AUTH_KEY = 'gobuking:demo-accounts:v1';
const AUTH_EVENT = 'gobuking:demo-account-change';
const emptyStore = (): AuthStore => ({ accounts: [], activeId: null });
let cachedRaw: string | null | undefined;
let cachedAccount: DemoAccount | null = null;
let cachedExpiresAt = Infinity;
function read(): AuthStore {
  try {
    const value = JSON.parse(
      sessionStorage.getItem(AUTH_KEY) ?? 'null',
    ) as AuthStore | null;
    return value && Array.isArray(value.accounts) ? value : emptyStore();
  } catch {
    return emptyStore();
  }
}
export function getDemoAccount(): DemoAccount | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(AUTH_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    const value = read();
    const session = value.activeSessionId
      ? value.sessions?.find((item) => item.id === value.activeSessionId)
      : undefined;
    cachedExpiresAt = session ? Date.parse(session.expiresAt) : Infinity;
    cachedAccount =
      value.activeSessionId &&
      (!session || session.revokedAt || cachedExpiresAt <= Date.now())
        ? null
        : (value.accounts.find((account) => account.id === value.activeId) ??
          null);
  }
  if (cachedExpiresAt <= Date.now()) cachedAccount = null;
  return cachedAccount;
}
function write(value: AuthStore) {
  sessionStorage.setItem(AUTH_KEY, JSON.stringify(value));
  window.dispatchEvent(new Event(AUTH_EVENT));
}
function subscribe(callback: () => void) {
  const timer = setInterval(() => {
    if (cachedExpiresAt <= Date.now()) callback();
  }, 1000);
  window.addEventListener(AUTH_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    clearInterval(timer);
    window.removeEventListener(AUTH_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}
const serverSnapshot = () => null;
export function useDemoAccount() {
  return useSyncExternalStore(subscribe, getDemoAccount, serverSnapshot);
}
export function demoAccountExists(email: string) {
  return read().accounts.some(
    (account) => account.email === email.trim().toLowerCase(),
  );
}
export function signOutDemoAccount() {
  const store = read();
  write({
    ...store,
    activeId: null,
    activeSessionId: null,
    sessions: store.sessions?.map((item) =>
      item.id === store.activeSessionId
        ? { ...item, revokedAt: new Date().toISOString() }
        : item,
    ),
  });
}
export const demoIdentitySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Isi nama pemesan minimal 2 karakter.')
    .max(100),
  email: z
    .email('Masukkan email yang valid.')
    .transform((value) => value.trim().toLowerCase()),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s()-]{8,20}$/, 'Masukkan nomor telepon yang valid.'),
});
export async function verifyDemoAccount(
  mode: 'login' | 'register',
  profile: DemoAccountInput,
  code: string,
) {
  await new Promise((resolve) => setTimeout(resolve, 180));
  if (code !== '123456')
    throw new Error('Kode demo belum sesuai. Gunakan 123456.');
  const store = read();
  const email = profile.email.trim().toLowerCase();
  let account = store.accounts.find((item) => item.email === email);
  if (mode === 'register') {
    if (account) throw new Error('Email sudah terdaftar. Silakan masuk.');
    const valid = demoIdentitySchema.parse(profile);
    account = { ...valid, id: `USER-DEMO-${crypto.randomUUID()}` };
    store.accounts = [...store.accounts, account];
  } else if (!account)
    throw new Error('Email belum terdaftar. Buat akun terlebih dahulu.');
  const now = new Date().toISOString();
  const session: DemoSession = {
    id: `SESSION-${crypto.randomUUID()}`,
    accountId: account.id,
    device: 'Browser ini',
    createdAt: now,
    expiresAt: new Date(Date.now() + 8 * 3600000).toISOString(),
    revokedAt: null,
  };
  write({
    ...store,
    activeId: account.id,
    activeSessionId: session.id,
    sessions: [...(store.sessions ?? []), session],
  });
  try {
    mergeAccountSaved(account.id);
  } catch {
    /* Login remains available if favourites storage is full. */
  }
  return account;
}
export type DemoAccountInput = { name: string; email: string; phone: string };

export function currentDemoSessionId() {
  return read().activeSessionId ?? null;
}
export function listDemoSessions() {
  const account = getDemoAccount();
  if (!account) throw new Error('401: Sesi berakhir. Silakan masuk kembali.');
  return (read().sessions ?? [])
    .filter((item) => item.accountId === account.id)
    .map((item) => ({ ...item, current: item.id === read().activeSessionId }));
}
export function revokeDemoSession(id: string) {
  const account = getDemoAccount();
  if (!account) throw new Error('401: Sesi berakhir. Silakan masuk kembali.');
  const store = read(),
    session = store.sessions?.find(
      (item) => item.id === id && item.accountId === account.id,
    );
  if (!session) throw new Error('403: Sesi tidak dapat diakses.');
  write({
    ...store,
    sessions: store.sessions?.map((item) =>
      item.id === id ? { ...item, revokedAt: new Date().toISOString() } : item,
    ),
  });
}
export function validateDemoSession(id: string) {
  const store = read(),
    session = store.sessions?.find((item) => item.id === id);
  if (
    !session ||
    session.revokedAt ||
    Date.parse(session.expiresAt) <= Date.now()
  )
    throw new Error('401: Sesi dicabut atau kedaluwarsa.');
  return store.accounts.find((item) => item.id === session.accountId) ?? null;
}
export function addSimulatedDemoSession() {
  const account = getDemoAccount();
  if (!account) throw new Error('401: Sesi berakhir. Silakan masuk kembali.');
  const store = read();
  const value: DemoSession = {
    id: `SESSION-${crypto.randomUUID()}`,
    accountId: account.id,
    device: 'Perangkat simulasi',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 8 * 3600000).toISOString(),
    revokedAt: null,
  };
  write({ ...store, sessions: [...(store.sessions ?? []), value] });
  return value;
}
function applyDemoAccountProfile(
  patch: Partial<Pick<DemoAccount, 'name' | 'email' | 'phone'>>,
) {
  const account = getDemoAccount();
  if (!account) throw new Error('401: Sesi berakhir. Silakan masuk kembali.');
  const store = read();
  const next = demoIdentitySchema.parse({ ...account, ...patch });
  if (
    store.accounts.some(
      (item) => item.id !== account.id && item.email === next.email,
    )
  )
    throw new Error('Email sudah dipakai akun lain.');
  const value = { ...next, id: account.id };
  write({
    ...store,
    accounts: store.accounts.map((item) =>
      item.id === account.id ? value : item,
    ),
  });
  return value;
}

export function updateDemoAccountName(name: string) {
  return applyDemoAccountProfile({ name });
}
type ContactChange = {
  id: string;
  accountId: string;
  sessionId: string | null;
  field: 'email' | 'phone';
  value: string;
  previous: string;
  expiresAt: string;
  verifiedAt: string | null;
};
const CONTACT_KEY = 'gobuking:contact-changes:v1';
function changes(): ContactChange[] {
  try {
    return JSON.parse(
      sessionStorage.getItem(CONTACT_KEY) ?? '[]',
    ) as ContactChange[];
  } catch {
    return [];
  }
}
export function pendingDemoContactChanges() {
  const account = getDemoAccount();
  if (!account) throw new Error('401: Sesi berakhir. Silakan masuk kembali.');
  return changes().filter(
    (item) =>
      item.accountId === account.id &&
      item.sessionId === currentDemoSessionId() &&
      !item.verifiedAt &&
      Date.parse(item.expiresAt) > Date.now(),
  );
}
export async function beginDemoContactChange(
  field: 'email' | 'phone',
  input: string,
) {
  const account = getDemoAccount();
  if (!account) throw new Error('401: Sesi berakhir. Silakan masuk kembali.');
  const value =
    field === 'email'
      ? z.email('Masukkan email yang valid.').parse(input.trim().toLowerCase())
      : demoIdentitySchema.shape.phone.parse(input);
  if (value === account[field])
    throw new Error('Kontak baru harus berbeda dari kontak terverifikasi.');
  if (
    read().accounts.some(
      (item) => item.id !== account.id && item[field] === value,
    )
  )
    throw new Error('Kontak sudah digunakan akun lain.');
  const currentSession = currentDemoSessionId();
  await new Promise((resolve) => setTimeout(resolve, 120));
  if (
    getDemoAccount()?.id !== account.id ||
    currentDemoSessionId() !== currentSession
  )
    throw new Error('401: Sesi akun berubah.');
  const challenge: ContactChange = {
    id: `CONTACT-${crypto.randomUUID()}`,
    accountId: account.id,
    sessionId: currentSession,
    field,
    value,
    previous: account[field],
    expiresAt: new Date(Date.now() + 10 * 60000).toISOString(),
    verifiedAt: null,
  };
  sessionStorage.setItem(
    CONTACT_KEY,
    JSON.stringify([
      ...changes().filter(
        (item) => item.accountId !== account.id || item.field !== field,
      ),
      challenge,
    ]),
  );
  return challenge;
}
export async function verifyDemoContactChange(id: string, code: string) {
  const account = getDemoAccount();
  if (!account) throw new Error('401: Sesi berakhir. Silakan masuk kembali.');
  await new Promise((resolve) => setTimeout(resolve, 120));
  const challenge = changes().find(
    (item) => item.id === id && item.accountId === account.id,
  );
  if (
    getDemoAccount()?.id !== account.id ||
    !challenge ||
    challenge.sessionId !== currentDemoSessionId()
  )
    throw new Error('403: Verifikasi kontak tidak dapat diakses.');
  if (challenge.verifiedAt) return getDemoAccount();
  if (Date.parse(challenge.expiresAt) <= Date.now())
    throw new Error(
      'Kode verifikasi kedaluwarsa. Ajukan ulang perubahan kontak.',
    );
  if (code !== '123456')
    throw new Error('Kode demo belum sesuai. Gunakan 123456.');
  if (getDemoAccount()?.[challenge.field] !== challenge.previous)
    throw new Error('Kontak telah berubah. Ajukan verifikasi baru.');
  if (
    read().accounts.some(
      (item) =>
        item.id !== account.id && item[challenge.field] === challenge.value,
    )
  )
    throw new Error('Kontak sudah digunakan akun lain.');
  const value = applyDemoAccountProfile({ [challenge.field]: challenge.value });
  sessionStorage.setItem(
    CONTACT_KEY,
    JSON.stringify(
      changes().map((item) =>
        item.id === id
          ? { ...item, verifiedAt: new Date().toISOString() }
          : item,
      ),
    ),
  );
  return value;
}
