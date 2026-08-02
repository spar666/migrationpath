import { apiClient } from '@/lib/apiClient';
import type { ProspectParty } from './preScreenService';

/**
 * Lightweight prospect capture for surfaces that are NOT the employer-sponsored
 * questionnaire — the points calculator, the partner tool, any other vertical.
 *
 * Two capture endpoints exist by design:
 *
 *   POST /pre-screen  — runs the eligibility engine, returns a live result.
 *                       Use preScreenService for this.
 *   POST /prospects   — just puts the person on the funnel spine. No engine,
 *                       no eligibility verdict. This file.
 *
 * Both write the same prospect record, so a calculator lead and a
 * questionnaire lead show up in the same agent queue.
 */

export interface CaptureProspectPayload {
  party?: ProspectParty;
  full_name: string;
  email: string;
  phone?: string;
  company_name?: string;
  /** Which surface this came from, e.g. 'points_calculator'. */
  source?: string;
  visa_interest?: string;
  /** Must be true, and tied to a visible collection notice. */
  consent_given: boolean;
  consent_text?: string;
  /** Whatever the calculator produced — stored for the agent. */
  answers?: Record<string, unknown>;
}

export interface CaptureProspectResult {
  prospect_id: string;
  human_ref: string;
  stage: string;
}

function unwrap<T>(response: T | { data: T }): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data: T }).data;
  }
  return response as T;
}

class ProspectService {
  /**
   * Capture a prospect from a calculator or a partial form.
   *
   * Does not return an eligibility verdict — there isn't one. If you need a
   * verdict, you want the questionnaire and preScreenService.submit().
   */
  async capture(
    payload: CaptureProspectPayload,
  ): Promise<CaptureProspectResult> {
    const response = await apiClient.post<
      CaptureProspectResult | { data: CaptureProspectResult }
    >('/prospects', payload);
    return unwrap(response);
  }
}

export const prospectService = new ProspectService();
