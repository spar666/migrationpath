import { useState, useEffect } from "react";
import { Eye, EyeOff, Save, Upload, Image as ImageIcon, Type, MousePointer, FileText, Home, Users, Briefcase, GraduationCap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { siteConfigService } from "@/services/siteConfigService";
import type { SiteConfigData } from "@/services/siteConfigService";

interface PageConfig {
  heroHeadline: string;
  heroSubtext: string;
  heroImage: string;
  primaryCta: string;
  secondaryCta: string;
  benefits?: string[];
}

interface SiteConfig {
  home: PageConfig & {
    outlookTitle: string;
    outlookDescription: string;
    processingTimeHealthcare: string;
    processingTimeTech: string;
  };
  student: PageConfig;
  skilled: PageConfig;
  partner: PageConfig;
  onshore: PageConfig;
  footer: {
    maraStatement: string;
    quickLinks: string[];
    resourceLinks: string[];
  };
}

const defaultConfig: SiteConfig = {
  home: {
    heroHeadline: "Your Pathway to Australian Migration",
    heroSubtext: "Navigate the 2026 migration landscape with expert-led strategy tools and real-time points optimization.",
    heroImage: "",
    primaryCta: "Get Started",
    secondaryCta: "Check My Points",
    outlookTitle: "2026 Migration Outlook",
    outlookDescription: "Australia is shifting toward a skills-first model. The new Skills in Demand (SID) visa offers a 2-year pathway to PR for eligible professionals.",
    processingTimeHealthcare: "7 Days",
    processingTimeTech: "14 Days",
    benefits: ["MARA Registered Agents", "2026 Priority Lists", "Real-Time Points Optimizer"],
  },
  student: {
    heroHeadline: "Study Your Way to Australian PR",
    heroSubtext: "Strategic course selection that maximizes your points and accelerates your permanent residency pathway.",
    heroImage: "",
    primaryCta: "Find Your Course",
    secondaryCta: "Calculate Points",
    benefits: ["Regional Study Bonus", "Post-Study Work Rights", "Direct PR Pathways"],
  },
  skilled: {
    heroHeadline: "Skilled Migration Made Simple",
    heroSubtext: "Expert guidance for 189, 190, and 491 visa pathways. Real-time state nomination insights.",
    heroImage: "",
    primaryCta: "Check Eligibility",
    secondaryCta: "State Requirements",
    benefits: ["EOI Optimization", "State Priority Matching", "Skills Assessment Support"],
  },
  partner: {
    heroHeadline: "Partner Visa Pathways",
    heroSubtext: "Comprehensive support for partner and prospective marriage visa applications.",
    heroImage: "",
    primaryCta: "Start Application",
    secondaryCta: "Evidence Checklist",
    benefits: ["Evidence Planning", "Timeline Management", "Relationship Documentation"],
  },
  onshore: {
    heroHeadline: "Onshore to PR Strategy",
    heroSubtext: "Transform your temporary visa into permanent residency with our strategic audit and planning tools.",
    heroImage: "",
    primaryCta: "Get Strategy Audit",
    secondaryCta: "Calculate My Points",
    benefits: ["Visa Bridge Planning", "Work Experience Tracking", "Points Optimization"],
  },
  footer: {
    maraStatement: "MigrationPath is operated by registered migration agents. MARA Registration: XXXXXX",
    quickLinks: ["Home", "Points Calculator", "News", "Contact"],
    resourceLinks: ["2026 Priority Occupation List", "State Nomination Requirements", "Processing Times"],
  },
};

type PageKey = "home" | "student" | "skilled" | "partner" | "onshore";

const pageIcons: Record<PageKey, React.ElementType> = {
  home: Home,
  student: GraduationCap,
  skilled: Briefcase,
  partner: Users,
  onshore: Briefcase,
};

export function SiteConfigEditor() {
  const [config, setConfig] = useState<SiteConfig>(defaultConfig);
  const [livePreview, setLivePreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activePageTab, setActivePageTab] = useState<PageKey>("home");
  const { toast } = useToast();

  // Load config from API on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setIsLoading(true);
        const data = await siteConfigService.getConfig();
        if (!cancelled && data) {
          setConfig(data as unknown as SiteConfig);
        }
      } catch (err) {
        console.error("Failed to load site config:", err);
        toast({
          title: "Failed to Load",
          description: "Could not load site configuration. Using defaults.",
          variant: "destructive",
        });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await siteConfigService.updateConfig(config as unknown as SiteConfigData);
      toast({
        title: "Configuration Saved",
        description: "Your site configuration has been updated successfully.",
      });
    } catch (err) {
      console.error("Failed to save site config:", err);
      toast({
        title: "Save Failed",
        description: "Could not save site configuration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = (page: PageKey) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfig((prev) => ({
          ...prev,
          [page]: { ...prev[page], heroImage: reader.result as string },
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const updatePageConfig = (page: PageKey, field: string, value: string) => {
    setConfig((prev) => ({
      ...prev,
      [page]: { ...prev[page], [field]: value },
    }));
  };

  const updateBenefit = (page: PageKey, index: number, value: string) => {
    setConfig((prev) => ({
      ...prev,
      [page]: {
        ...prev[page],
        benefits: prev[page].benefits?.map((b, i) => (i === index ? value : b)),
      },
    }));
  };

  const currentPageConfig = config[activePageTab];
  const PageIcon = pageIcons[activePageTab];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Loading site configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Site Configuration</h1>
          <p className="text-muted-foreground">Manage content across all public pages</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={livePreview}
              onCheckedChange={setLivePreview}
              id="live-preview"
            />
            <Label htmlFor="live-preview" className="flex items-center gap-1.5 cursor-pointer">
              {livePreview ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              Live Preview
            </Label>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor Panel */}
        <div className="space-y-6">
          {/* Page Selector */}
          <Tabs value={activePageTab} onValueChange={(v) => setActivePageTab(v as PageKey)}>
            <TabsList className="grid h-auto w-full grid-cols-3 sm:grid-cols-5">
              {(Object.keys(pageIcons) as PageKey[]).map((page) => {
                const Icon = pageIcons[page];
                return (
                  <TabsTrigger key={page} value={page} className="gap-1.5 capitalize text-xs">
                    <Icon className="h-3.5 w-3.5" />
                    {page}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>

          <Accordion type="single" collapsible defaultValue="hero" className="space-y-3">
            {/* Hero Section */}
            <AccordionItem value="hero" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  <span>Hero Content</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Headline</Label>
                  <Input
                    value={currentPageConfig.heroHeadline}
                    onChange={(e) => updatePageConfig(activePageTab, "heroHeadline", e.target.value)}
                    placeholder="Enter headline..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subtext</Label>
                  <Textarea
                    value={currentPageConfig.heroSubtext}
                    onChange={(e) => updatePageConfig(activePageTab, "heroSubtext", e.target.value)}
                    placeholder="Enter subtext..."
                    rows={3}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Media Section */}
            <AccordionItem value="media" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  <span>Hero Image</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  {currentPageConfig.heroImage ? (
                    <div className="relative">
                      <img
                        src={currentPageConfig.heroImage}
                        alt="Hero preview"
                        className="max-h-40 mx-auto rounded-lg"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => updatePageConfig(activePageTab, "heroImage", "")}
                      >
                        Remove Image
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="mx-auto w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Upload Hero Image</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                      </div>
                      <Input
                        type="file"
                        accept="image/*"
                        className="max-w-xs mx-auto"
                        onChange={handleImageUpload(activePageTab)}
                      />
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* CTA Section */}
            <AccordionItem value="cta" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <MousePointer className="h-4 w-4" />
                  <span>Call-to-Action Buttons</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Primary CTA</Label>
                    <Input
                      value={currentPageConfig.primaryCta}
                      onChange={(e) => updatePageConfig(activePageTab, "primaryCta", e.target.value)}
                      placeholder="e.g., Get Started"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Secondary CTA</Label>
                    <Input
                      value={currentPageConfig.secondaryCta}
                      onChange={(e) => updatePageConfig(activePageTab, "secondaryCta", e.target.value)}
                      placeholder="e.g., Learn More"
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <Label className="text-xs text-muted-foreground">Preview</Label>
                  <div className="flex gap-3 mt-2">
                    <Button size="sm">{currentPageConfig.primaryCta}</Button>
                    <Button size="sm" variant="outline">{currentPageConfig.secondaryCta}</Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Benefits Section */}
            {currentPageConfig.benefits && (
              <AccordionItem value="benefits" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Benefit Points</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  {currentPageConfig.benefits.map((benefit, index) => (
                    <div key={index} className="space-y-1">
                      <Label className="text-xs">Benefit {index + 1}</Label>
                      <Input
                        value={benefit}
                        onChange={(e) => updateBenefit(activePageTab, index, e.target.value)}
                        placeholder={`Benefit ${index + 1}`}
                      />
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Home-specific: Outlook Section */}
            {activePageTab === "home" && (
              <AccordionItem value="outlook" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>2026 Migration Outlook</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Outlook Title</Label>
                    <Input
                      value={config.home.outlookTitle}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          home: { ...prev.home, outlookTitle: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Outlook Description</Label>
                    <Textarea
                      value={config.home.outlookDescription}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          home: { ...prev.home, outlookDescription: e.target.value },
                        }))
                      }
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Healthcare Processing</Label>
                      <Input
                        value={config.home.processingTimeHealthcare}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            home: { ...prev.home, processingTimeHealthcare: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tech Processing</Label>
                      <Input
                        value={config.home.processingTimeTech}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            home: { ...prev.home, processingTimeTech: e.target.value },
                          }))
                        }
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>

          {/* Footer Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Footer Settings</CardTitle>
              <CardDescription>Global footer content across all pages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>MARA Compliance Statement</Label>
                <Textarea
                  value={config.footer.maraStatement}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      footer: { ...prev.footer, maraStatement: e.target.value },
                    }))
                  }
                  rows={2}
                  className="text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview Panel */}
        {livePreview && (
          <Card className="overflow-hidden sticky top-6">
            <CardHeader className="bg-muted/50 py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Live Preview: {activePageTab.charAt(0).toUpperCase() + activePageTab.slice(1)} Page
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="bg-navy text-primary-foreground p-6 min-h-[350px] relative overflow-hidden">
                {currentPageConfig.heroImage && (
                  <div className="absolute inset-0 opacity-20">
                    <img src={currentPageConfig.heroImage} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-2 text-xs text-gold">
                    <PageIcon className="h-4 w-4" />
                    <span className="uppercase tracking-wider">{activePageTab} Pathway</span>
                  </div>
                  <h1 className="text-2xl font-bold leading-tight">{currentPageConfig.heroHeadline}</h1>
                  <p className="text-primary-foreground/80 text-sm max-w-md">{currentPageConfig.heroSubtext}</p>
                  
                  {currentPageConfig.benefits && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {currentPageConfig.benefits.map((benefit, i) => (
                        <span key={i} className="text-xs bg-white/10 px-2 py-1 rounded">
                          {benefit}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex gap-3 pt-3">
                    <Button size="sm" variant="accent">{currentPageConfig.primaryCta}</Button>
                    <Button size="sm" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                      {currentPageConfig.secondaryCta}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-muted/30 border-t text-xs text-muted-foreground">
                {config.footer.maraStatement}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}