import { useEffect, useState } from "react";
import { siteConfigService, type VisaCategory, type VisaDetail, type SiteConfigData } from "@/services/siteConfigService";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function VisaManagement() {
  const [config, setConfig] = useState<SiteConfigData>({} as SiteConfigData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    let cancelled = false;
    siteConfigService.getConfig().then(data => { if (!cancelled) setConfig(data); })
      .catch(() => { if (!cancelled) setError("Could not load visa content. Refresh to try again."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);
  function updateCategory(index: number, patch: Partial<VisaCategory>) {
    setMessage("");
    setConfig(prev => ({ ...prev, visaCategories: prev.visaCategories?.map((c, i) => i === index ? { ...c, ...patch } : c) }));
  }
  function updateVisa(ci: number, vi: number, patch: Partial<VisaDetail>) {
    updateCategory(ci, { visas: config.visaCategories![ci].visas.map((v, i) => i === vi ? { ...v, ...patch } : v) });
  }
  async function save() {
    const categories = config.visaCategories ?? [];
    const slugs = new Set<string>();
    for (const category of categories) {
      if (!category.title.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(category.slug) || slugs.has(category.slug)) {
        setError("Each category needs a title and a unique URL slug using lowercase letters, numbers and hyphens."); return;
      }
      slugs.add(category.slug);
      const subclasses = new Set<string>();
      for (const visa of category.visas) {
        if (!/^\d{3}$/.test(visa.subclass) || subclasses.has(visa.subclass) || !visa.title.trim() || !visa.description.trim()) {
          setError("Each visa needs a unique three-digit subclass within its category, a title and a description."); return;
        }
        subclasses.add(visa.subclass);
      }
    }

    setSaving(true); setError(""); setMessage("");
    try {
      const latest = await siteConfigService.getConfig();
      await siteConfigService.updateConfig({ ...latest, visaCategories: config.visaCategories });
      setMessage("Visa content saved. The navbar, landing page and details now use your updates.");
    } catch { setError("Could not save visa content. Please try again."); }
    finally { setSaving(false); }
  }
  if (loading) return <p role="status">Loading visa content…</p>;
  return <div className="space-y-6">
    <div className="flex flex-wrap justify-between gap-4"><h1 className="text-2xl font-bold">Visa Management</h1><Button onClick={save} disabled={saving || !config.visaCategories}>{saving ? "Saving…" : "Save Visas"}</Button></div>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {message && <p role="status">{message}</p>}
    <fieldset disabled={saving}>
      <Card>
        <CardHeader><CardTitle>Visa categories and details</CardTitle><CardDescription>Published on the landing page and visa detail pages. Use Save Visas to publish edits.</CardDescription></CardHeader>
        <CardContent className="space-y-6">
          {config.visaCategories?.map((category, ci) => <fieldset key={ci} className="border rounded-lg p-4 space-y-4">
            <legend className="px-2 font-semibold">{category.title || "New category"}</legend>
            <Label className="block">Category title<Input value={category.title} onChange={e => updateCategory(ci, { title: e.target.value })} /></Label>
            <Label className="block">URL slug<Input placeholder="tourist" value={category.slug} onChange={e => updateCategory(ci, { slug: e.target.value })} /></Label>
            <p className="text-sm text-muted-foreground">Used in page links. Changing a saved slug changes its URL.</p>
            <Label className="block">Category description<Textarea value={category.description ?? ""} onChange={e => updateCategory(ci, { description: e.target.value })} /></Label>
            <Label className="block">Landing page button label<Input placeholder="View category" value={category.buttonLabel ?? ""} onChange={e => updateCategory(ci, { buttonLabel: e.target.value })} /></Label>
            {category.visas.map((visa, vi) => <fieldset key={vi} className="border rounded-lg p-4 space-y-3">
              <legend className="px-2">{visa.title || "New visa"}</legend>
              <Label className="block">Subclass number<Input inputMode="numeric" maxLength={3} placeholder="600" value={visa.subclass} onChange={e => updateVisa(ci, vi, { subclass: e.target.value })} /></Label>
              <Label className="block">Visa title<Input value={visa.title} onChange={e => updateVisa(ci, vi, { title: e.target.value })} /></Label>
              <Label className="block">Visa description<Textarea rows={4} value={visa.description} onChange={e => updateVisa(ci, vi, { description: e.target.value })} /></Label>
              <Button type="button" variant="outline" onClick={() => updateCategory(ci, { visas: category.visas.filter((_, i) => i !== vi) })}>Remove visa</Button>
            </fieldset>)}
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" onClick={() => updateCategory(ci, { visas: [...category.visas, { subclass: "", title: "", description: "" }] })}>Add visa</Button>
              <Button type="button" variant="outline" onClick={() => setConfig(prev => ({ ...prev, visaCategories: prev.visaCategories?.filter((_, i) => i !== ci) }))}>Remove category</Button>
            </div>
          </fieldset>)}
          {config.visaCategories && <Button type="button" variant="outline" onClick={() => setConfig(prev => ({ ...prev, visaCategories: [...(prev.visaCategories ?? []), { slug: "", title: "", description: "", buttonLabel: "View category", visas: [] }] }))}>Add category</Button>}
        </CardContent>
      </Card>
    </fieldset>
  </div>;
}
