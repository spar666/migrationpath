import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Download,
  Loader2,
  CheckCircle,
  Send,
  Save,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { badgeVariants } from "@/components/ui/badge-variants";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import { format, differenceInYears, parseISO } from "date-fns";


/**
 * The consultation questionnaire as `/consultation/questionnaire/:userId`
 * returns it.
 *
 * Was `Tables<"consultation_questionnaires">` — a Supabase generated-type
 * helper left behind when the backend moved to NestJS, so it referenced a name
 * that no longer exists anywhere. The endpoint returns free-form questionnaire
 * JSON whose keys are authored in FormLogicEditor, so an index signature is an
 * honest description rather than a placeholder.
 */
type QuestionnaireData = Record<string, any>;
type EnglishScores = Record<string, number | string | null>;
interface PartnerSkills {
  occupation?: string;
}

interface AdminStrategyPanelProps {
  userId: string;
  userName: string;
  personaType: string | null;
  pointsScore: number | null;
  consultationNotes: string | null;
  strategyDeliveredAt: string | null;
  onUpdate: () => void;
}

export function AdminStrategyPanel({
  userId,
  userName,
  personaType,
  pointsScore,
  consultationNotes: initialNotes,
  strategyDeliveredAt,
  onUpdate,
}: AdminStrategyPanelProps) {
  const [notes, setNotes] = useState(initialNotes || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireData | null>(null);
  const [loadingQuestionnaire, setLoadingQuestionnaire] = useState(true);

  const fetchQuestionnaire = useCallback(async () => {
    setLoadingQuestionnaire(true);
    try {
      const data = await apiClient.get<any>(`/consultation/questionnaire/${userId}`);
      if (data) {
        setQuestionnaire(data as QuestionnaireData);
      }
    } catch (error) {
      console.error("Error fetching questionnaire:", error);
    } finally {
      setLoadingQuestionnaire(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchQuestionnaire();
  }, [fetchQuestionnaire]);

  const handleSaveNotes = async () => {
    setIsSaving(true);
    try {
      await apiClient.put(`/users/${userId}/notes`, { consultation_notes: notes });
      toast.success("Consultation notes saved");
      onUpdate();
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes");
    } finally {
      setIsSaving(false);
    }
  };

  // Build points breakdown from questionnaire
  const buildPointsBreakdown = () => {
    const breakdown: { category: string; detail: string; points: number }[] = [];

    if (!questionnaire) return breakdown;

    // Age calculation
    if (questionnaire.date_of_birth) {
      const age = differenceInYears(new Date(), parseISO(questionnaire.date_of_birth));
      let agePoints = 0;
      let ageDetail = "";

      if (age >= 18 && age <= 24) {
        agePoints = 25;
        ageDetail = `${age} years old`;
      } else if (age >= 25 && age <= 32) {
        agePoints = 30;
        ageDetail = `${age} years old (optimal range)`;
      } else if (age >= 33 && age <= 39) {
        agePoints = 25;
        ageDetail = `${age} years old`;
      } else if (age >= 40 && age <= 44) {
        agePoints = 15;
        ageDetail = `${age} years old`;
      } else if (age >= 45 && age <= 49) {
        agePoints = 0;
        ageDetail = `${age} years old`;
      }

      breakdown.push({ category: "Age", detail: ageDetail, points: agePoints });
    }

    // English proficiency
    if (questionnaire.english_test_type && questionnaire.english_scores) {
      const testType = questionnaire.english_test_type.toUpperCase();
      let englishPoints = 0;
      let englishDetail = `${testType} - `;

      const scores = Object.values(questionnaire.english_scores).filter((s): s is number => typeof s === "number");
      const minScore = scores.length > 0 ? Math.min(...scores) : 0;

      if (testType === "PTE") {
        if (minScore >= 79) {
          englishPoints = 20;
          englishDetail += "Superior (79+)";
        } else if (minScore >= 65) {
          englishPoints = 10;
          englishDetail += "Proficient (65+)";
        } else if (minScore >= 50) {
          englishPoints = 0;
          englishDetail += "Competent (50+)";
        }
      } else if (testType === "IELTS") {
        if (minScore >= 8) {
          englishPoints = 20;
          englishDetail += "Superior (8+)";
        } else if (minScore >= 7) {
          englishPoints = 10;
          englishDetail += "Proficient (7+)";
        } else if (minScore >= 6) {
          englishPoints = 0;
          englishDetail += "Competent (6+)";
        }
      }

      breakdown.push({ category: "English Proficiency", detail: englishDetail, points: englishPoints });
    }

    // Work experience
    if (questionnaire.years_experience) {
      const years = questionnaire.years_experience;
      let expPoints = 0;

      if (years >= 8) {
        expPoints = 15;
      } else if (years >= 5) {
        expPoints = 10;
      } else if (years >= 3) {
        expPoints = 5;
      }

      breakdown.push({
        category: "Overseas Work Experience",
        detail: `${years} years in ${questionnaire.current_occupation}`,
        points: expPoints,
      });
    }

    // Partner skills
    const partnerSkills = questionnaire.partner_skills as unknown as PartnerSkills;
    if (partnerSkills?.occupation) {
      breakdown.push({
        category: "Partner Skills",
        detail: partnerSkills.occupation,
        points: 5,
      });
    }

    // Placeholder for qualifications
    breakdown.push({
      category: "Qualifications",
      detail: "Australian/Overseas degree",
      points: 15,
    });

    return breakdown;
  };

  // Build priorities based on persona and score
  const buildPriorities = () => {
    const priorities: { title: string; description: string }[] = [];

    if (questionnaire?.english_scores) {
      const scores = Object.values(questionnaire.english_scores).filter((s): s is number => typeof s === "number");
      const minScore = scores.length > 0 ? Math.min(...scores) : 0;

      if (questionnaire.english_test_type === "pte" && minScore < 79) {
        priorities.push({
          title: "Achieve Superior English (PTE 79+)",
          description: "Upgrading to Superior English adds 10 additional points. Focus on PTE Academic with targeted practice.",
        });
      } else if (questionnaire.english_test_type === "ielts" && minScore < 8) {
        priorities.push({
          title: "Achieve Superior English (IELTS 8+)",
          description: "Upgrading to Superior English adds 10 additional points. Consider PTE Academic as an alternative.",
        });
      }
    }

    priorities.push({
      title: "Complete Skills Assessment",
      description: `Lodge your ${questionnaire?.current_occupation || "nominated occupation"} skills assessment with the relevant assessing authority.`,
    });

    priorities.push({
      title: "Submit Expression of Interest (EOI)",
      description: "Submit your EOI through SkillSelect. Consider applying for State Nomination (190) for +5 points.",
    });

    priorities.push({
      title: "Explore State Nomination Options",
      description: "Research state nomination opportunities. Some states have priority lists that may fast-track your invitation.",
    });

    priorities.push({
      title: "Gather Supporting Documents",
      description: "Prepare certified copies of all qualifications, employment references, and identity documents.",
    });

    return priorities;
  };

  // Build strategic summary
  const buildStrategicSummary = () => {
    const score = pointsScore || 0;
    const name = userName.split(" ")[0];

    let summary = `${name}, based on your assessment and our consultation, you currently hold ${score} points toward Australian permanent residency. `;

    if (score >= 85) {
      summary += `This positions you in a strong category with high probability of receiving an invitation within 2-3 invitation rounds.`;
    } else if (score >= 75) {
      summary += `You are well-positioned for skilled migration, though competition at this points level means wait times may vary by occupation.`;
    } else if (score >= 65) {
      summary += `You meet the minimum points threshold. We recommend focusing on the priority actions to improve your competitive position.`;
    } else {
      summary += `While below the 65-point minimum, there are clear pathways to bridge this gap through the priorities outlined.`;
    }

    return summary;
  };

  const handleGenerateAndDownload = async () => {
    setIsGenerating(true);

    try {
      // Save notes and status
      await apiClient.put(`/users/${userId}/strategy`, {
        consultation_notes: notes,
        strategy_delivered_at: new Date().toISOString(),
      });

      // Get dashboard URL
      const dashboardUrl = `${window.location.origin}/dashboard`;

      const pdfProps = {
        fullName: userName || "Migration Candidate",
        personaType: personaType || "skilled",
        pointsScore: pointsScore || 0,
        pointsBreakdown: buildPointsBreakdown(),
        priorities: buildPriorities(),
        strategicSummary: buildStrategicSummary(),
        consultationNotes: notes,
        generatedDate: format(new Date(), "MMMM d, yyyy"),
        dashboardUrl,
      };

      // Same reason as the prospectus button: the renderer is only worth
      // downloading once an agent actually asks for the document.
      const [{ pdf }, { FinalizedStrategyPDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/prospectus/FinalizedStrategyPDF"),
      ]);

      const blob = await pdf(<FinalizedStrategyPDF {...pdfProps} />).toBlob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `MigrationPath_Strategy_${userName.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      toast.success("Strategy PDF generated and status updated");
      onUpdate();
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  const hasQuestionnaire = !loadingQuestionnaire && questionnaire !== null;

  return (
    <Card className="border-accent/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg gradient-gold flex items-center justify-center">
              <FileText className="w-5 h-5 text-navy" />
            </div>
            <div>
              <CardTitle className="text-base">Post-Consultation Strategy</CardTitle>
              <CardDescription>Finalize and deliver the migration strategy</CardDescription>
            </div>
          </div>
          {strategyDeliveredAt && (
            <Badge className="bg-success/15 text-success border-success/30 gap-1">
              <CheckCircle className="w-3 h-3" />
              Delivered {format(new Date(strategyDeliveredAt), "MMM d")}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Consultation Notes Editor */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="consultation-notes" className="text-sm font-medium">
              Consultation Notes
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveNotes}
              disabled={isSaving || notes === initialNotes}
              className="h-8 gap-1.5"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Save Draft
            </Button>
          </div>
          <Textarea
            id="consultation-notes"
            placeholder="Enter your consultation notes here. These will be included in the finalized strategy PDF sent to the client..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={6}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Include key discussion points, recommended pathways, and personalized advice from your call.
          </p>
        </div>

        <Separator />

        {/* Generate & Send */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4 text-accent" />
            <span>
              {hasQuestionnaire
                ? "Ready to generate strategy PDF with questionnaire data"
                : "No questionnaire data available - PDF will use profile data only"}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleGenerateAndDownload}
              disabled={isGenerating || !notes.trim()}
              variant="gold"
              className="flex-1 gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Finalize Strategy PDF
                </>
              )}
            </Button>
          </div>

          {!notes.trim() && (
            <p className="text-xs text-amber-600">
              Please add consultation notes before generating the strategy PDF.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
