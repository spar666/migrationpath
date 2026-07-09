import { motion } from "framer-motion";
import { Bell, MapPin, TrendingUp, ChevronRight, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StateInvitation {
  id: string;
  occupation: string;
  state: string;
  visaType: "189" | "190" | "491";
  pointsThreshold: number;
  daysAgo: number;
  count?: number;
}

interface StateInvitationsWidgetProps {
  occupation?: string;
  userPoints?: number;
}

export function StateInvitationsWidget({
  occupation = "Software Engineer",
  userPoints = 75,
}: StateInvitationsWidgetProps) {
  // Mock recent invitations - in production, this would come from an API
  const recentInvitations: StateInvitation[] = [
    {
      id: "1",
      occupation: "Software Engineer",
      state: "NSW",
      visaType: "190",
      pointsThreshold: 85,
      daysAgo: 1,
      count: 45,
    },
    {
      id: "2",
      occupation: "Software Engineer",
      state: "VIC",
      visaType: "190",
      pointsThreshold: 90,
      daysAgo: 3,
      count: 32,
    },
    {
      id: "3",
      occupation: "Software Engineer",
      state: "SA",
      visaType: "491",
      pointsThreshold: 75,
      daysAgo: 5,
      count: 28,
    },
  ];

  const relevantInvitations = recentInvitations.filter(
    (inv) => inv.occupation.toLowerCase() === occupation.toLowerCase()
  );

  const eligibleInvitations = relevantInvitations.filter(
    (inv) => userPoints >= inv.pointsThreshold
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Recent State Invitations
        </h3>
        {eligibleInvitations.length > 0 && (
          <Badge className="bg-accent/10 text-accent border-accent/30 animate-pulse">
            <Zap className="w-3 h-3 mr-1" />
            {eligibleInvitations.length} match your points
          </Badge>
        )}
      </div>

      {/* Invitation List */}
      <div className="space-y-3">
        {relevantInvitations.map((invitation, index) => {
          const isEligible = userPoints >= invitation.pointsThreshold;
          const pointsGap = invitation.pointsThreshold - userPoints;

          return (
            <motion.div
              key={invitation.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "p-4 rounded-xl border transition-all cursor-pointer hover:shadow-card",
                isEligible
                  ? "border-accent/30 bg-accent/5 hover:border-accent/50"
                  : "border-border bg-card hover:border-primary/30"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                      isEligible ? "bg-accent/20" : "bg-muted"
                    )}
                  >
                    <MapPin
                      className={cn(
                        "w-5 h-5",
                        isEligible ? "text-accent" : "text-muted-foreground"
                      )}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground">
                        {invitation.state}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-xs border-primary/30 text-primary"
                      >
                        {invitation.visaType}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {invitation.count} {invitation.occupation}s invited
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {invitation.daysAgo === 1
                        ? "Yesterday"
                        : `${invitation.daysAgo} days ago`}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className={cn(
                      "text-lg font-bold",
                      isEligible ? "text-accent" : "text-foreground"
                    )}
                  >
                    {invitation.pointsThreshold} pts
                  </div>
                  {isEligible ? (
                    <span className="text-xs font-medium text-accent">
                      You qualify!
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Need +{pointsGap} pts
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Notification CTA */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Get notified when your occupation is invited
          </span>
        </div>
        <Button variant="outline" size="sm" className="shrink-0">
          Enable
        </Button>
      </div>

      {/* View All Link */}
      <Button variant="ghost" className="w-full text-primary hover:text-primary/80">
        View All State Invitation Rounds
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}
