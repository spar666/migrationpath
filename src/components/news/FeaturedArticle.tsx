import { Link } from "react-router-dom";
import { Clock, ArrowRight, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { NewsArticle } from "@/types";

interface FeaturedArticleProps {
  article: NewsArticle;
}

const categoryColors: Record<string, string> = {
  "Policy Update": "bg-accent/20 text-accent border-accent/30",
  "State Nomination": "bg-primary/20 text-primary-foreground border-primary/30",
  "Occupation List": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Processing Times": "bg-sky-500/20 text-sky-400 border-sky-500/30",
  "Industry News": "bg-violet-500/20 text-violet-400 border-violet-500/30",
};

export function FeaturedArticle({ article }: FeaturedArticleProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <Link to={`/news/${(article as any).slug || 'article'}`} className="group block">
      <div className="relative overflow-hidden rounded-2xl gradient-navy border border-navy-light/20">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-glacier rounded-full blur-3xl" />
        </div>

        <div className="relative p-8 md:p-12">
          <div className="grid md:grid-cols-5 gap-8 items-center">
            {/* Content */}
            <div className="md:col-span-3 space-y-6">
              {/* Featured Badge */}
              <div className="flex items-center gap-3">
                <Badge className="bg-accent text-primary font-semibold uppercase tracking-wider text-xs px-3 py-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
                <Badge 
                  variant="outline" 
                  className={`text-[10px] uppercase tracking-wider font-semibold ${categoryColors[(article as any).category] || ''}`}
                >
                  {(article as any).category || 'News'}
                </Badge>
              </div>

              {/* Title - Large Serif */}
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight group-hover:text-accent/90 transition-colors">
                {article.title}
              </h2>

              {/* Excerpt */}
              <p className="text-lg text-glacier leading-relaxed">
                {article.excerpt}
              </p>

              {/* Meta & CTA */}
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <div className="flex items-center gap-4 text-sm text-white/60">
                  <span>{formatDate((article as any).date)}</span>
                  <span className="text-white/20">|</span>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>{(article as any).readTime || '5 min read'}</span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-2 text-accent font-semibold group-hover:gap-3 transition-all">
                  Read Full Analysis
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>

            {/* Visual Element */}
            <div className="md:col-span-2 hidden md:flex items-center justify-center">
              <div className="relative">
                <div className="w-48 h-48 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
                    <span className="font-serif text-6xl font-bold text-accent">SID</span>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10">
                  <span className="text-sm font-semibold text-white">2026</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

