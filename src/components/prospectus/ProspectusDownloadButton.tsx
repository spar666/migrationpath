import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Download, Loader2, CheckCircle } from "lucide-react";
import { useQuestionnaireStatus } from "@/hooks/useQuestionnaireStatus";
import { format, differenceInYears, parseISO } from "date-fns";

/**
 * Questionnaire answers are free-form (`[key: string]: unknown`) because the
 * questions are authored in FormLogicEditor, so every field read here has to be
 * narrowed rather than assumed.
 *
 * These return undefined for a missing OR wrong-typed answer, which is what the
 * `if (...)` guards around each block already expect. Casting to `any` would
 * compile just as well and would turn a stray string like "five years" into
 * silent NaN points on a document the prospect is handed.
 */
function asText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

interface PartnerSkills {
  hasPartnerSkills?: boolean;
  partnerOccupation?: string;
}

interface ProspectusDownloadButtonProps {
  userId: string;
  fullName: string;
  personaType: string;
  pointsScore: number;
}

export function ProspectusDownloadButton({
  userId,
  fullName,
  personaType,
  pointsScore,
}: ProspectusDownloadButtonProps) {
  const { hasCompletedQuestionnaire, questionnaireData, isLoading } = useQuestionnaireStatus(userId);
  const [isGenerating, setIsGenerating] = useState(false);

  // Don't render if questionnaire not completed
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-4">
          <div className="h-16 bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!hasCompletedQuestionnaire || !questionnaireData) {
    return null;
  }

  // Build points breakdown from questionnaire data
  const buildPointsBreakdown = () => {
    const breakdown: { category: string; detail: string; points: number }[] = [];

    // Age calculation
    const dateOfBirth = asText(questionnaireData.date_of_birth);
    if (dateOfBirth) {
      const age = differenceInYears(new Date(), parseISO(dateOfBirth));
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
    const englishTestType = asText(questionnaireData.english_test_type);
    if (englishTestType && questionnaireData.english_scores) {
      const testType = englishTestType.toUpperCase();
      let englishPoints = 0;
      let englishDetail = `${testType} - `;

      // Simplified scoring based on common patterns
      const englishScores = questionnaireData.english_scores as Record<string, number>;
      const scores = Object.values(englishScores || {});
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
    const years = asNumber(questionnaireData.years_experience);
    if (years !== undefined) {
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
        detail: `${years} years in ${questionnaireData.current_occupation}`,
        points: expPoints,
      });
    }

    // Partner skills (if applicable)
    const partnerSkills = questionnaireData.partner_skills as unknown as PartnerSkills;
    if (partnerSkills?.hasPartnerSkills) {
      breakdown.push({
        category: "Partner Skills",
        detail: partnerSkills.partnerOccupation || "Skilled partner",
        points: 5,
      });
    }

    // Placeholder for qualifications (would need additional data)
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

    // English improvement priority
    if (questionnaireData.english_scores) {
      const englishScores = questionnaireData.english_scores as Record<string, number>;
      const scores = Object.values(englishScores || {});
      const minScore = scores.length > 0 ? Math.min(...scores) : 0;

      if (questionnaireData.english_test_type === "PTE" && minScore < 79) {
        priorities.push({
          title: "Achieve Superior English (PTE 79+)",
          description: "Upgrading to Superior English adds 10 additional points. Focus on PTE Academic with targeted practice on weaker sections.",
        });
      } else if (questionnaireData.english_test_type === "IELTS" && minScore < 8) {
        priorities.push({
          title: "Achieve Superior English (IELTS 8+)",
          description: "Upgrading to Superior English adds 10 additional points. Consider PTE Academic as an alternative with faster results.",
        });
      }
    }

    // Skills assessment
    priorities.push({
      title: "Complete Skills Assessment",
      description: `Lodge your ${questionnaireData.current_occupation} skills assessment with the relevant assessing authority. This is mandatory before submitting an EOI.`,
    });

    // Persona-specific priorities
    if (personaType === "student" || personaType === "skilled") {
      priorities.push({
        title: "Submit Expression of Interest (EOI)",
        description: "Once your skills assessment is complete, submit your EOI through SkillSelect. Consider applying for State Nomination (190) for +5 points.",
      });
    }

    if (personaType === "onshore-skilled") {
      priorities.push({
        title: "Accumulate Australian Work Experience",
        description: "Each additional year of Australian work experience in your nominated occupation adds +5 points (up to 20 points maximum).",
      });
    }

    // Add more generic priorities
    priorities.push({
      title: "Explore State Nomination Options",
      description: "Research state nomination opportunities. Some states have priority lists that may fast-track your invitation. Regional areas offer additional pathways.",
    });

    return priorities;
  };

  // Build strategic summary based on persona
  const buildStrategicSummary = () => {
    const score = pointsScore;
    const name = fullName.split(" ")[0];

    let summary = `${name}, based on your assessment, you currently hold ${score} points toward Australian permanent residency. `;

    if (score >= 85) {
      summary += `This positions you in a strong category with high probability of receiving an invitation within 2-3 invitation rounds. Your focus should be on ensuring all documentation is prepared for a swift application once invited.`;
    } else if (score >= 75) {
      summary += `You are well-positioned for skilled migration, though competition at this points level means wait times may vary by occupation. Consider strategies to boost your score by 5-10 points to accelerate your timeline.`;
    } else if (score >= 65) {
      summary += `You meet the minimum points threshold, which is a solid foundation. However, current invitation trends favor higher point scores. We recommend focusing on the priority actions below to improve your competitive position.`;
    } else {
      summary += `While you're below the 65-point minimum threshold, there are clear pathways to bridge this gap. The priorities below outline the most effective strategies to reach and exceed the minimum requirement.`;
    }

    // Add persona-specific context
    switch (personaType) {
      case "student":
        summary += " As a student pathway candidate, your Australian qualifications and potential regional study bonus are key assets to leverage.";
        break;
      case "skilled":
        summary += " As a skilled professional, your overseas experience and qualifications form the foundation of your application.";
        break;
      case "onshore-skilled":
        summary += " Being onshore provides advantages including potential Australian work experience points and easier access to state nominations.";
        break;
      case "partner":
        summary += " Your partner's skills and qualifications can contribute additional points to strengthen your application.";
        break;
      case "employer":
        summary += " The employer-sponsored pathway offers a direct route to PR without relying on points, provided you meet sponsorship requirements.";
        break;
    }

    return summary;
  };

  const handleDownload = async () => {
    setIsGenerating(true);

    try {
      const prospectusProps = {
        fullName: fullName || "Migration Candidate",
        personaType: personaType,
        pointsScore: pointsScore,
        pointsBreakdown: buildPointsBreakdown(),
        priorities: buildPriorities(),
        strategicSummary: buildStrategicSummary(),
        generatedDate: format(new Date(), "MMMM d, yyyy"),
      };

      // Loaded on click, not at import. The PDF renderer and its fonts are
      // over a megabyte — statically importing it put that on the initial load
      // of every page for a button most visitors never press.
      const [{ pdf }, { MigrationProspectus }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./MigrationProspectus"),
      ]);

      const blob = await pdf(<MigrationProspectus {...prospectusProps} />).toBlob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `MigrationPath_Strategy_${fullName.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="overflow-hidden border-accent/20 bg-gradient-to-br from-accent/5 via-card to-card">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl gradient-gold flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-navy" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground">Strategy Prospectus</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
                <CheckCircle className="w-3 h-3" />
                Ready
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Your personalized migration strategy with points breakdown and action plan.
            </p>
            <Button
              onClick={handleDownload}
              disabled={isGenerating}
              variant="gold"
              size="sm"
              className="w-full sm:w-auto"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download Prospectus
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
