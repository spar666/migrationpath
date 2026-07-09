import { useState, useEffect } from "react";
import { Header } from "@/components/common/navbar/Header";
import { Footer } from "@/components/common/footer/Footer";
import { MobileBottomNav } from "@/components/common/navbar/MobileBottomNav";
import { FeaturedArticle, NewsCard, NewsSidebar } from "@/components/news";
import { newsService } from "@/services/newsService";
import type { NewsArticle } from "@/types";

const News = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const { articles } = await newsService.getNewsArticles(1, 25);
        setArticles(articles);
      } catch (error) {
        console.error('Failed to fetch news articles:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  const featuredArticle = articles.length > 0 ? articles[0] : null;
  const latestArticles = articles.slice(0, 6);

  return (
    <div className="flex min-h-screen flex-col pb-20 md:pb-0">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-background border-b border-border/50">
          <div className="container px-4 py-12 md:py-16">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">
                Migration Intelligence
              </p>
              <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground leading-tight mb-4">
                Policy Updates & Analysis
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Expert analysis of Australian migration policy changes, state nomination trends, 
                and strategic insights to optimize your PR pathway.
              </p>
            </div>
          </div>
        </section>

        {/* Loading State */}
        {loading && (
          <section className="container px-4 py-10">
            <p className="text-muted-foreground text-center py-12">Loading articles...</p>
          </section>
        )}

        {/* No Articles State */}
        {!loading && articles.length === 0 && (
          <section className="container px-4 py-10">
            <p className="text-muted-foreground text-center py-12">No articles available yet.</p>
          </section>
        )}

        {/* Featured Article */}
        {featuredArticle && (
          <section className="container px-4 py-10">
            <FeaturedArticle article={featuredArticle} />
          </section>
        )}

        {/* Articles Grid with Sidebar */}
        {articles.length > 0 && (
          <section className="container px-4 py-10">
            <div className="grid lg:grid-cols-4 gap-10">
              {/* Main Content - 3 columns */}
              <div className="lg:col-span-3">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="font-serif text-2xl font-bold text-foreground">
                    Latest Analysis
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {articles.length} articles
                    </span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {latestArticles.map((article) => (
                    <NewsCard key={article.id} article={article} />
                  ))}
                </div>
              </div>

              {/* Sidebar - 1 column */}
              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <NewsSidebar />
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default News;
