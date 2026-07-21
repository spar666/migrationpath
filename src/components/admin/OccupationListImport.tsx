import { useState, useEffect, useCallback } from "react";
import { Briefcase, Upload, Loader2, CheckCircle2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import { FreshnessBadge } from "@/components/common/FreshnessBadge";
import {
  dataFreshnessService,
  type FreshnessRow,
} from "@/services/dataFreshnessService";

const DOMAIN = "occupation_lists";
const LISTS = ["MLTSSL", "STSOL", "ROL", "CSOL"];

interface ImportResult {
  updated: number;
  updatedCodes: string[];
  notFound: string[];
  visasResynced: boolean;
}

function unwrap<T>(res: any): T {
  if (res && typeof res === "object" && "data" in res && res.data !== undefined)
    return res.data as T;
  return res as T;
}

export function OccupationListImport() {
  const [csv, setCsv] = useState("");
  const [resyncVisas, setResyncVisas] = useState(true);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [freshness, setFreshness] = useState<FreshnessRow | null>(null);

  const loadFreshness = useCallback(async () => {
    try {
      const f = await dataFreshnessService.getAll();
      setFreshness(f.find((x) => x.domain === DOMAIN) ?? null);
    } catch {
      /* non-blocking */
    }
  }, []);

  useEffect(() => {
    loadFreshness();
  }, [loadFreshness]);

  const markVerified = async () => {
    try {
      setFreshness(await dataFreshnessService.verify(DOMAIN));
      toast.success("Marked as verified.");
    } catch {
      toast.error("Could not update verification status.");
    }
  };

  const runImport = async () => {
    const rows = csv
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const [anzscoCode, primaryList] = line.split(",").map((s) => s.trim());
        return { anzscoCode, primaryList: (primaryList || "").toUpperCase() };
      })
      .filter((r) => r.anzscoCode && LISTS.includes(r.primaryList));

    if (!rows.length) {
      toast.error("No valid rows. Format: 261313,MLTSSL");
      return;
    }
    setImporting(true);
    try {
      const res = await apiClient.post<any>("/admin/occupations/import-lists", {
        resyncVisas,
        rows,
      });
      const data = unwrap<ImportResult>(res);
      setResult(data);
      toast.success(`Updated ${data.updated} occupation(s).`);
    } catch {
      toast.error("Import failed.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Briefcase className="h-6 w-6 text-accent" />
            Occupation Lists
          </h1>
          <p className="text-muted-foreground">
            Bulk-apply skilled-list membership (MLTSSL/STSOL/ROL/CSOL) by ANZSCO
            code — the way the lists change at each instrument update.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {freshness && (
            <FreshnessBadge
              status={freshness.status}
              daysSinceVerified={freshness.daysSinceVerified}
            />
          )}
          <Button variant="outline" size="sm" onClick={markVerified}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Mark verified
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bulk import</CardTitle>
          <CardDescription>
            One occupation per line: <code>261313,MLTSSL</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            rows={8}
            placeholder={"261313,MLTSSL\n254411,MLTSSL\n221111,STSOL"}
            className="font-mono text-sm"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={resyncVisas}
                onChange={(e) => setResyncVisas(e.target.checked)}
              />
              Re-resolve visa links after import
            </label>
            <Button onClick={runImport} disabled={importing}>
              {importing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Import
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Last import</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-semibold text-emerald-600">
                {result.updated}
              </span>{" "}
              occupation(s) updated
              {result.visasResynced ? " · visa links re-resolved" : ""}.
            </p>
            {result.notFound.length > 0 && (
              <div>
                <p className="font-semibold text-amber-600">
                  {result.notFound.length} ANZSCO code(s) not found:
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {result.notFound.map((c) => (
                    <Badge key={c} variant="outline" className="font-mono text-xs">
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
