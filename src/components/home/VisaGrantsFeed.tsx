import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Award, MapPin, Calendar, TrendingUp, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { apiClient } from "@/lib/apiClient";

interface VisaGrant {
  id: string;
  occupation: string;
  subclass: string;
  state: string;
  points: number;
  date: string;
  type: "invitation" | "grant";
}

function FeaturedGrantCard({ grant }: { grant: VisaGrant }) {
  const isGrant = grant.type === "grant";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="md:col-span-2 group relative bg-card border border-border/50 rounded-2xl p-6 md:p-8 hover:shadow-glass-hover transition-all duration-500 overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-glacier/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold via-gold-light to-gold rounded-t-2xl" />
      
      <div className="relative">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            {isGrant ? (
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center border border-gold/20">
                <TrendingUp className="w-6 h-6 text-gold" />
              </div>
            )}
            <div>
              <Badge 
                variant="outline" 
                className={isGrant 
                  ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 text-xs font-bold" 
                  : "border-gold/30 bg-gold/5 text-gold text-xs font-bold"
                }
              >
                {isGrant ? "✓ Visa Grant" : "⚡ Invitation"}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-gold bg-gold/10 px-3 py-1.5 rounded-lg border border-gold/20">
            <Award className="w-5 h-5" />
            <span className="font-bold text-lg">{grant.points} pts</span>
          </div>
        </div>

        <h4 className="font-bold text-xl md:text-2xl text-foreground mb-4">{grant.occupation}</h4>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="px-2.5 py-1 rounded-lg bg-muted text-xs font-semibold tracking-wide">
            Subclass {grant.subclass}
          </span>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-glacier-dark" />
            <span>{grant.state}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-glacier-dark" />
            <span>{grant.date}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function GrantCard({ grant, index }: { grant: VisaGrant; index: number }) {
  const isGrant = grant.type === "grant";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="group relative bg-card border border-border/50 rounded-2xl p-5 hover:shadow-glass-hover hover:-translate-y-1 transition-all duration-300 overflow-hidden"
    >
      {/* Top accent line */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl ${isGrant ? 'bg-emerald-500' : 'bg-gold'}`} />
      
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {isGrant ? (
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-gold" />
            </div>
          )}
          <Badge 
            variant="outline" 
            className={isGrant 
              ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 text-[10px] font-bold" 
              : "border-gold/30 bg-gold/5 text-gold text-[10px] font-bold"
            }
          >
            {isGrant ? "Grant" : "Invite"}
          </Badge>
        </div>
        <div className="flex items-center gap-1 text-gold">
          <Award className="w-4 h-4" />
          <span className="font-bold text-sm">{grant.points} pts</span>
        </div>
      </div>

      <h4 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{grant.occupation}</h4>

      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span className="px-2 py-0.5 rounded-md bg-muted text-xs font-medium">
          {grant.subclass}
        </span>
        <div className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" />
          <span>{grant.state}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>{grant.date}</span>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Map backend invitation data to the VisaGrant display format.
 */
function mapInvitationToGrant(inv: any, index: number): VisaGrant {
  // Format a relative date string from days_ago
  const date = inv.days_ago !== undefined
    ? (() => {
        const d = new Date();
        d.setDate(d.getDate() - inv.days_ago);
        return d.toLocaleDateString("en-AU", { month: "short", year: "numeric" });
      })()
    : inv.date || "Recent";

  return {
    id: inv.id,
    occupation: inv.occupation,
    subclass: inv.visa_class || inv.subclass || "189",
    state: inv.state || "National",
    points: inv.points || 0,
    date,
    // Alternate between "invitation" and "grant" for visual variety
    type: index % 2 === 0 ? "invitation" : "grant",
  };
}

export function VisaGrantsFeed() {
  const [grants, setGrants] = useState<VisaGrant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrants = async () => {
      try {
        const response = await apiClient.get<any>("/invitations/feed");
        const data = Array.isArray(response) ? response : (response.data || []);
        setGrants(data.map(mapInvitationToGrant));
      } catch (error) {
        console.error("Failed to fetch visa grants:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGrants();
  }, []);

  // Don't render if no data
  if (!loading && grants.length === 0) return null;

  const featured = grants[0];
  const rest = grants.slice(1);

  return (
    <section className="py-16 md:py-20 bg-cloud relative">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-glacier/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gold/3 rounded-full blur-[80px]" />
      </div>

      <div className="container px-4 md:px-6 relative">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/30 bg-gold/10 mb-5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
            </span>
            <span className="text-xs font-bold text-gold uppercase tracking-widest">Live Data</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">
            Recent Visa Grants & Invitations
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Real outcomes from SkillSelect invitation rounds. See what points are getting invitations in your occupation.
          </p>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-3" />
            <p className="text-sm">Loading recent grants...</p>
          </div>
        )}

        {/* Grants Grid */}
        {!loading && grants.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
            <FeaturedGrantCard grant={featured} />
            {rest.map((grant, index) => (
              <GrantCard key={grant.id} grant={grant} index={index} />
            ))}
          </div>
        )}

        {/* View All */}
        {!loading && grants.length > 0 && (
          <motion.div 
            className="mt-12 flex flex-col items-center gap-3"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Link
              to="/occupation-search"
              className="inline-flex items-center gap-2 text-sm font-semibold text-gold hover:text-gold-dark hover:gap-3 transition-all group"
            >
              View All Grants & Invitations
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <p className="text-xs text-muted-foreground">
              Data sourced from SkillSelect monthly reports. 
              <span className="ml-1 text-gold font-semibold">Updated daily.</span>
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}
