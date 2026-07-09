import { motion } from "framer-motion";
import { MapPin, Plane, ArrowRight, Timer, Target, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface PathwayCardProps {
  type: "onshore" | "offshore";
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  icon: React.ElementType;
  ctaText: string;
  onClick: () => void;
  index: number;
}

function PathwayCard({ title, subtitle, description, features, icon: Icon, ctaText, onClick, index }: PathwayCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      className="group relative gradient-navy rounded-2xl p-7 md:p-9 overflow-hidden cursor-pointer hover:shadow-navy-glow transition-shadow duration-500"
      onClick={onClick}
    >
      {/* Animated background elements */}
      <motion.div 
        className="absolute top-0 right-0 w-72 h-72 bg-glacier/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div 
        className="absolute bottom-0 left-0 w-52 h-52 bg-gold/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 10, repeat: Infinity }}
      />
      
      {/* Shine effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      <div className="relative z-10">
        {/* Icon & Badge */}
        <div className="flex items-start justify-between mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 text-white border border-white/10 group-hover:bg-white/15 group-hover:border-gold/30 transition-all duration-300">
            <Icon className="h-7 w-7" />
          </div>
          <span className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full bg-gold/20 text-gold border border-gold/30">
            {subtitle}
          </span>
        </div>

        {/* Title & Description */}
        <h3 className="text-xl md:text-2xl font-bold text-white mb-3 group-hover:text-gold-light transition-colors duration-300">
          {title}
        </h3>
        <p className="text-glacier-light/80 leading-relaxed mb-7">
          {description}
        </p>

        {/* Features */}
        <ul className="space-y-3 mb-8">
          {features.map((feature, idx) => (
            <motion.li 
              key={idx} 
              className="flex items-center gap-3 text-sm text-white/80"
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + idx * 0.08 }}
            >
              <ChevronRight className="flex-shrink-0 w-4 h-4 text-gold" />
              {feature}
            </motion.li>
          ))}
        </ul>

        {/* CTA Button */}
        <Button
          variant="gold"
          className="w-full md:w-auto gap-2 group-hover:shadow-gold-glow transition-all duration-300"
        >
          {ctaText}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </motion.div>
  );
}

export function PathwayCards() {
  const navigate = useNavigate();

  return (
    <section className="py-16 md:py-20 bg-cloud relative">
      <div className="container px-4 md:px-6 relative">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="inline-block mb-4 text-xs font-bold uppercase tracking-widest text-gold">
            Choose Your Journey
          </span>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
            Onshore vs. Offshore Pathways
          </h2>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid gap-6 md:gap-8 lg:grid-cols-2">
          <PathwayCard
            type="onshore"
            title="Already in Australia?"
            subtitle="Onshore"
            description="Track your 186-PR countdown, audit your points, and maximize your Australian experience for faster PR."
            features={[
              "186 ENS 2-year countdown tracker",
              "Real-time points optimization",
              "Skills assessment validation",
              "State nomination comparison",
            ]}
            icon={MapPin}
            ctaText="Start Points Audit"
            onClick={() => navigate("/dashboard?pathway=onshore-skilled")}
            index={0}
          />

          <PathwayCard
            type="offshore"
            title="Looking to Move?"
            subtitle="Offshore"
            description="Discover the fastest pathways for skilled professionals, from skills assessment to visa grant."
            features={[
              "Skills in Demand (SID) visa pathways",
              "State sponsorship opportunities",
              "Priority occupation fast-tracking",
              "EOI invitation predictions",
            ]}
            icon={Plane}
            ctaText="Explore Pathways"
            onClick={() => navigate("/points-calculator")}
            index={1}
          />
        </div>

        {/* Quick Stats */}
        <motion.div 
          className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-2.5 bg-card/80 px-4 py-2.5 rounded-full border border-border/50 shadow-soft-xs">
            <Timer className="h-4 w-4 text-gold" />
            <span>7-day median processing for SID priority</span>
          </div>
          <div className="flex items-center gap-2.5 bg-card/80 px-4 py-2.5 rounded-full border border-border/50 shadow-soft-xs">
            <Target className="h-4 w-4 text-gold" />
            <span>85+ points typical invitation threshold</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
