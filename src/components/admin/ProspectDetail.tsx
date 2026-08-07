import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  Loader2,
  Mail,
  Phone,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  type ProspectPrepView,
  type ProspectStage,
} from "@/services/adminProspectService";

/**
 * The pre-call prep view: everything the agent needs in one screen.
 *
 * The raw answers are shown alongside the engine's verdict on purpose. The
 * engine's reading of an answer is lossy, and on the phone the agent wants what
 * the person actually said — not the subset that happened to feed a rule.
 */

/**
 * Booking status wording, phrased for the agent rather than the schema.
 *
 * `pending` is the one that matters: it means the prospect picked a time and
 * has NOT paid. Those rows are the follow-up queue — someone got far enough to
 * choose a slot — so the label says what to do about it rather than just
 * naming the state.
 */
const BOOKING_STATUS: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Pending — time held, not paid",
    className: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  },
  confirmed: {
    label: "Confirmed — paid",
    className: "bg-green-100 text-green-800 hover:bg-green-100",
  },
  completed: {
    label: "Completed",
    className: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-destructive/10 text-destructive hover:bg-destructive/10",
  },
  no_show: {
    label: "No show",
    className: "bg-destructive/10 text-destructive hover:bg-destructive/10",
  },
};

function formatMoney(cents: unknown, currency: unknown): string | null {
  if (typeof cents !== "number") return null;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: (typeof currency === "string" ? currency : "aud").toUpperCase(),
  }).format(cents / 100);
}

function formatWhen(value: unknown): string | null {
  if (typeof value !== "string" && !(value instanceof Date)) return null;
  const date = new Date(value as string);
  return Number.isNaN(date.getTime())
    ? null
    : format(date, "EEEE d MMM yyyy, HH:mm");
}

/**
 * The consultation slot and what has been paid for it.
 *
 * Rendered even when empty. "No booking yet" is information the agent acts on —
 * an eligible prospect with no slot is someone to chase — and hiding the card
 * would make that indistinguishable from a page that failed to load it.
 */
