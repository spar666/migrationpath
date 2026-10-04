import { Link } from "react-router-dom";
import { useSiteConfig } from "@/contexts/SiteConfigContext";

export function VisaCategories() {
  const { config, isLoading } = useSiteConfig();
  if (isLoading) return <p className="container py-12" role="status">Loading visa types…</p>;
  if (!config?.visaCategories?.length) return null;
  return <section className="container py-16" aria-labelledby="visa-types-title">
    <h2 id="visa-types-title" className="text-3xl font-bold mb-3">Explore visa types</h2>
    <p className="text-muted-foreground mb-8">Explore options for visiting, studying and working in Australia.</p>
    <div className="grid gap-6 md:grid-cols-3">{config.visaCategories.map(category =>
      <article key={category.slug} className="rounded-xl border bg-card p-6 shadow-sm">
        <h3 className="text-xl font-semibold mb-5"><Link className="hover:underline" to={`/visas/${encodeURIComponent(category.slug)}`}>{category.title}</Link></h3>
        {category.description && <p className="text-muted-foreground mb-5 whitespace-pre-line">{category.description}</p>}
        <ul className="space-y-5">{category.visas.map(visa => <li key={visa.subclass}>
          <Link className="font-medium text-primary hover:underline" to={`/visas/${encodeURIComponent(category.slug)}/${encodeURIComponent(visa.subclass)}`}>{visa.title} (Subclass {visa.subclass})</Link>
          <p className="text-sm text-muted-foreground mt-2">{visa.description}</p>
        </li>)}</ul>
        <Link className="inline-block mt-6 text-primary font-medium hover:underline" to={`/visas/${encodeURIComponent(category.slug)}`}>{category.buttonLabel || "View category"} →</Link>
      </article>)}</div>
  </section>;
}
