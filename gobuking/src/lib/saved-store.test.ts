import { beforeEach, expect, it } from 'vitest';
import { mergeAccountSaved, readSavedIds, writeSavedIds } from './saved-store';
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
it('merges anonymous and account favourites without duplicates across repeated login', () => {
  writeSavedIds(['nala', 'nala']);
  mergeAccountSaved('account');
  writeSavedIds(['ranu']);
  mergeAccountSaved('account');
  mergeAccountSaved('account');
  expect(readSavedIds('account').sort()).toEqual(['nala', 'ranu']);
  writeSavedIds(['ranu'], 'account');
  expect(readSavedIds('account')).toEqual(['ranu']);
});
