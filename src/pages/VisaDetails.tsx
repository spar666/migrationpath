import { Link, useParams } from "react-router-dom";
import { Header } from "@/components/common/navbar/Header";
import { Footer } from "@/components/common/footer/Footer";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { PageSeo } from "@/components/seo/SiteSeo";

export default function VisaDetails() {
  const { categorySlug, subclass } = useParams();
  const { config, isLoading } = useSiteConfig();
  const category = config?.visaCategories?.find(item => item.slug === categorySlug);
  const visa = category?.visas.find(item => item.subclass === subclass);
  const seoTitle = visa ? `${visa.title} (Subclass ${visa.subclass})` : category?.title;
  const seoDescription = visa?.description || category?.description;
  return <div className="min-h-screen flex flex-col">{seoTitle && seoDescription && <PageSeo title={seoTitle} description={seoDescription.slice(0, 300)} />}<Header /><main className="container max-w-4xl py-16 flex-1">
    <Link to="/" className="text-primary hover:underline">← Home</Link>
    {isLoading ? <p role="status" className="mt-8">Loading visa details…</p> : !config ? <p role="alert" className="mt-8">Visa details could not be loaded. Please refresh to try again.</p> : !category || (subclass && !visa) ? <h1 className="text-3xl font-bold mt-8">Visa not found</h1> : <>
      <h1 className="text-4xl font-bold mt-8 mb-6">{visa ? `${visa.title} (Subclass ${visa.subclass})` : category.title}</h1>
      {!visa && category.description && <p className="text-lg mb-8 whitespace-pre-line">{category.description}</p>}
      {visa ? <><p className="text-lg leading-relaxed whitespace-pre-line">{visa.description}</p><Link className="inline-block mt-8 text-primary hover:underline" to={`/visas/${encodeURIComponent(category.slug)}`}>Explore all {category.title.toLowerCase()}</Link></> : <div className="space-y-6">{category.visas.map(item => <article key={item.subclass} className="border rounded-xl p-6"><h2 className="text-xl font-semibold mb-3"><Link className="text-primary hover:underline" to={`/visas/${encodeURIComponent(category.slug)}/${encodeURIComponent(item.subclass)}`}>{item.title} (Subclass {item.subclass})</Link></h2><p className="text-muted-foreground whitespace-pre-line">{item.description}</p></article>)}</div>}
      <Link to="/consultation" className="inline-block mt-10 rounded-lg bg-primary text-primary-foreground px-6 py-3">Discuss your options</Link>
    </>}
  </main><Footer /></div>;
}
