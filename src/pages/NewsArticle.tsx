import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Clock, Share2, Bookmark, Calculator, ArrowRight } from "lucide-react";
import { Header } from "@/components/common/navbar/Header";
import { Footer } from "@/components/common/footer/Footer";
import { MobileBottomNav } from "@/components/common/navbar/MobileBottomNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NewsSidebar } from "@/components/news";
import { newsService } from "@/services/newsService";
import type { NewsArticle } from "@/types";

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

const NewsArticlePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        if (!slug) return;
        const result = await newsService.getNewsArticleBySlug(slug);
        setArticle(result);

        const { articles } = await newsService.getNewsArticles(1, 3);
        setRelatedArticles(articles.filter(a => a.slug !== slug));
      } catch (error) {
        console.error('Failed to fetch news article:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [slug]);

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "Date not available";
    return new Date(dateStr).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col pb-20 md:pb-0">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </main>
        <Footer />
        <MobileBottomNav />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex min-h-screen flex-col pb-20 md:pb-0">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Article Not Found</h1>
            <p className="text-muted-foreground mb-4">The article you're looking for doesn't exist.</p>
            <Link to="/news">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to News
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col pb-20 md:pb-0">
      <Header />

      <main className="flex-1">
        {/* Article Header */}
        <section className="bg-background border-b border-border/50">
          <div className="container px-4 py-8 md:py-12">
            {/* Back Link */}
            <Link
              to="/news"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to News
            </Link>

            <div className="max-w-4xl">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <Badge
                  variant="outline"
                  className={`text-xs uppercase tracking-wider font-semibold ${categoryColors[article.category] || ''}`}
                >
                  {article.category || 'News'}
                </Badge>
                {article.personaTag && (
                  <Badge
                    className={`text-xs uppercase tracking-wider font-medium ${personaTagColors[article.personaTag] || ''}`}
                  >
                    {article.personaTag}
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-6">
                {article.title}
              </h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <span>{formatDate(article.date)}</span>
                <span className="text-border">|</span>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{article.readTime || '5 min read'}</span>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Bookmark className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Article Content */}
        <section className="container px-4 py-10">
          <div className="grid lg:grid-cols-4 gap-10">
            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Excerpt */}
              <p className="text-xl text-muted-foreground leading-relaxed mb-8 pb-8 border-b border-border/50">
                {article.excerpt}
              </p>

              {/* Article Body */}
              <article className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed prose-strong:text-foreground prose-li:text-muted-foreground">
                <div
                  dangerouslySetInnerHTML={{
                    __html: article.content
                      .replace(/## /g, '<h2 class="text-2xl font-bold mt-8 mb-4">')
                      .replace(/### /g, '<h3 class="text-xl font-bold mt-6 mb-3">')
                      .replace(/\n\n/g, '</p><p class="mb-4">')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/- (.*?)(?=\n|$)/g, '<li class="ml-4 mb-2">$1</li>')
                      .replace(/1\. (.*?)(?=\n|$)/g, '<li class="ml-4 mb-2 list-decimal">$1</li>'),
                  }}
                />
              </article>

              {/* Points Calculator CTA - Mobile */}
              <Card className="mt-10 lg:hidden overflow-hidden border-accent/30 bg-gradient-to-br from-primary via-navy-light to-primary">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center flex-shrink-0">
                      <Calculator className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">
                        How does this affect your points?
                      </h3>
                      <p className="text-sm text-glacier mb-4">
                        Calculate your current score and explore optimization strategies.
                      </p>
                      <Link to="/points-calculator">
                        <Button className="bg-accent text-primary hover:bg-accent/90 font-semibold">
                          Check My PR Score
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Related Articles */}
              {relatedArticles.length > 0 && (
                <div className="mt-12 pt-8 border-t border-border/50">
                  <h3 className="font-serif text-xl font-bold text-foreground mb-6">
                    Related Articles
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    {relatedArticles.map((related) => (
                      <Link
                        key={related.id}
                        to={`/news/${related.slug || 'article'}`}
                        className="group block p-4 rounded-lg border border-border/50 hover:border-accent/30 transition-colors"
                      >
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase tracking-wider font-semibold mb-2 ${categoryColors[related.category] || ''}`}
                        >
                          {related.category || 'News'}
                        </Badge>
                        <h4 className="font-medium text-foreground group-hover:text-accent transition-colors line-clamp-2">
                          {related.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDate(related.date)}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="sticky top-24">
                <NewsSidebar />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default NewsArticlePage;
