import { apiClient, unwrapArray } from '@/lib/apiClient';

/**
 * The agent-facing view of the pre-screen funnel.
 *
 * Every endpoint here is admin-only on the backend (JwtAuthGuard + RolesGuard).
 * The public funnel writes these records; this is the only way to read them
 * back, and until now nothing in the UI did — the booking-confirmed alert even
 * deep-links to a prospect page that did not exist.
 */

export type ProspectStage =
  | 'captured'
  | 'pre_screened'
  | 'booked'
  | 'consulted'
  | 'engaged'
  | 'disqualified';

export type ProspectParty = 'applicant' | 'business';

export const PROSPECT_STAGES: ProspectStage[] = [
  'captured',
  'pre_screened',
  'booked',
  'consulted',
  'engaged',
  'disqualified',
];

export interface Prospect {
  id: string;
  human_ref: string;
  party: ProspectParty;
  full_name: string;
  email: string;
  phone?: string | null;
  company_name?: string | null;
  stage: ProspectStage;
  /** Null until the engine has run — "not screened" is not the same as "failed". */
  statutory_eligible?: boolean | null;
  client_fit?: boolean | null;
  source: string;
  visa_interest?: string | null;
  consent_given: boolean;
  consent_text?: string | null;
  consent_at?: string | null;
  agent_notes?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * The stitched prep record. Every field is nullable: the summary is written
 * best-effort after the prospect, so a row can exist with the engine result but
 * no booking, or with answers but no sponsorship.
 */
export interface ProspectSummary {
  headline?: string | null;
  eligibility?: Record<string, unknown> | null;
  answers?: Record<string, unknown> | null;
  engine_result?: EngineResult | null;
  sponsorship?: Record<string, unknown> | null;
  booking?: Record<string, unknown> | null;
  payment?: Record<string, unknown> | null;
  refreshed_at?: string | null;
}

/** The subset of the engine's output the agent view renders. */
export interface EngineResult {
  statutory_eligible?: boolean;
  client_fit?: boolean;
  recommended_subclass?: string;
  recommended_label?: string;
  reasons?: string[];
  blockers?: string[];
  open_questions?: string[];
  sponsor_findings?: string[];
  assessed_at?: string;
  engine_version?: string;
}

export interface ProspectPrepView {
  prospect: Prospect;
  summary: ProspectSummary | null;
}

export interface ProspectListPage {
  data: Prospect[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Reads the pagination envelope, tolerating the single/double wrap. */
function readPage(response: unknown): ProspectListPage {
  const body = (response as any)?.data ?? response;
  const inner = (body as any)?.data !== undefined ? body : { data: body };
  return {
    data: unwrapArray<Prospect>(response),
    total: Number((inner as any)?.total ?? 0),
    page: Number((inner as any)?.page ?? 1),
    limit: Number((inner as any)?.limit ?? 20),
    totalPages: Number((inner as any)?.totalPages ?? 1),
  };
}

function unwrapOne<T>(response: unknown): T {
  const body = response as any;
  return (body?.data ?? body) as T;
}

class AdminProspectService {
  async list(params: {
    page?: number;
    limit?: number;
    stage?: ProspectStage;
    party?: ProspectParty;
  } = {}): Promise<ProspectListPage> {
    // Only send filters that are set — the backend builds its where clause from
    // whatever arrives, so an empty string would filter everything out.
    const query: Record<string, string | number> = {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    };
    if (params.stage) query.stage = params.stage;
    if (params.party) query.party = params.party;

    const response = await apiClient.get<unknown>('/prospects', {
      params: query,
    });
    return readPage(response);
  }

  /** Prospect + stitched summary — what the agent reads before the call. */
  async getPrepView(id: string): Promise<ProspectPrepView> {
    const response = await apiClient.get<unknown>(
      `/prospects/${encodeURIComponent(id)}`,
    );
    return unwrapOne<ProspectPrepView>(response);
  }

  /** Lookup by the reference the prospect quotes in an email or on the phone. */
  async getByRef(humanRef: string): Promise<Prospect> {
    const response = await apiClient.get<unknown>(
      `/prospects/ref/${encodeURIComponent(humanRef)}`,
    );
    return unwrapOne<Prospect>(response);
  }

  async advanceStage(id: string, stage: ProspectStage): Promise<Prospect> {
    const response = await apiClient.patch<unknown>(
      `/prospects/${encodeURIComponent(id)}/stage`,
      { stage },
    );
    return unwrapOne<Prospect>(response);
  }
}

export const adminProspectService = new AdminProspectService();
