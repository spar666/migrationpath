import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { siteConfigService, type SiteConfigData } from "@/services/siteConfigService";

interface SiteConfigContextValue {
  config: SiteConfigData | null;
  isLoading: boolean;
}

const SiteConfigContext = createContext<SiteConfigContextValue>({
  config: null,
  isLoading: true,
});

export function SiteConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SiteConfigData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    siteConfigService
      .getPublicConfig()
      .then((data) => {
        if (!cancelled) setConfig(data);
      })
      .catch((err) => {
        console.error("Failed to load public site config:", err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SiteConfigContext.Provider value={{ config, isLoading }}>
      {children}
    </SiteConfigContext.Provider>
  );
}

/**
 * Hook to access the public site configuration.
 * Returns `{ config, isLoading }`.
 * `config` is null until fetched; components should fall back to hardcoded defaults when null.
 */
export function useSiteConfig() {
  return useContext(SiteConfigContext);
}
