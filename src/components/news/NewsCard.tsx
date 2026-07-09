import { Link } from "react-router-dom";
import { Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { NewsArticle } from "@/types";

interface NewsCardProps {
  article: NewsArticle;
  variant?: "default" | "compact";
}

const categoryColors: Record<string, string> = {
  "Policy Update": "bg-accent/20 text-accent border-accent/30",
  "State Nomination": "bg-primary/20 text-primary border-primary/30",
  "Occupation List": "bg-emerald-500/20 text-emerald-600 border-emerald-500/30",
  "Processing Times": "bg-sky-500/20 text-sky-600 border-sky-500/30",
  "Industry News": "bg-violet-500/20 text-violet-600 border-violet-500/30",
};

const personaTagColors: Record<string, string> = {
  "For Onshore Skilled": "bg-primary text-primary-foreground",
  "For Students": "bg-glacier text-primary",
  "For Partners": "bg-rose-100 text-rose-700",
  "For Employers": "bg-amber-100 text-amber-700",
  "All Pathways": "bg-muted text-muted-foreground",
};

export function NewsCard({ article, variant = "default" }: NewsCardProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (variant === "compact") {
    return (
      <Link to={`/news/${(article as any).slug || 'article'}`} className="group block">
        <Card className="h-full transition-all duration-300 hover:shadow-glass-hover hover:border-accent/30">
          <CardContent className="p-5">
            {/* Category & Persona */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge 
                variant="outline" 
                className={`text-[10px] uppercase tracking-wider font-semibold ${categoryColors[(article as any).category] || ''}`}
              >
                {(article as any).category || 'News'}
              </Badge>
              {(article as any).personaTag && (
                <Badge 
                  className={`text-[10px] uppercase tracking-wider font-medium ${personaTagColors[(article as any).personaTag] || ''}`}
                >
                  {(article as any).personaTag}
                </Badge>
              )}
            </div>

            {/* Title - Serif for editorial feel */}
            <h3 className="font-serif text-lg font-bold text-foreground leading-snug mb-2 group-hover:text-accent transition-colors line-clamp-2">
              {article.title}
            </h3>

            {/* Excerpt */}
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">
              {article.excerpt}
            </p>

            {/* Meta */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatDate((article as any).date)}</span>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{(article as any).readTime || '5 min'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Link to={`/news/${(article as any).slug || 'article'}`} className="group block">
      <Card className="h-full transition-all duration-300 hover:shadow-glass-hover hover:border-accent/30 overflow-hidden">
        {/* Article Image Placeholder */}
        <div className="h-48 bg-gradient-to-br from-primary/10 via-glacier/10 to-accent/10 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-serif font-bold text-primary">M</span>
            </div>
          </div>
        </div>

        <CardContent className="p-6">
          {/* Category & Persona */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge 
              variant="outline" 
              className={`text-[10px] uppercase tracking-wider font-semibold ${categoryColors[(article as any).category] || ''}`}
            >
              {(article as any).category || 'News'}
            </Badge>
            {(article as any).personaTag && (
              <Badge 
                className={`text-[10px] uppercase tracking-wider font-medium ${personaTagColors[(article as any).personaTag] || ''}`}
              >
                {(article as any).personaTag}
              </Badge>
            )}
          </div>

          {/* Title - Serif for editorial feel */}
          <h3 className="font-serif text-xl font-bold text-foreground leading-snug mb-3 group-hover:text-accent transition-colors">
            {article.title}
          </h3>

          {/* Excerpt */}
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4">
            {article.excerpt}
          </p>

          {/* Meta & CTA */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{formatDate((article as any).date)}</span>
              <span className="text-border">|</span>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{(article as any).readTime || '5 min'}</span>
              </div>
            </div>
            <span className="text-sm font-medium text-accent flex items-center gap-1 group-hover:gap-2 transition-all">
              Read
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
