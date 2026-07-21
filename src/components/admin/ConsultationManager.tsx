import { useState, useEffect } from "react";
import { Calendar, FileQuestion, Loader2, RefreshCw, Search, User, ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/apiClient";
import { format } from "date-fns";

interface Questionnaire {
  id: string;
  user_id: string;
  responses: Record<string, any>;
  created_at: string;
  user?: {
    id: string;
    email: string;
    full_name: string;
  };
  profile?: {
    full_name: string;
    email: string;
    phone: string;
    nationality: string;
  } | null;
}

export function ConsultationManager() {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Questionnaire | null>(null);

  const fetchQuestionnaires = async () => {
    setLoading(true);
    try {
      const raw = await apiClient.get<any>("/consultation/questionnaire");
      const list = raw?.data?.data ?? raw?.data ?? (Array.isArray(raw) ? raw : []);
      setQuestionnaires(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to fetch questionnaires:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestionnaires();
  }, []);

  const filtered = questionnaires.filter((q) => {
    const name = q.profile?.full_name || q.user?.full_name || "";
    const email = q.profile?.email || q.user?.email || "";
    const qry = search.toLowerCase();
    return name.toLowerCase().includes(qry) || email.toLowerCase().includes(qry) || q.user_id.toLowerCase().includes(qry);
  });

  const formatScores = (scores: Record<string, number> | null | undefined) => {
    if (!scores || typeof scores !== "object") return null;
    return Object.entries(scores)
      .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`)
      .join("  ·  ");
  };

  const formatArray = (arr: string[] | null | undefined) => {
    if (!arr || !Array.isArray(arr) || arr.length === 0) return null;
    return arr.join(", ");
  };

  if (selected) {
    const r = selected.responses || {};
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setSelected(null)} className="gap-2">
          <ChevronLeft className="h-4 w-4" /> Back to All
        </Button>
        {/* Contact Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Client Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Name", value: selected.profile?.full_name || selected.user?.full_name },
              { label: "Email", value: selected.profile?.email || selected.user?.email },
              { label: "Phone", value: selected.profile?.phone },
              { label: "Nationality", value: selected.profile?.nationality },
              { label: "User ID", value: selected.user_id },
            ].filter((f) => f.value).map((field) => (
              <div key={field.label}>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{field.label}</p>
                <p className="text-sm font-medium">{String(field.value)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Questionnaire Responses Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileQuestion className="h-5 w-5" />
                Questionnaire Responses
              </CardTitle>
              <Badge variant="outline">{selected.profile?.full_name || selected.user?.full_name || selected.user_id.slice(0, 8)}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Submitted {selected.created_at ? format(new Date(selected.created_at), "PPpp") : "N/A"}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Occupation", value: r.current_occupation },
              { label: "Years Experience", value: r.years_experience },
              { label: "English Test", value: r.english_test_type },
              { label: "English Scores", value: formatScores(r.english_scores) },
              { label: "Date of Birth", value: r.date_of_birth },
              { label: "Marital Status", value: r.marital_status },
              { label: "Has Children", value: r.has_children != null ? (r.has_children ? "Yes" : "No") : null },
              { label: "Partner Skills", value: formatArray(r.partner_skills) },
              { label: "Health Issues", value: r.has_health_issues != null ? (r.has_health_issues ? "Yes" : "No") : null },
              { label: "Criminal Record", value: r.has_criminal_record != null ? (r.has_criminal_record ? "Yes" : "No") : null },
              { label: "Visa Refusal", value: r.visa_refusal_history != null ? (r.visa_refusal_history ? "Yes" : "No") : null },
            ].filter((f) => f.value != null && f.value !== "").map((field) => (
              <div key={field.label}>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{field.label}</p>
                <p className="text-sm font-medium">{String(field.value)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Consultation Questionnaires</h1>
          <p className="text-sm text-muted-foreground">
            View all client pre-session questionnaires
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchQuestionnaires} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, email or user ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileQuestion className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p>No questionnaires found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => {
            const r = q.responses || {};
            return (
              <Card
                key={q.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setSelected(q)}
              >
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {q.profile?.full_name || q.user?.full_name || "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {q.profile?.email || q.user?.email || q.user_id.slice(0, 8)} &middot;{" "}
                        {r.current_occupation || "No occupation"} &middot;{" "}
                        {q.created_at ? format(new Date(q.created_at), "PP") : "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.marital_status && (
                      <Badge variant="secondary" className="text-xs">{r.marital_status}</Badge>
                    )}
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
