import React from "react";
import { CheckCircle2, AlertCircle, FileText, ExternalLink } from "lucide-react";
import { VisaType } from "@/types/migrationRules";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ChecklistItem {
  title: string;
  description: string;
  mandatory: boolean;
}

const CHECKLISTS: Record<string, ChecklistItem[]> = {
  "858": [
    { title: "Internationally Recognized Record", description: "Evidence of exceptional achievement in an eligible field.", mandatory: true },
    { title: "Current Prominence", description: "Evidence that you are still prominent in your field.", mandatory: true },
    { title: "Asset to Australia", description: "How your skills will benefit Australia (economically, socially, etc.).", mandatory: true },
    { title: "Nominator", description: "An Australian citizen or permanent resident with a national reputation in your field.", mandatory: true },
  ],
  "820": [
    { title: "Identity Documents", description: "Passports, birth certificates, and national ID cards.", mandatory: true },
    { title: "Evidence of Relationship", description: "Evidence of your marriage or de facto relationship.", mandatory: true },
    { title: "Financial Aspects", description: "Joint accounts, shared assets, or financial commitments.", mandatory: true },
    { title: "Nature of Household", description: "Evidence of shared living arrangements.", mandatory: true },
    { title: "Social Aspects", description: "Evidence that others recognize your relationship.", mandatory: true },
  ],
  "309": [
    { title: "Identity Documents", description: "Passports, birth certificates, and national ID cards.", mandatory: true },
    { title: "Evidence of Relationship", description: "Evidence of your marriage or de facto relationship.", mandatory: true },
    { title: "History of Relationship", description: "How, when and where you first met.", mandatory: true },
  ],
  "482": [
    { title: "Nomination Approval", description: "An approved nomination by your employer.", mandatory: true },
    { title: "Skill Assessment", description: "Evidence of skills for your nominated occupation.", mandatory: true },
    { title: "English Proficiency", description: "Proof of competent English unless exempt.", mandatory: true },
    { title: "Salary & Employment", description: "Contract showing salary meets the TSMIT threshold.", mandatory: true },
  ],
  "186": [
    { title: "Direct Entry Stream", description: "Evidence of 3 years of relevant work experience.", mandatory: true },
    { title: "Skills Assessment", description: "Positive skills assessment in your occupation.", mandatory: true },
    { title: "Employer Nomination", description: "Nomination from an Australian employer.", mandatory: true },
  ],
};

interface ChecklistViewProps {
  visaId: VisaType;
}

export function ChecklistView({ visaId }: ChecklistViewProps) {
  const items = CHECKLISTS[visaId] || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <FileText className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-navy">Eligibility Checklist</h2>
          <p className="text-muted-foreground">Visa Subclass {visaId} is not points-based. Meet these criteria to be eligible.</p>
        </div>
      </div>

      <div className="grid gap-4">
        {items.map((item, index) => (
          <Card key={index} className="border-border hover:border-primary/20 transition-colors">
            <CardContent className="p-5 flex gap-4">
              <div className="mt-1">
                {item.mandatory ? (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                )}
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-navy">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                {item.mandatory && (
                  <span className="inline-block text-[10px] font-bold tracking-wider uppercase text-success bg-success/10 px-2 py-0.5 rounded">
                    Mandatory
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-muted/50 rounded-xl p-6 border border-border">
        <h4 className="font-semibold text-navy mb-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Next Steps
        </h4>
        <p className="text-sm text-muted-foreground mb-4">
          This checklist provides a high-level overview. For a detailed assessment and document review, please book a consultation with our migration experts.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button className="btn-elite gap-2">
            Book Consultation
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" className="gap-2">
            View Official Rules
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
