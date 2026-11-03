export function assertPurchaseEligibility(accountId: string) {
  let ids: string[] = [];
  try {
    ids = JSON.parse(
      sessionStorage.getItem('gobuking:restricted-accounts:v1') ?? '[]',
    );
  } catch {}
  if (ids.includes(accountId))
    throw new Error(
      'Akun sedang dalam review platform. Hubungi bantuan untuk pemesanan baru.',
    );
}
