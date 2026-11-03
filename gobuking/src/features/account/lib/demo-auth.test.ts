import { beforeEach, expect, it } from 'vitest';
import {
  demoAccountExists,
  getDemoAccount,
  signOutDemoAccount,
  verifyDemoAccount,
} from './demo-auth';
const profile = {
  name: 'Demo Guest',
  email: 'guest@example.com',
  phone: '081234567890',
};
beforeEach(() => sessionStorage.clear());
it('requires registration and correct OTP before opening a session', async () => {
  await expect(verifyDemoAccount('login', profile, '123456')).rejects.toThrow(
    'Email belum terdaftar',
  );
  await expect(
    verifyDemoAccount('register', profile, '000000'),
  ).rejects.toThrow('Kode demo belum sesuai');
  expect(getDemoAccount()).toBeNull();
  expect(demoAccountExists(profile.email)).toBe(false);
  const registered = await verifyDemoAccount('register', profile, '123456');
  expect(getDemoAccount()?.id).toBe(registered.id);
  signOutDemoAccount();
  expect(getDemoAccount()).toBeNull();
  const loggedIn = await verifyDemoAccount('login', profile, '123456');
  expect(loggedIn.id).toBe(registered.id);
});
it('rejects duplicate registration and keeps normalized email identity', async () => {
  const registered = await verifyDemoAccount('register', profile, '123456');
  await expect(
    verifyDemoAccount('register', profile, '123456'),
  ).rejects.toThrow('Email sudah terdaftar');
  signOutDemoAccount();
  const loggedIn = await verifyDemoAccount(
    'login',
    { ...profile, email: 'GUEST@EXAMPLE.COM' },
    '123456',
  );
  expect(loggedIn.id).toBe(registered.id);
});
