import { useState, useEffect, useCallback } from "react";
import { MapPin, Plus, Trash2, Upload, Loader2, CheckCircle2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { FreshnessBadge } from "@/components/common/FreshnessBadge";
import {
  regionalPostcodeService,
  type RegionalBand,
  type RegionalCategory,
  type CreateRegionalBand,
} from "@/services/regionalPostcodeService";
import {
  dataFreshnessService,
  type FreshnessRow,
} from "@/services/dataFreshnessService";

const CATEGORIES: RegionalCategory[] = ["METRO", "CATEGORY_2", "CATEGORY_3"];
const CATEGORY_LABEL: Record<RegionalCategory, string> = {
  METRO: "Metro (excluded)",
  CATEGORY_2: "Category 2",
  CATEGORY_3: "Category 3",
};
const DOMAIN = "regional_postcodes";

function parseCsv(text: string): CreateRegionalBand[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [region, category, from, to] = line.split(",").map((s) => s.trim());
      return {
        region,
        category: category as RegionalCategory,
        postcodeFrom: parseInt(from, 10),
        postcodeTo: parseInt(to, 10),
      };
    })
    .filter(
      (r) =>
        r.region &&
        CATEGORIES.includes(r.category) &&
        !Number.isNaN(r.postcodeFrom) &&
        !Number.isNaN(r.postcodeTo),
    );
}

export function RegionalPostcodeManager() {
  const [bands, setBands] = useState<RegionalBand[]>([]);
  const [freshness, setFreshness] = useState<FreshnessRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [csv, setCsv] = useState("");
  const [replaceAll, setReplaceAll] = useState(false);
  const [importing, setImporting] = useState(false);
  const [draft, setDraft] = useState<CreateRegionalBand>({
    region: "",
    category: "CATEGORY_2",
    postcodeFrom: 0,
    postcodeTo: 0,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [b, f] = await Promise.all([
        regionalPostcodeService.getAll(),
        dataFreshnessService.getAll(),
      ]);
      setBands(b);
      setFreshness(f.find((x) => x.domain === DOMAIN) ?? null);
    } catch {
      toast.error("Failed to load regional postcode bands.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markVerified = async () => {
    try {
      const updated = await dataFreshnessService.verify(DOMAIN);
      setFreshness(updated);
      toast.success("Marked as verified.");
    } catch {
      toast.error("Could not update verification status.");
    }
  };

  const addBand = async () => {
    if (!draft.region || !draft.postcodeFrom || !draft.postcodeTo) {
      toast.error("Fill region and postcode range.");
      return;
    }
    try {
      await regionalPostcodeService.create(draft);
      setDraft({ region: "", category: "CATEGORY_2", postcodeFrom: 0, postcodeTo: 0 });
      toast.success("Band added.");
      load();
    } catch {
      toast.error("Failed to add band.");
    }
  };

  const removeBand = async (id: string) => {
    try {
      await regionalPostcodeService.remove(id);
      setBands((prev) => prev.filter((b) => b.id !== id));
      toast.success("Band removed.");
    } catch {
      toast.error("Failed to remove band.");
    }
  };

  const runImport = async () => {
    const rows = parseCsv(csv);
    if (!rows.length) {
      toast.error("No valid rows. Format: region,CATEGORY_2,3211,3230");
      return;
    }
    setImporting(true);
    try {
      const res = await regionalPostcodeService.bulkImport(replaceAll, rows);
      toast.success(
        `Imported ${res.imported} band(s)${
          res.deactivated ? `, deactivated ${res.deactivated}` : ""
        }.`,
      );
      setCsv("");
      load();
    } catch {
      toast.error("Import failed. Check the CSV format.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <MapPin className="h-6 w-6 text-accent" />
            Regional Postcodes
          </h1>
          <p className="text-muted-foreground">
            The designated-regional-area bands that drive the +5 regional points.
            Reconcile against the current Home Affairs instrument and mark as
            verified.
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

      {/* Bulk import */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bulk import</CardTitle>
          <CardDescription>
            One band per line: <code>region,CATEGORY_2,3211,3230</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            rows={5}
            placeholder={"Geelong,CATEGORY_2,3211,3230\nBallarat,CATEGORY_3,3350,3356"}
            className="font-mono text-sm"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={replaceAll}
                onChange={(e) => setReplaceAll(e.target.checked)}
              />
              Replace all existing bands
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

      {/* Add single band */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add a band</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-5">
            <div className="sm:col-span-2">
              <Label className="text-xs">Region</Label>
              <Input
                value={draft.region}
                onChange={(e) => setDraft({ ...draft, region: e.target.value })}
                placeholder="e.g. Geelong"
              />
            </div>
            <div>
              <Label className="text-xs">Category</Label>
              <Select
                value={draft.category}
                onValueChange={(v) =>
                  setDraft({ ...draft, category: v as RegionalCategory })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_LABEL[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">From</Label>
              <Input
                type="number"
                value={draft.postcodeFrom || ""}
                onChange={(e) =>
                  setDraft({ ...draft, postcodeFrom: parseInt(e.target.value, 10) || 0 })
                }
              />
            </div>
            <div>
              <Label className="text-xs">To</Label>
              <Input
                type="number"
                value={draft.postcodeTo || ""}
                onChange={(e) =>
                  setDraft({ ...draft, postcodeTo: parseInt(e.target.value, 10) || 0 })
                }
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Button size="sm" onClick={addBand}>
              <Plus className="mr-2 h-4 w-4" />
              Add band
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Current bands {loading ? "" : `(${bands.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
            </div>
          ) : (
            <div className="divide-y">
              {bands.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      {CATEGORY_LABEL[b.category]}
                    </Badge>
                    <span className="font-medium text-foreground">
                      {b.region}
                    </span>
                    <span className="font-mono text-sm text-muted-foreground">
                      {b.postcodeFrom}–{b.postcodeTo}
                    </span>
                    {!b.isActive && (
                      <Badge variant="secondary" className="text-xs">
                        inactive
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeBand(b.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
