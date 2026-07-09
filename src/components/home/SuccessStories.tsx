import { useState, useEffect } from "react";
import { Quote } from "lucide-react";
import { successStoryService, type SuccessStory } from "@/services/successStoryService";

export function SuccessStories() {
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    successStoryService
      .getFeatured(3)
      .then((data) => {
        if (isMounted) setStories(data);
      })
      .catch((err) => {
        console.error("Failed to load success stories:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Nothing configured in the CMS yet, or the fetch failed — render
  // nothing rather than an empty section shell.
  if (!loading && stories.length === 0) return null;

  return (
    <section className="py-16 md:py-20 bg-secondary/40">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-glacier-dark mb-2">
            Real outcomes
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-navy">
            Migrants who've been where you are
          </h2>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-40 rounded-xl bg-card animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {stories.map((story) => (
              <div
                key={story.id}
                className="p-6 rounded-xl bg-card border border-border shadow-glass"
              >
                <Quote className="w-6 h-6 text-gold mb-3" />
                <p className="text-sm text-foreground leading-relaxed mb-4">
                  "{story.quote}"
                </p>
                <p className="text-sm font-semibold text-navy">{story.name}</p>
                <p className="text-xs text-muted-foreground">
                  {[story.visaSubclass && `Subclass ${story.visaSubclass}`, story.country]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
