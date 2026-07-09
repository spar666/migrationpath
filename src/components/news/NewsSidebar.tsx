import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Calculator, ArrowRight, Bell, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { NewsArticle } from "@/types";

export function NewsSidebar() {
  const [recentArticles, setRecentArticles] = useState<NewsArticle[]>([]);

  useEffect(() => {
    // TODO: Replace with actual backend API endpoint
    // const fetchArticles = async () => {
    //   try {
    //     const response = await fetch('/api/v1/news?limit=4');
    //     const data = await response.json();
    //     setRecentArticles(data);
    //   } catch (error) {
    //     console.error('Failed to fetch recent articles:', error);
    //   }
    // };
    // fetchArticles();
    setRecentArticles([]); // Temporary: no data until backend is ready
  }, []);

  return (
    <div className="space-y-6">
      {/* Points Calculator CTA */}
      <Card className="overflow-hidden border-accent/30 bg-gradient-to-br from-primary via-navy-light to-primary">
        <CardContent className="p-6">
          <div className="w-12 h-12 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center mb-4">
            <Calculator className="w-6 h-6 text-accent" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">
            How does this affect your points?
          </h3>
          <p className="text-sm text-glacier mb-4 leading-relaxed">
            Use our calculator to see your current score and discover ways to maximize your PR eligibility.
          </p>
          <Link to="/points-calculator">
            <Button className="w-full bg-accent text-primary hover:bg-accent/90 font-semibold">
              Check My PR Score
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Newsletter Signup */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-accent" />
            <CardTitle className="text-base">Policy Alerts</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground mb-4">
            Get notified when policies change that affect your pathway.
          </p>
          <Button variant="outline" className="w-full">
            Subscribe to Alerts
          </Button>
        </CardContent>
      </Card>

      {/* Recent Articles */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-base">More Articles</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {recentArticles.length === 0 && (
            <p className="text-sm text-muted-foreground">No articles available yet.</p>
          )}
          {recentArticles.map((article) => (
            <Link
              key={article.id}
              to={`/news/${(article as any).slug || 'article'}`}
              className="block group"
            >
              <h4 className="text-sm font-medium text-foreground group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                {article.title}
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date((article as any).date || new Date()).toLocaleDateString("en-AU", {
                  day: "numeric",
                  month: "short",
                })}
              </p>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
