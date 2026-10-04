import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function VisaNavigation({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const { config } = useSiteConfig();
  const categories = config?.visaCategories;
  if (!categories?.length) return null;
  if (mobile) return <div className="border-t border-white/10 py-4">
    <p className="px-4 text-xs uppercase tracking-widest text-white/50 mb-3">Visa Types</p>
    {categories.map(category => <details key={category.slug} className="px-4 py-2 text-white/90">
      <summary className="cursor-pointer font-medium">{category.title}</summary>
      <Link onClick={onNavigate} className="block py-3 text-accent text-sm" to={`/visas/${encodeURIComponent(category.slug)}`}>View all {category.title.toLowerCase()}</Link>
      {category.visas.map(visa => <Link key={visa.subclass} onClick={onNavigate} className="block py-3 text-sm text-white/70 hover:text-white" to={`/visas/${encodeURIComponent(category.slug)}/${encodeURIComponent(visa.subclass)}`}>{visa.title} ({visa.subclass})</Link>)}
    </details>)}
  </div>;
  return <DropdownMenu>
    <DropdownMenuTrigger asChild><button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10">Visa Types<ChevronDown className="w-3.5 h-3.5" /></button></DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="w-80 max-h-[70vh] overflow-y-auto bg-navy border-white/10 text-white">
      {categories.map(category => <div key={category.slug}>
        <DropdownMenuItem asChild><Link className="font-semibold text-accent" to={`/visas/${encodeURIComponent(category.slug)}`}>{category.title}</Link></DropdownMenuItem>
        {category.visas.map(visa => <DropdownMenuItem key={visa.subclass} asChild><Link className="pl-5" to={`/visas/${encodeURIComponent(category.slug)}/${encodeURIComponent(visa.subclass)}`}>{visa.title} ({visa.subclass})</Link></DropdownMenuItem>)}
      </div>)}
    </DropdownMenuContent>
  </DropdownMenu>;
}
