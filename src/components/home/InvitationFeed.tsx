import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, MapPin, Award, Zap, ArrowRight } from "lucide-react";
import { apiClient } from "@/lib/apiClient";

interface Invitation {
  id: string;
  occupation: string;
  visa_class: string;
  state: string;
  points: number;
  days_ago: number;
  priority: boolean;
}

function InvitationCard({ invitation }: { invitation: Invitation }) {
  return (
    <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5 bg-card/90 backdrop-blur-sm rounded-xl border border-border/40 shadow-soft-xs hover:shadow-soft-sm hover:border-glacier/30 transition-all duration-300 group">
      {invitation.priority && (
        <span className="flex-shrink-0 relative">
          <span className="h-2 w-2 rounded-full bg-gold block" />
          <span className="absolute inset-0 h-2 w-2 rounded-full bg-gold animate-ping opacity-40" />
        </span>
      )}
      <span className="font-semibold text-foreground whitespace-nowrap text-sm">{invitation.occupation}</span>
      <span className="h-1 w-1 rounded-full bg-border flex-shrink-0" />
      <span className="text-muted-foreground text-xs font-medium bg-muted px-2 py-0.5 rounded-md">{invitation.visa_class}</span>
      <span className="h-1 w-1 rounded-full bg-border flex-shrink-0" />
      <span className="flex items-center gap-1 text-xs text-glacier-dark whitespace-nowrap">
        <MapPin className="h-3 w-3" />
        {invitation.state}
      </span>
      <span className="h-1 w-1 rounded-full bg-border flex-shrink-0" />
      <span className="flex items-center gap-1 text-xs font-bold text-gold whitespace-nowrap">
        <Award className="h-3 w-3" />
        {invitation.points} pts
      </span>
      <span className="text-[11px] text-muted-foreground/70 whitespace-nowrap">
        {invitation.days_ago === 1 ? "1d ago" : `${invitation.days_ago}d ago`}
      </span>
    </div>
  );
}

export function InvitationFeed() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const fetchInvitations = async () => {
      try {
        const response = await apiClient.get<any>("/invitations/feed");
        const data = Array.isArray(response) ? response : (response.data || []);
        setInvitations(data);
      } catch (error) {
        console.error("Failed to fetch invitations:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInvitations();
  }, []);

  // Don't render the section if there are no invitations and not loading
  if (!loading && invitations.length === 0) return null;

  // Need at least a few items for smooth scrolling; duplicate if we have data
  const duplicatedInvitations = invitations.length > 0
    ? [...invitations, ...invitations]
    : [];

  return (
    <section className="relative overflow-hidden bg-background py-3 border-y border-border/20">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-cloud via-background to-cloud" />

      {/* Header */}
      <div className="container px-4 md:px-6 mb-2.5 relative">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold/10 border border-gold/20">
              <Zap className="h-3 w-3 text-gold" />
              <span className="font-bold text-navy text-xs uppercase tracking-wider">Live</span>
            </div>
            <span className="font-semibold text-navy text-sm">Priority Invitations</span>
            <span className="text-muted-foreground text-xs hidden sm:inline">• Updated from SkillSelect</span>
          </div>
          <Link
            to="/points-calculator"
            className="flex items-center gap-1 text-xs font-semibold text-navy hover:text-gold transition-colors whitespace-nowrap"
          >
            Check your eligibility
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Loading placeholder */}
      {loading && (
        <div className="flex gap-3 px-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-shrink-0 h-10 w-64 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Scrolling Ticker */}
      {!loading && duplicatedInvitations.length > 0 && (
        <div className="relative group">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

          <div
            className={`flex gap-3 px-4 marquee-scroll ${isPaused ? 'marquee-paused' : ''}`}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {duplicatedInvitations.map((invitation, index) => (
              <InvitationCard key={`${invitation.id}-${index}`} invitation={invitation} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
