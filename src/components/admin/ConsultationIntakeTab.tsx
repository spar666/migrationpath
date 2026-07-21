import { useState, useEffect } from "react";
import {
  Briefcase,
  Users,
  Shield,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  FileQuestion,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiClient } from "@/lib/apiClient";

interface EnglishScores {
  listening?: number;
  reading?: number;
  writing?: number;
  speaking?: number;
  overall?: number;
}

interface PartnerSkills {
  occupation?: string;
  years_experience?: number;
  english_test_type?: string;
  english_scores?: EnglishScores;
}

interface QuestionnaireData {
  id: string;
  current_occupation: string;
  years_experience: number | null;
  english_test_type: string | null;
  english_scores: EnglishScores | null;
  date_of_birth: string;
  marital_status: string | null;
  has_children: boolean | null;
  partner_skills: PartnerSkills | null;
  has_health_issues: boolean | null;
  has_criminal_record: boolean | null;
  visa_refusal_history: boolean | null;
  submitted_at: string | null;
}

interface ConsultationIntakeTabProps {
  userId: string;
}

const ENGLISH_TEST_LABELS: Record<string, string> = {
  ielts: "IELTS",
  pte: "PTE Academic",
  toefl: "TOEFL iBT",
  oet: "OET",
  cambridge: "Cambridge C1/C2",
  none: "No test",
};

const MARITAL_STATUS_LABELS: Record<string, string> = {
  single: "Single",
  married: "Married",
  de_facto: "De Facto",
  divorced: "Divorced",
  widowed: "Widowed",
};

export function ConsultationIntakeTab({ userId }: ConsultationIntakeTabProps) {
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestionnaire = async () => {
      setLoading(true);
      try {
        const raw = await apiClient.get<any>(`/consultation/questionnaire/user/${userId}`);
        const data = Array.isArray(raw) ? raw[0] : raw?.data?.[0] ?? raw;
        if (data) {
          // Cast the JSON fields to proper types
          setQuestionnaire({
            ...data,
            english_scores: (typeof data.english_scores === 'string' ? JSON.parse(data.english_scores) : data.english_scores) as EnglishScores | null,
            partner_skills: (typeof data.partner_skills === 'string' ? JSON.parse(data.partner_skills) : data.partner_skills) as PartnerSkills | null,
          });
        }
      } catch (err) {
        console.error("Error fetching questionnaire:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestionnaire();
  }, [userId]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const calculateAge = (dob: string) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const renderBooleanBadge = (value: boolean | null, label: string) => {
    if (value === null) return null;
    return value ? (
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="h-3 w-3" />
        {label}
      </Badge>
    ) : (
      <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 gap-1">
        <CheckCircle2 className="h-3 w-3" />
        No {label}
      </Badge>
    );
  };

  const renderEnglishScores = (scores: EnglishScores | null | undefined, testType: string | null | undefined) => {
    if (!scores || !testType || testType === "none") return null;
    return (
      <div className="grid grid-cols-3 gap-2 mt-2 sm:grid-cols-5">
        {["listening", "reading", "writing", "speaking", "overall"].map((skill) => {
          const score = scores[skill as keyof EnglishScores];
          return (
            <div key={skill} className="text-center p-2 rounded bg-muted/50">
              <p className="text-xs text-muted-foreground capitalize">{skill}</p>
              <p className="font-semibold text-sm">{score ?? "—"}</p>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!questionnaire) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
        <h4 className="font-medium text-foreground">No Intake Form Submitted</h4>
        <p className="text-sm text-muted-foreground mt-1">
          This user has not completed the pre-session questionnaire yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Submitted {questionnaire.submitted_at ? formatDate(questionnaire.submitted_at) : "—"}
          </span>
        </div>
      </div>

      {/* Professional Section */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary" />
            Professional Background
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Occupation</p>
              <p className="font-medium">{questionnaire.current_occupation}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Experience</p>
              <p className="font-medium">
                {questionnaire.years_experience !== null
                  ? `${questionnaire.years_experience}+ years`
                  : "Not specified"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Date of Birth</p>
              <p className="font-medium">
                {formatDate(questionnaire.date_of_birth)}{" "}
                <span className="text-muted-foreground">
                  (Age: {calculateAge(questionnaire.date_of_birth)})
                </span>
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">English Test</p>
              <p className="font-medium">
                {questionnaire.english_test_type
                  ? ENGLISH_TEST_LABELS[questionnaire.english_test_type] || questionnaire.english_test_type
                  : "Not specified"}
              </p>
            </div>
          </div>
          {renderEnglishScores(questionnaire.english_scores, questionnaire.english_test_type)}
        </CardContent>
      </Card>

      {/* Personal Section */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Marital Status</p>
              <p className="font-medium">
                {questionnaire.marital_status
                  ? MARITAL_STATUS_LABELS[questionnaire.marital_status] || questionnaire.marital_status
                  : "Not specified"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Dependents</p>
              <p className="font-medium">
                {questionnaire.has_children ? "Has children" : "No children"}
              </p>
            </div>
          </div>

          {/* Partner Skills */}
          {questionnaire.partner_skills && (
            <>
              <Separator className="my-3" />
              <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                <h5 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
                    Partner Skills
                  </Badge>
                </h5>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Partner&apos;s Occupation</p>
                    <p className="font-medium">
                      {questionnaire.partner_skills.occupation || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Partner&apos;s Experience</p>
                    <p className="font-medium">
                      {questionnaire.partner_skills.years_experience !== undefined
                        ? `${questionnaire.partner_skills.years_experience}+ years`
                        : "Not specified"}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-muted-foreground">Partner&apos;s English Test</p>
                    <p className="font-medium">
                      {questionnaire.partner_skills.english_test_type
                        ? ENGLISH_TEST_LABELS[questionnaire.partner_skills.english_test_type] ||
                          questionnaire.partner_skills.english_test_type
                        : "Not specified"}
                    </p>
                  </div>
                </div>
                {renderEnglishScores(
                  questionnaire.partner_skills.english_scores,
                  questionnaire.partner_skills.english_test_type
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Legal Section */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Legal & Health Declarations
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {renderBooleanBadge(questionnaire.has_health_issues, "Health Concerns")}
            {renderBooleanBadge(questionnaire.has_criminal_record, "Criminal History")}
            {renderBooleanBadge(questionnaire.visa_refusal_history, "Visa Refusals")}
          </div>

          {(questionnaire.has_health_issues ||
            questionnaire.has_criminal_record ||
            questionnaire.visa_refusal_history) && (
            <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  This client has flagged items that may require additional discussion during the consultation.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
