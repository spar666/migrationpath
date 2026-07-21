import { motion } from "framer-motion";
import { ArrowRight, Sparkles, CheckCircle2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const benefits = [
  "Free personalized pathway analysis",
  "Points optimization strategy",
  "State nomination comparison",
  "MARA agent consultation",
];

export function FinalCTA() {
  const navigate = useNavigate();

  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* Rich gradient background */}
      <div className="absolute inset-0 gradient-navy" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute top-0 right-0 w-[600px] h-[600px] bg-gold/8 rounded-full blur-[120px]"
          animate={{ scale: [1, 1.3, 1], x: [0, 50, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-glacier/8 rounded-full blur-[100px]"
          animate={{ scale: [1, 1.2, 1], y: [0, -30, 0] }}
          transition={{ duration: 15, repeat: Infinity }}
        />
        
        {/* Dot grid */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <div className="container px-4 md:px-6 relative">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          {/* Badge */}
          <motion.div 
            className="inline-flex items-center gap-2 mb-8 px-5 py-2.5 rounded-full border border-gold/30 bg-gold/15 text-gold text-sm font-bold"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Sparkles className="h-4 w-4" />
            Start Your PR Journey Today
          </motion.div>

          {/* Heading */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-5 leading-tight">
            Ready for Your{" "}
            <span className="bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
              PR Strategy?
            </span>
          </h2>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-glacier-light/80 mb-10 max-w-2xl mx-auto leading-relaxed">
            Get a comprehensive migration audit from our MARA-registered agents. 
            Discover your fastest pathway to Australian permanent residency.
          </p>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12 max-w-lg mx-auto text-left">
            {benefits.map((benefit, index) => (
              <motion.div 
                key={benefit} 
                className="flex items-center gap-2.5 text-sm text-white/90 bg-white/5 px-4 py-3 rounded-xl border border-white/10"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + index * 0.08 }}
              >
                <CheckCircle2 className="h-4 w-4 text-gold flex-shrink-0" />
                {benefit}
              </motion.div>
            ))}
          </div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            <Button
              variant="gold"
              size="xl"
              className="gap-3 max-w-full whitespace-normal h-auto py-4 text-base px-6 sm:text-lg sm:px-12 shadow-gold-glow hover:shadow-lg transition-all duration-300 hover:scale-105"
              onClick={() => navigate("/quote")}
            >
              Get My Free Migration Audit
              <ArrowRight className="h-5 w-5" />
            </Button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div 
            className="mt-10 flex flex-col items-center gap-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center gap-2 text-sm text-glacier-light/60">
              <Shield className="h-4 w-4 text-gold/60" />
              <span>No credit card required • 100% confidential • Response within 48 hours</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
