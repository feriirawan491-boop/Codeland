import { canAccessCms } from './content';
import { guardedAdmin, adminScoped, readAdminStore, adminGuard } from './store';
import { readPartnerStore } from '@/features/partner/lib/store';
import { adminBookings } from './sources';
import { platformInquiries, platformTickets } from './operations';
import { platformReviews } from './content';
import { DEFAULT_PLATFORM_POLICY } from '@/features/booking/lib/platform-policy';
export const adminAdapter = {
  async workspace(scenario = 'ready') {
    const ctx = await guardedAdmin('read', undefined, scenario),
      p = readPartnerStore(),
      s = readAdminStore(),
      can = (cap: Parameters<typeof adminGuard>[0]) =>
        ctx.capabilities.includes(cap!);
    const rows = scenario === 'empty' ? [] : adminBookings(ctx);
    return {
      ctx,
      serverTime: new Date().toISOString(),
      bookings:
        can('reservation') ||
        can('reports') ||
        can('refund_request') ||
        can('reconcile')
          ? rows.map((b) =>
              ctx.actor.role.startsWith('finance')
                ? { ...b, email: '', customerName: 'Pelanggan' }
                : b,
            )
          : [],
      partners:
        can('verify') || can('catalog') || can('reports') || can('payout_make')
          ? p.businesses
              .filter((o) => adminScoped(ctx, o.id))
              .map((o) =>
                ctx.actor.role.startsWith('finance')
                  ? { ...o, email: '', phone: '', address: '', documents: [] }
                  : o,
              )
          : [],
      listings:
        can('catalog') || can('cms') || can('payout_make')
          ? p.listings.filter((l) => adminScoped(ctx, l.orgId))
          : [],
      verifications: can('verify')
        ? Object.fromEntries(
            Object.entries(s.verifications).filter(([id]) =>
              adminScoped(ctx, id),
            ),
          )
        : {},
      cases:
        can('support') || can('reservation')
          ? s.cases.filter((c) => adminScoped(ctx, c.orgId))
          : [],
      inquiries: can('crm') ? platformInquiries(ctx) : [],
      tickets: can('support') ? platformTickets(ctx) : [],
      reviews: can('moderation') ? platformReviews(ctx) : [],
      refunds:
        can('refund_request') || can('refund_approve') || can('reconcile')
          ? s.refunds.filter((r) => adminScoped(ctx, r.orgId))
          : [],
      batches:
        can('payout_make') ||
        can('payout_approve') ||
        can('payout_record') ||
        can('reconcile')
          ? s.batches.filter((b) =>
              b.items.every((i) => adminScoped(ctx, i.orgId)),
            )
          : [],
      gateway: can('reconcile')
        ? s.gateway.filter(
            (g) => !g.bookingId || rows.some((b) => b.id === g.bookingId),
          )
        : [],
      cms: can('cms') ? s.cms.filter((item) => canAccessCms(ctx, item)) : [],
      policy: can('settings')
        ? (s.policies.at(-1) ?? DEFAULT_PLATFORM_POLICY)
        : null,
      policies: can('settings') ? s.policies : [],
      moderation: can('moderation') ? s.moderation : [],
      services: can('reservation')
        ? p.services.filter((v) => adminScoped(ctx, v.orgId))
        : [],
      integrations: can('integration') ? s.integrations : [],
      actors:
        can('access') || can('support') || can('crm')
          ? s.actors.filter((a) => a.active)
          : [],
      allActors: can('access') ? s.actors : [],
      audit: can('audit')
        ? s.audit.filter((a) => adminScoped(ctx, a.orgId))
        : [],
      emergency:
        s.emergency.find(
          (e) =>
            e.actorId === ctx.actor.id && Date.parse(e.expiresAt) > Date.now(),
        ) ?? null,
    };
  },
  async resolveCommand(id: string) {
    const ctx = await guardedAdmin(),
      v = readAdminStore().commands[id];
    if (v && v.actor !== ctx.principal)
      throw new Error('Referensi tindakan tidak dapat diakses.');
    return v ?? null;
  },
};
export type AdminWorkspace = Awaited<ReturnType<typeof adminAdapter.workspace>>;
