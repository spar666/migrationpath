import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GraduationCap, Clock, MapPin, Star, Bookmark, FileText, Briefcase, Loader2, Zap, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConsultationCTA } from "@/components/common/ConsultationCTA";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { SaveProgressModal } from "./SaveProgressModal";
import { courseService } from "@/services/courseService";
import { authService } from "@/services/authService";
import { userProgressService } from "@/services/userProgressService";

interface CourseData {
  id?: string;
  courseName: string;
  university: string;
  anzscoCode: string;
  occupation: string;
  duration?: string;
  qualification: string;
  isRegional?: boolean;
  annualFees?: number;
  visaSubclasses?: string[];
}

interface PathwayPreviewSheetProps {
  isOpen: boolean;
  onClose: () => void;
  course: CourseData | null;
  userPoints?: number;
}

const roadmapSteps = [
  { step: 1, label: "Study", description: "Complete your course", icon: GraduationCap },
  { step: 2, label: "485 Visa", description: "Graduate work rights", icon: FileText },
  { step: 3, label: "Skilled PR", description: "Permanent residency", icon: Briefcase },
];

export function PathwayPreviewSheet({
  isOpen,
  onClose,
  course,
  userPoints = 65,
}: PathwayPreviewSheetProps) {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [pathwayData, setPathwayData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPathwayDetails = async () => {
    if (!course?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await courseService.getPathwayDetails(course.id);
      setPathwayData(data);
    } catch (err) {
      console.error("Failed to load pathway details:", err);
      setError("Failed to load pathway details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && course?.id) {
      fetchPathwayDetails();
    } else if (!isOpen) {
      setPathwayData(null);
      setError(null);
    }
  }, [isOpen, course?.id]);

  if (!course) return null;

  const basePoints = pathwayData?.baseProfilePoints ?? userPoints;
  const estimatedPoints = pathwayData?.estimatedPoints ?? (basePoints + (course.isRegional ? 5 : 0));
  const isLoggedIn = authService.isAuthenticated();

  const handleSave = async () => {
    if (isLoggedIn && course) {
      try {
        await userProgressService.createProgress({
          title: `${course.occupation} — ${course.courseName}`,
          current_step: 'view_details',
          anzsco_code: course.anzscoCode,
          calculated_points: estimatedPoints,
          data: {
            courseName: course.courseName,
            university: course.university,
            duration: course.duration,
            qualification: course.qualification,
            isRegional: course.isRegional,
            occupation: course.occupation,
            annualFees: course.annualFees,
            visaSubclasses: course.visaSubclasses,
            pathwayData,
          },
        });
      } catch (error) {
        console.error("Error saving progress:", error);
      }
      onClose();
    } else {
      setShowSaveModal(true);
    }
  };

  const getStepIcon = (step: number, label: string) => {
    const l = (label || "").toLowerCase();
    if (l.includes("study") || l.includes("course") || step === 1) return GraduationCap;
    if (l.includes("485") || l.includes("visa") || l.includes("work") || step === 2) return FileText;
    if (l.includes("pr") || l.includes("permanent") || l.includes("skilled") || step === 3) return Briefcase;
    return GraduationCap;
  };

  const stepsToRender = pathwayData?.roadmap || roadmapSteps;

  return (
    <>
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[92vh] flex flex-col">
          {/* Handle indicator */}
          <div className="mx-auto w-12 h-1.5 shrink-0 rounded-full bg-navy/15 mt-3 mb-1" />

          {/* Fixed Header */}
          <DrawerHeader className="shrink-0 pb-4 border-b border-navy/10 px-5">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-navy/8 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5 text-navy" />
                </div>
                <div className="flex-1 min-w-0">
                  <DrawerTitle className="text-lg font-bold text-navy leading-tight">
                    {course.courseName}
                  </DrawerTitle>
                  <DrawerDescription className="text-sm text-navy-muted mt-1">
                    {course.university}
                  </DrawerDescription>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm text-navy-muted">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>{course.duration}</span>
                </div>
                <span>•</span>
                <span>{course.qualification}</span>
              </div>

              {course.isRegional && (
                <Badge className="border-0 bg-gold text-navy w-fit">
                  <MapPin className="mr-1 h-3 w-3" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    Regional +5 Points
                  </span>
                </Badge>
              )}
            </div>
          </DrawerHeader>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 space-y-5">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
                <p className="text-sm text-red-600 font-medium mb-1">{error}</p>
                <Button
                  variant="link"
                  size="sm"
                  className="text-red-700 font-semibold p-0 h-auto"
                  onClick={fetchPathwayDetails}
                >
                  Retry loading details
                </Button>
              </div>
            )}

            {/* Points Summary Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-gold/25 bg-gold/5 p-5 relative overflow-hidden"
            >
              {isLoading && (
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-gold" />
                </div>
              )}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center">
                  <Star className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-gold-dark">
                    Points Summary
                  </p>
                  <p className="text-sm text-navy-muted">
                    This course + your profile
                  </p>
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gold-dark">
                  {estimatedPoints}
                </span>
                <span className="text-base text-navy-muted">
                  Est. Points
                </span>
              </div>

              {/* Points breakdown */}
              <div className="mt-3 pt-3 border-t border-gold/15 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-navy-muted">Base profile</span>
                  <span className="font-semibold text-navy">{basePoints}</span>
                </div>
                {course.isRegional && (
                  <div className="flex justify-between text-sm">
                    <span className="text-navy-muted">Regional bonus</span>
                    <span className="font-semibold text-gold-dark">+5</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Roadmap Timeline - Horizontal */}
            <div className="space-y-3 relative">
              {isLoading && !pathwayData && (
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center z-20">
                  <Loader2 className="w-6 h-6 animate-spin text-navy" />
                </div>
              )}
              <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-glacier-dark">
                Your Roadmap
              </h3>

              <div className="flex items-start justify-between">
                {stepsToRender.map((step: any, index: number) => {
                  const Icon = getStepIcon(step.step, step.label);
                  return (
                    <div key={step.step || index} className="flex items-center flex-1">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "w-11 h-11 rounded-full flex items-center justify-center text-sm",
                            index === 0
                              ? "gradient-navy text-white shadow-md"
                              : "bg-navy/8 text-navy-muted"
                          )}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="mt-1.5 text-xs font-semibold text-center text-navy">
                          {step.label}
                        </span>
                        <span className="text-[10px] text-navy-muted text-center max-w-[80px]">
                          {step.description}
                        </span>
                      </div>
                      {index < stepsToRender.length - 1 && (
                        <div className="flex-1 h-0.5 bg-navy/10 mx-1.5 -mt-5" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Course Details */}
            <div className="rounded-2xl bg-navy/[0.03] border border-navy/8 p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-glacier-dark">
                Course Details
              </h3>

              <div className="space-y-2.5">
                {[
                  { label: "ANZSCO Code", value: course.anzscoCode, mono: true },
                  { label: "Occupation", value: course.occupation },
                  { label: "Qualification", value: course.qualification },
                  { label: "Duration", value: course.duration },
                  { label: "Location", value: course.isRegional ? "Regional" : "Metropolitan" },
                  ...(course.annualFees ? [{ label: "Annual Fees", value: `A$${course.annualFees.toLocaleString()}` }] : []),
                ].map((item, i) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm py-0.5">
                      <span className="text-navy-muted">{item.label}</span>
                      <span className={cn(
                        "font-semibold text-navy text-right max-w-[55%]",
                        item.mono && "font-mono"
                      )}>
                        {item.value}
                      </span>
                    </div>
                    {i < 5 && <div className="h-px bg-navy/6 mt-2.5" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Visa Pathways */}
            <div className="rounded-2xl bg-glacier/5 border border-glacier/20 p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-glacier-dark">
                Potential Visa Pathways
              </h3>
              <div className="flex flex-wrap gap-2">
                {(pathwayData?.visaSubclasses || course.visaSubclasses || ["189", "190", "491"]).map((subclass: string) => {
                  const visaNames: Record<string, string> = {
                    "189": "189 Skilled Independent",
                    "190": "190 State Nominated",
                    "491": "491 Regional",
                  };
                  // Strip anything like "Skilled Independent" if it's already there to avoid duplicates
                  const cleanedSubclass = subclass.split(" ")[0];
                  const displayName = visaNames[cleanedSubclass] || subclass;
                  return (
                    <span
                      key={subclass}
                      className="inline-flex items-center rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-navy border border-navy/10"
                    >
                      {displayName}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Invitation History */}
            {isLoading && !pathwayData ? (
              <div className="flex flex-col items-center justify-center py-6 text-navy/40">
                <Loader2 className="h-5 w-5 animate-spin mb-2 text-gold" />
                <span className="text-xs">Loading invitation history...</span>
              </div>
            ) : pathwayData?.invitationHistory && pathwayData.invitationHistory.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-glacier-dark">
                  Recent Invitation Rounds
                </h3>
                <div className="space-y-3">
                  {pathwayData.invitationHistory.map((invitation: any) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between rounded-xl border border-navy/10 bg-white p-4 shadow-sm hover:border-glacier/30 transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
                          <Zap className="h-5 w-5 text-gold" />
                        </div>
                        <div>
                          <p className="font-semibold text-navy text-sm">
                            Visa {invitation.visa_class}
                          </p>
                          <p className="text-xs text-navy-muted">
                            {invitation.state} • {invitation.days_ago === 0 ? "Today" : `${invitation.days_ago} days ago`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-gold/10 px-3 py-1.5 rounded-lg border border-gold/20">
                        <Award className="h-4 w-4 text-gold-dark" />
                        <span className="text-sm font-bold text-gold-dark">
                          {invitation.points} pts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : pathwayData && (!pathwayData.invitationHistory || pathwayData.invitationHistory.length === 0) ? (
              <div className="rounded-2xl border border-dashed border-navy/10 bg-navy/[0.01] p-5 text-center">
                <p className="text-sm text-navy-muted">
                  No recent invitation rounds recorded for this occupation.
                </p>
              </div>
            ) : null}
          </div>

          {/* Fixed Footer CTA */}
          <div className="shrink-0 space-y-2 border-t border-navy/10 bg-white p-4 pb-safe">
            <ConsultationCTA />
            <Button
              variant="outline"
              onClick={handleSave}
              className="w-full h-11 text-sm font-semibold rounded-xl"
            >
              <Bookmark className="mr-2 h-4 w-4" />
              Save to My Migration Path
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      <SaveProgressModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        course={course}
      />
    </>
  );
}
