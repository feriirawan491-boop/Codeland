import {
  guardedAdmin,
  readAdminStore,
  saveAdminStore,
  adminAudit,
  AdminError,
  assertReason,
  sanitizeLog,
} from './store';
export async function checkIntegration(id: string, simulateError: boolean) {
  const ctx = await guardedAdmin('integration'),
    s = readAdminStore(),
    v = s.integrations.find((v) => v.id === id);
  if (!v) throw new AdminError('404', 'Konektor tidak ditemukan.');
  const correlationId = crypto.randomUUID();
  v.state = simulateError ? 'simulated_error' : 'simulated_ok';
  v.checkedAt = new Date().toISOString();
  v.logs.unshift({
    id: crypto.randomUUID(),
    correlationId,
    message: sanitizeLog(
      simulateError
        ? 'Demo connector unavailable; token=DEMO_PRIVATE_SECRET; Authorization: Bearer DEMO_PRIVATE_TOKEN'
        : 'Simulasi konektor berhasil. Tidak ada panggilan ke provider nyata.',
    ),
    at: v.checkedAt,
    replayed: false,
  });
  adminAudit(
    s,
    ctx,
    'Status integrasi demo diperiksa',
    id,
    'Pemeriksaan konektor pada adaptor lokal.',
    null,
    correlationId,
  );
  saveAdminStore(s);
}
export async function replayIntegration(
  id: string,
  logId: string,
  reason: string,
) {
  assertReason(reason);
  const ctx = await guardedAdmin('replay'),
    s = readAdminStore(),
    v = s.integrations.find((v) => v.id === id),
    log = v?.logs.find((l) => l.id === logId);
  if (!v || !log)
    throw new AdminError('404', 'Event integrasi tidak ditemukan.');
  if (log.replayed) return;
  log.replayed = true;
  adminAudit(
    s,
    ctx,
    'Replay diagnostik direkonsiliasi tanpa mengulang perubahan uang',
    id,
    reason,
    null,
    log.correlationId,
  );
  saveAdminStore(s);
}
export async function enterEmergency(reason: string) {
  assertReason(reason);
  const ctx = await guardedAdmin('access'),
    s = readAdminStore();
  s.emergency.push({
    actorId: ctx.actor.id,
    reason,
    expiresAt: new Date(Date.now() + 900000).toISOString(),
  });
  adminAudit(
    s,
    ctx,
    'Akses darurat dicatat; approval keuangan tetap wajib',
    'emergency',
    reason,
  );
  saveAdminStore(s);
}
