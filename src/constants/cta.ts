/**
 * Single source of truth for the primary conversion action.
 * The whole site drives to one high-ticket action: booking the strategy call.
 * Define the label/route once here and reuse via <ConsultationCTA /> so wording
 * never drifts across the funnel.
 */
export const CONSULT_CTA_LABEL = 'Book My 15-Minute Strategy Alignment Call';
export const CONSULT_ROUTE = '/consultation';

/**
 * Fallback scheduler URL, used when VITE_CALENDLY_CONSULT_URL is unset.
 *
 * The env var is still the right place to configure this — staging should point
 * at a test event type — but a missing env var used to mean a Book button that
 * threw on click, which is the single most expensive failure in this funnel.
 * URL building (prospect id, prefill, UTM attribution) lives in lib/booking.ts;
 * this is only the address.
 */
export const CALENDLY_CONSULT_URL_FALLBACK =
  'https://calendly.com/studyandvisa-au/initial-consultation';
