import {
  getDemoAccount,
  updateDemoAccountName,
  pendingDemoContactChanges,
  beginDemoContactChange,
  verifyDemoContactChange,
  listDemoSessions,
  revokeDemoSession,
  addSimulatedDemoSession,
} from '@/features/account/lib/demo-auth';
import {
  requireDashboardAccount,
  assertSameAccount,
  readDashboardStore,
  saveDashboardRecord,
  dashboardDelay,
} from './store';
import { profileSchema } from './query';
import type { ProfilePreferences } from './types';
const KEY = 'gobuking:user-preferences:v1';
export const profileAdapter = {
  async getProfile() {
    const account = requireDashboardAccount();
    await dashboardDelay();
    assertSameAccount(account.id);
    return {
      account: getDemoAccount()!,
      preferences: readDashboardStore<ProfilePreferences>(KEY)[account.id] ?? {
        language: 'id' as const,
        currency: 'IDR' as const,
        emailUpdates: false,
      },
      pending: pendingDemoContactChanges(),
    };
  },
  async updateProfile(input: {
    name: string;
    language: 'id' | 'en';
    emailUpdates: boolean;
  }) {
    const account = requireDashboardAccount(),
      valid = profileSchema.parse(input);
    await dashboardDelay();
    assertSameAccount(account.id);
    updateDemoAccountName(valid.name);
    saveDashboardRecord(KEY, account.id, {
      language: valid.language,
      currency: 'IDR',
      emailUpdates: valid.emailUpdates,
    });
    return this.getProfile();
  },
  beginContactChange: beginDemoContactChange,
  verifyContactChange: verifyDemoContactChange,
  async listSessions() {
    const account = requireDashboardAccount();
    await dashboardDelay();
    assertSameAccount(account.id);
    return listDemoSessions();
  },
  async revokeSession(id: string) {
    const account = requireDashboardAccount();
    await dashboardDelay();
    assertSameAccount(account.id);
    revokeDemoSession(id);
  },
  addSimulatedSession: addSimulatedDemoSession,
};
