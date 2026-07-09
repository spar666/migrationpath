import { useState } from "react";
import { MapPin, Clock, GraduationCap, ArrowRight } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PathwayPreviewDrawer } from "@/components/course/PathwayPreviewDrawer";
import { PathwayPreviewSheet } from "@/components/course/PathwayPreviewSheet";
import { useIsMobile } from "@/hooks/use-mobile";

interface CourseCardProps {
  id?: string;
  courseName: string;
  university: string;
  anzscoCode: string;
  occupation: string;
  duration?: string;
  qualification: string;
  isRegional?: boolean;
  imageUrl?: string;
  annualFees?: number;
  visaSubclasses?: string[];
}

export function CourseCard({
  id,
  courseName,
  university,
  anzscoCode,
  occupation,
  duration,
  qualification,
  isRegional = false,
  annualFees,
  visaSubclasses,
}: CourseCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  const courseData = {
    id,
    courseName,
    university,
    anzscoCode,
    occupation,
    duration,
    qualification,
    isRegional,
    annualFees,
    visaSubclasses,
  };
  return (
    <Card className={`group relative flex flex-col overflow-hidden border-border/50 border-t-[3px] ${isRegional ? 'border-t-accent' : 'border-t-primary'} bg-card transition-all duration-300 hover:-translate-y-1 hover:border-glacier/40 hover:shadow-[0_8px_30px_-8px_rgba(11,31,59,0.25)]`}>
      {/* Regional Badge - Absolute positioned */}
      {isRegional && (
        <div className="absolute right-4 top-4 z-10">
          <Badge className="border-0 bg-accent text-primary shadow-sm transition-all duration-200 hover:bg-gold-dark hover:text-white">
            <MapPin className="mr-1 h-3 w-3" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Regional +5</span>
          </Badge>
        </div>
      )}

      <CardHeader className="pb-3">
        {/* University */}
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">{university}</span>
        </div>

        {/* Course Name */}
        <h3 className="line-clamp-2 text-lg font-bold leading-relaxed text-foreground transition-colors group-hover:text-primary">
          {courseName}
        </h3>
      </CardHeader>

      <CardContent className="flex-1 space-y-4 pb-4">
        {/* ANZSCO Code & Occupation */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              ANZSCO {anzscoCode}
            </Badge>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{occupation}</p>
        </div>

        {/* Details Row */}
        <div className="flex items-center gap-4 text-sm leading-relaxed text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{duration}</span>
          </div>
          <span className="text-border">•</span>
          <span>{qualification}</span>
        </div>
      </CardContent>

      <CardFooter className="border-t border-navy/10 bg-navy/[0.02] p-4">
        <Button
          variant="ghost"
          className="w-full justify-between text-navy font-semibold hover:bg-gold/10 hover:text-navy rounded-xl transition-all"
          onClick={() => setIsOpen(true)}
        >
          View Details
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 text-navy/70" />
        </Button>
      </CardFooter>

      {/* Mobile: Bottom Sheet, Desktop: Side Drawer */}
      {isMobile ? (
        <PathwayPreviewSheet
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          course={courseData}
        />
      ) : (
        <PathwayPreviewDrawer
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          course={courseData}
        />
      )}
    </Card>
  );
}
