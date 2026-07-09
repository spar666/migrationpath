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

export interface SiteConfigData {
  home: HomePageConfig;
  student: PageConfig;
  skilled: PageConfig;
  partner: PageConfig;
  onshore: PageConfig;
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
    return unwrap<SiteConfigData>(res);
  }

  /** Fetch the public site configuration (no auth required). */
  async getPublicConfig(): Promise<SiteConfigData> {
    const res = await apiClient.get<any>("/public/site-config");
    return unwrap<SiteConfigData>(res);
  }
}

export const siteConfigService = new SiteConfigService();
