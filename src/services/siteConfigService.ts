import { apiClient } from "@/lib/apiClient";

export interface PageConfig {
  heroHeadline: string;
  heroSubtext: string;
  heroImage: string;
  primaryCta: string;
  secondaryCta: string;
  benefits?: string[];
}

export interface HomePageConfig extends PageConfig {
  outlookTitle: string;
  outlookDescription: string;
  processingTimeHealthcare: string;
  processingTimeTech: string;
}

export interface FooterConfig {
  maraStatement: string;
  quickLinks: string[];
  resourceLinks: string[];
}

export interface VisaDetail { subclass: string; title: string; description: string; }
export interface VisaCategory { description?: string; buttonLabel?: string; slug: string; title: string; visas: VisaDetail[]; }

export interface SiteConfigData {
  visaCategories?: VisaCategory[];
  home: HomePageConfig;
  skilled: PageConfig;
  partner: PageConfig;
  footer: FooterConfig;
}

function unwrap<T>(res: any): T {
  if (res && typeof res === "object" && "data" in res && res.data !== undefined) {
    return res.data as T;
  }
  return res as T;
}

class SiteConfigService {
  /** Fetch the current site configuration (admin endpoint). */
  async getConfig(): Promise<SiteConfigData> {
    const res = await apiClient.get<any>("/admin/site-config");
    return unwrap<SiteConfigData>(res);
  }

  /** Update the full site configuration. */
  async updateConfig(data: SiteConfigData): Promise<SiteConfigData> {
    const res = await apiClient.put<any>("/admin/site-config", data);
    const saved = unwrap<SiteConfigData>(res);
    window.dispatchEvent(new CustomEvent("site-config-updated", { detail: saved }));
    return saved;
  }

  /** Fetch the public site configuration (no auth required). */
  async getPublicConfig(): Promise<SiteConfigData> {
    const res = await apiClient.get<any>("/public/site-config");
    return unwrap<SiteConfigData>(res);
  }
}

export const siteConfigService = new SiteConfigService();
