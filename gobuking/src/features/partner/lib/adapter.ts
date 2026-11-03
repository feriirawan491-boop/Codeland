import {
  guarded,
  ownListings,
  readPartnerStore,
  partnerGuard,
  PartnerError,
} from './store';
import { sourceReservations, sourceInquiries } from './sources';
export const partnerAdapter = {
  async getWorkspace(scenario = 'ready') {
    const ctx = await guarded('read', undefined, scenario);
    return {
      context: ctx,
      listings: scenario === 'empty' ? [] : ownListings(ctx),
      calendar: Object.fromEntries(
        Object.entries(readPartnerStore().calendars).filter(([id]) =>
          ownListings(ctx).some((l) => l.id === id),
        ),
      ),
      notifications: [
        ...sourceReservations(ctx)
          .filter(
            (b) =>
              ctx.capabilities.includes('reservation') &&
              b.status === 'requested',
          )
          .map((b) => ({
            id: b.id,
            label: 'Request rental perlu ditinjau',
            href: `/partner/reservations?detail=${b.id}`,
          })),
        ...sourceInquiries(ctx)
          .filter(
            (i) =>
              ctx.capabilities.includes('crm') &&
              !['closed_lost', 'closed_won', 'withdrawn'].includes(i.status),
          )
          .map((i) => ({
            id: i.id,
            label: 'Inquiry venue perlu tindak lanjut',
            href: '/partner/inquiries',
          })),
        ...readPartnerStore()
          .tickets.filter(
            (v) =>
              v.orgId === ctx.organization.id &&
              v.status === 'waiting_partner' &&
              (!v.listingId ||
                ownListings(ctx).some((l) => l.id === v.listingId)),
          )
          .map((v) => ({
            id: v.id,
            label: 'Balasan platform tersedia',
            href: '/partner/support',
          })),
      ],
      quoteFiles: Object.fromEntries(
        Object.entries(readPartnerStore().quoteFiles).filter(
          ([id]) =>
            ctx.capabilities.includes('crm') &&
            sourceInquiries(ctx).some((i) => i.quotes.some((q) => q.id === id)),
        ),
      ),
      services: readPartnerStore().services.filter(
        (v) =>
          v.orgId === ctx.organization.id &&
          ownListings(ctx).some((l) => l.id === v.listingId),
      ),
      team: ctx.capabilities.includes('team')
        ? readPartnerStore().memberships.filter(
            (m) => m.orgId === ctx.organization.id,
          )
        : [],
      activities: ctx.capabilities.includes('audit')
        ? readPartnerStore().activities.filter(
            (a) => a.orgId === ctx.organization.id,
          )
        : [],
      reservations:
        ctx.capabilities.includes('reservation') ||
        ctx.capabilities.includes('operation') ||
        ctx.capabilities.includes('finance')
          ? sourceReservations(ctx).map((b) =>
              ctx.membership.role === 'finance'
                ? { ...b, customerName: 'Pelanggan', email: '', phone: '' }
                : b,
            )
          : [],
      inquiries: ctx.capabilities.includes('crm') ? sourceInquiries(ctx) : [],
      quoteDrafts: ctx.capabilities.includes('crm')
        ? Object.values(readPartnerStore().quoteDrafts).filter((d) =>
            ownListings(ctx).some((l) => l.id === d.listingId),
          )
        : [],
    };
  },
  async resolveCommand(id: string) {
    const ctx = await guarded(),
      v = readPartnerStore().commands[id];
    if (!v) return null;
    if (v.orgId !== ctx.organization.id || v.actorId !== ctx.membership.id)
      throw new PartnerError('403', 'Tindakan tidak dapat diakses.');
    return v;
  },
  getListing(id: string) {
    partnerGuard('read', id);
    return ownListings().find((l) => l.id === id)!;
  },
};
