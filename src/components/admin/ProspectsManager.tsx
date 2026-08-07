import { useCallback, useEffect, useState } from "react";
import {
  Briefcase,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Search,
  UserRound,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  adminProspectService,
  PROSPECT_STAGES,
  type Prospect,
  type ProspectParty,
  type ProspectStage,
} from "@/services/adminProspectService";
import { ProspectDetail } from "./ProspectDetail";

/**
 * The agent's queue for the employer-sponsored pre-screen.
 *
 * Every questionnaire submission writes a prospect whether or not it qualified,
 * so this list is deliberately not filtered down to bookable leads: an
 * ineligible person who becomes eligible in six months is the point of keeping
 * the record.
 */

const STAGE_STYLES: Record<ProspectStage, string> = {
  captured: "bg-muted text-muted-foreground border-border",
  pre_screened: "bg-blue-100 text-blue-700 border-blue-200",
  booked: "bg-amber-100 text-amber-700 border-amber-200",
  consulted: "bg-violet-100 text-violet-700 border-violet-200",
  engaged: "bg-green-100 text-green-700 border-green-200",
  disqualified: "bg-destructive/10 text-destructive border-destructive/20",
};

const STAGE_LABELS: Record<ProspectStage, string> = {
  captured: "Captured",
  pre_screened: "Pre-screened",
  booked: "Booked",
  consulted: "Consulted",
  engaged: "Engaged",
  disqualified: "Disqualified",
};

const ALL = "__all__";

/**
 * The two flags are shown separately, never merged into one verdict. "Meets the
 * rules but is not a client we take on" is a real and commercially important
 * outcome, and collapsing it into a single yes/no hides exactly the cases an
 * agent needs to triage differently.
 */
function EligibilityCell({ prospect }: { prospect: Prospect }) {
  if (prospect.statutory_eligible == null && prospect.client_fit == null) {
    return <span className="text-xs text-muted-foreground">Not screened</span>;
  }

  const canBook = prospect.statutory_eligible && prospect.client_fit;

  return (
    <div className="flex flex-wrap gap-1">
      {canBook ? (
        <Badge className="border-green-200 bg-green-100 text-green-700">
          Bookable
        </Badge>
      ) : prospect.statutory_eligible ? (
        <Badge className="border-amber-200 bg-amber-100 text-amber-700">
          Eligible · not a fit
        </Badge>
      ) : (
        <Badge variant="outline" className="text-muted-foreground">
          Not eligible
        </Badge>
      )}
    </div>
  );
}

export function ProspectsManager() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stage, setStage] = useState<string>(ALL);
  const [party, setParty] = useState<string>(ALL);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchProspects = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminProspectService.list({
        page,
        limit: 20,
        stage: stage === ALL ? undefined : (stage as ProspectStage),
        party: party === ALL ? undefined : (party as ProspectParty),
      });
      setProspects(result.data);
      setTotalPages(result.totalPages || 1);
      setTotal(result.total);
      setError(null);
    } catch (err) {
      // Distinguish "no prospects yet" from "we could not reach the API" — the
      // empty state otherwise reads as a working funnel with no submissions.
      console.error("Failed to load prospects:", err);
      setProspects([]);
      setError(
        err instanceof Error ? err.message : "Could not load prospects.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, stage, party]);

  useEffect(() => {
    fetchProspects();
  }, [fetchProspects]);

  /**
   * Search filters the page in hand rather than querying, because the endpoint
   * takes no search parameter. Labelled as such so nobody reads an empty result
   * as "this person is not in the system".
   */
  const term = search.trim().toLowerCase();
  const visible = term
    ? prospects.filter((p) =>
        [p.full_name, p.email, p.human_ref, p.company_name]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(term)),
      )
    : prospects;

  if (selectedId) {
    return (
      <ProspectDetail
        prospectId={selectedId}
        onBack={() => setSelectedId(null)}
        onStageChanged={fetchProspects}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Prospects</h1>
          <p className="text-muted-foreground">
            Employer-sponsored pre-screen submissions
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchProspects}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {total} {total === 1 ? "prospect" : "prospects"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative min-w-56 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter this page by name, email or reference…"
                className="pl-9"
              />
            </div>

            <Select
              value={stage}
              onValueChange={(v) => {
                setStage(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All stages</SelectItem>
                {PROSPECT_STAGES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STAGE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={party}
              onValueChange={(v) => {
                setParty(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All parties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All parties</SelectItem>
                <SelectItem value="applicant">Applicant</SelectItem>
                <SelectItem value="business">Business</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : visible.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {error
                ? "Could not load prospects."
                : term
                  ? "No match on this page. Search only covers the rows currently loaded."
                  : "No prospects yet."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Reference</th>
                    <th className="pb-2 pr-4 font-medium">Name</th>
                    <th className="pb-2 pr-4 font-medium">Party</th>
                    <th className="pb-2 pr-4 font-medium">Eligibility</th>
                    <th className="pb-2 pr-4 font-medium">Stage</th>
                    <th className="pb-2 pr-4 font-medium">Received</th>
                    <th className="pb-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {visible.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-border/40 last:border-0 hover:bg-muted/40"
                    >
                      <td className="py-3 pr-4 font-mono text-xs font-semibold">
                        {p.human_ref}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="font-medium">{p.full_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {p.email}
                        </div>
                        {p.company_name && (
                          <div className="text-xs text-muted-foreground">
                            {p.company_name}
                          </div>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          {p.party === "business" ? (
                            <Briefcase className="h-3.5 w-3.5" />
                          ) : (
                            <UserRound className="h-3.5 w-3.5" />
                          )}
                          {p.party === "business" ? "Business" : "Applicant"}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <EligibilityCell prospect={p} />
                      </td>
                      <td className="py-3 pr-4">
                        <Badge
                          variant="outline"
                          className={STAGE_STYLES[p.stage]}
                        >
                          {STAGE_LABELS[p.stage] ?? p.stage}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-xs text-muted-foreground">
                        {p.created_at
                          ? format(new Date(p.created_at), "d MMM yyyy")
                          : "—"}
                      </td>
                      <td className="py-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1"
                          onClick={() => setSelectedId(p.id)}
                        >
                          Open
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <CalendarCheck className="h-3.5 w-3.5" />
        Prospects are written for every submission, eligible or not — an
        ineligible enquiry today may qualify later.
      </p>
    </div>
  );
}
