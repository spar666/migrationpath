import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProspectSession } from '@/lib/prospectSession';

/**
 * The one way to send someone to book a consultation.
 *
 * It exists because there were three different hardcoded calendly.com links
 * scattered through the app — two of them placeholders that were never
 * replaced, all three pointing at different URLs. Every one of them had the
 * same defect: no prospect id. A Calendly invitee with no prospect id cannot be
 * matched to a record by the webhook, which means the booking cannot be charged
 * for, cannot be prepped, and shows up nowhere an agent will look.
 *
 * So booking is gated on having a prospect. Someone who has one goes to the
 * calendar; someone who does not is sent to the assessment that creates one,
 * because the alternative is a booking nobody can act on.
 */
export function useBookConsultation() {
  const navigate = useNavigate();

  return useCallback(() => {
    const prospect = getProspectSession();

    if (prospect) {
      navigate(
        `/consult/schedule?prospect_id=${prospect.prospectId}&ref=${prospect.humanRef}`,
      );
      return;
    }

    navigate('/partner-audit');
  }, [navigate]);
}

/** Whether the visitor can go straight to the calendar. Drives CTA wording. */
export function hasBookableProspect(): boolean {
  return getProspectSession() !== null;
}