function BookingCard({
  booking,
  payment,
  prospectEmail,
}: {
  booking: Record<string, unknown> | null;
  payment: Record<string, unknown> | null;
  prospectEmail: string;
}) {
  const status = typeof booking?.status === "string" ? booking.status : null;
  const presentation = status ? BOOKING_STATUS[status] : null;
  const slot = formatWhen(booking?.scheduled_at);
  const amount = formatMoney(payment?.amount_cents, payment?.currency);
  const paidAt = formatWhen(payment?.paid_at);
  const joinUrl = typeof booking?.join_url === "string" ? booking.join_url : null;
  const inviteeEmail =
    typeof booking?.invitee_email === "string" ? booking.invitee_email : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Consultation</CardTitle>
        <p className="text-sm text-muted-foreground">
          A slot is held as soon as they pick a time; it is only confirmed once
          the fee is paid.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {!booking ? (
          <p className="text-sm text-muted-foreground">
            No consultation booked yet.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className={
                  presentation?.className ??
                  "bg-slate-100 text-slate-700 hover:bg-slate-100"
                }
              >
                {presentation?.label ?? status ?? "Unknown"}
              </Badge>
              {slot && <span className="text-sm font-medium">{slot}</span>}
            </div>

            <p className="text-sm text-muted-foreground">
              {amount
                ? `Paid ${amount}${paidAt ? ` on ${paidAt}` : ""}.`
                : "No payment recorded against this booking."}
            </p>


            {/* Shown only when it differs. Someone who booked with a work
                address having enquired from a personal one is the usual
                reason a booking cannot be matched to an enquiry by hand, and
                an agent about to email the wrong address needs to know. */}
            {inviteeEmail &&
              inviteeEmail.toLowerCase() !== prospectEmail.toLowerCase() && (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  Booked under a different email:{" "}
                  <span className="font-medium">{inviteeEmail}</span>. The
                  enquiry came from {prospectEmail}.
                </p>
              )}

            {joinUrl && (
              <a
                href={joinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm font-medium text-primary hover:underline"
              >
                Join link
              </a>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

const STAGE_LABELS: Record<ProspectStage, string> = {
  captured: "Captured",
  pre_screened: "Pre-screened",
  booked: "Booked",
  consulted: "Consulted",
  engaged: "Engaged",
  disqualified: "Disqualified",
};

function Flag({ label, value }: { label: string; value?: boolean | null }) {
  const tone =
    value == null
      ? "bg-muted text-muted-foreground border-border"
      : value
        ? "border-green-200 bg-green-100 text-green-700"
        : "border-destructive/20 bg-destructive/10 text-destructive";

  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <Badge variant="outline" className={`mt-1.5 ${tone}`}>
        {value == null ? "Not assessed" : value ? "Yes" : "No"}
      </Badge>
    </div>
  );
}

function ReasonList({
  title,
  items,
  icon: Icon,
  tone,
}: {
  title: string;
  items?: string[] | null;
  icon: typeof CheckCircle2;
  tone: string;
}) {
  if (!items?.length) return null;
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h4>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm">
            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Renders the free-form answer set without assuming any particular questions. */
function AnswerTable({ answers }: { answers: Record<string, unknown> }) {
  const rows = Object.entries(answers).filter(
    ([, v]) => v !== null && v !== undefined && v !== "",
  );
  if (!rows.length) {
    return (
      <p className="text-sm text-muted-foreground">No answers recorded.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <tbody>
          {rows.map(([key, value]) => (
            <tr key={key} className="border-b border-border/40 last:border-0">
              <td className="py-2 pr-4 align-top text-xs text-muted-foreground">
                {key}
              </td>
              <td className="py-2 align-top">
                {typeof value === "object"
                  ? JSON.stringify(value)
                  : String(value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ProspectDetail({
  prospectId,
  onBack,
  onStageChanged,
}: {
  prospectId: string;
  onBack: () => void;
  onStageChanged?: () => void;
}) {
  const [view, setView] = useState<ProspectPrepView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setView(await adminProspectService.getPrepView(prospectId));
      setError(null);
    } catch (err) {
      console.error("Failed to load prospect:", err);
      setError(err instanceof Error ? err.message : "Could not load prospect.");
    } finally {
      setLoading(false);
    }
  }, [prospectId]);

  useEffect(() => {
    load();
  }, [load]);

  const changeStage = async (stage: ProspectStage) => {
    setSaving(true);
    try {
      await adminProspectService.advanceStage(prospectId, stage);
      toast.success(`Stage set to ${STAGE_LABELS[stage]}`);
      await load();
      onStageChanged?.();
    } catch (err) {
      console.error("Failed to change stage:", err);
      toast.error(
        err instanceof Error ? err.message : "Could not update the stage.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !view) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error ?? "Prospect not found."}
        </div>
      </div>
    );
  }

  const { prospect, summary } = view;
  const engine = summary?.engine_result ?? null;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" />
        All prospects
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-sm font-semibold text-muted-foreground">
            {prospect.human_ref}
          </p>
          <h1 className="text-2xl font-bold text-foreground">
            {prospect.full_name}
          </h1>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <a
              href={`mailto:${prospect.email}`}
              className="flex items-center gap-1.5 hover:text-foreground"
            >
              <Mail className="h-3.5 w-3.5" />
              {prospect.email}
            </a>
            {prospect.phone && (
              <a
                href={`tel:${prospect.phone}`}
                className="flex items-center gap-1.5 hover:text-foreground"
              >
                <Phone className="h-3.5 w-3.5" />
                {prospect.phone}
              </a>
            )}
          </div>
        </div>

        <div className="min-w-52">
          <label className="text-xs uppercase tracking-wide text-muted-foreground">
            Stage
          </label>
          <Select
            value={prospect.stage}
            onValueChange={(v) => changeStage(v as ProspectStage)}
            disabled={saving}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROSPECT_STAGES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STAGE_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Flag label="Statutory eligible" value={prospect.statutory_eligible} />
        <Flag label="Client fit" value={prospect.client_fit} />
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Party
          </p>
          <p className="mt-1.5 text-sm font-medium capitalize">
            {prospect.party}
          </p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Came in via
          </p>
          {/* Which funnel produced this record. A partner-visa lead and an
              employer-sponsored one need different prep, and the party does not
              distinguish them — both are 'applicant'. */}
          <p className="mt-1.5 text-sm font-medium capitalize">
            {prospect.source?.replace(/_/g, " ") || "Unknown"}
          </p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Received
          </p>
          <p className="mt-1.5 text-sm font-medium">
            {prospect.created_at
              ? format(new Date(prospect.created_at), "d MMM yyyy, HH:mm")
              : "—"}
          </p>
        </div>
      </div>

      {engine && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Assessment</CardTitle>
            {engine.recommended_label && (
              <p className="text-sm text-muted-foreground">
                Strongest pathway: {engine.recommended_label}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-5">
            <ReasonList
              title="In their favour"
              items={engine.reasons}
              icon={CheckCircle2}
              tone="text-green-600"
            />
            <ReasonList
              title="Blockers"
              items={engine.blockers}
              icon={AlertTriangle}
              tone="text-destructive"
            />
            <ReasonList
              title="Ask on the call"
              items={engine.open_questions}
              icon={HelpCircle}
              tone="text-amber-600"
            />
            <ReasonList
              title="Sponsor findings"
              items={engine.sponsor_findings}
              icon={AlertTriangle}
              tone="text-amber-600"
            />
            {engine.engine_version && (
              // Rules change at least annually. Without the version, a past
              // verdict cannot be explained after a threshold moves.
              <p className="border-t border-border pt-3 text-xs text-muted-foreground">
                Assessed under rules {engine.engine_version}
                {engine.assessed_at &&
                  ` on ${format(new Date(engine.assessed_at), "d MMM yyyy")}`}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <BookingCard
        booking={summary?.booking ?? null}
        payment={summary?.payment ?? null}
        prospectEmail={prospect.email}
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Their answers</CardTitle>
          <p className="text-sm text-muted-foreground">
            Exactly as submitted, including questions the engine does not read.
          </p>
        </CardHeader>
        <CardContent>
          {summary?.answers ? (
            <AnswerTable answers={summary.answers} />
          ) : (
            <p className="text-sm text-muted-foreground">
              No answer set stored for this prospect.
            </p>
          )}
        </CardContent>
      </Card>

      {prospect.consent_text && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Consent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Stored verbatim — the wording shown is what makes it evidence. */}
            <p className="text-sm leading-relaxed text-muted-foreground">
              {prospect.consent_text}
            </p>
            {prospect.consent_at && (
              <p className="text-xs text-muted-foreground">
                Given {format(new Date(prospect.consent_at), "d MMM yyyy, HH:mm")}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
