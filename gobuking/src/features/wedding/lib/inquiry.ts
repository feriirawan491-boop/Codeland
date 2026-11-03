import { inquiryAdapter } from '@/features/venue/lib/inquiry-adapter';
import type { InquiryInput, VenueScenario } from '@/features/venue/lib/types';
export const weddingInquiryAdapter = {
  createWeddingInquiry(
    input: Omit<InquiryInput, 'service'>,
    commandId: string,
    scenario: VenueScenario = 'ready',
  ) {
    return inquiryAdapter.createInquiry(
      { ...input, service: 'wedding' },
      commandId,
      [],
      scenario,
    );
  },
  verifyInquiryContact: inquiryAdapter.verifyInquiryContact,
  getQuoteVersions: inquiryAdapter.getQuoteVersions,
};
