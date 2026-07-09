import { useState, useEffect, useCallback } from "react";
import { Scale, Save, Loader2, ExternalLink } from "lucide-react";
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
import { toast } from "sonner";
import {
  policyConfigService,
  type PolicyConfigItem,
} from "@/services/policyConfigService";

const CATEGORY_LABELS: Record<string, string> = {
  points: "Points Test (GSM)",
  partner: "Partner Visa — Evidentiary Weights",
  parent: "Parent Visa — Legislative Gates",
};

const CATEGORY_ORDER = ["points", "partner", "parent"];

export function PolicyConfigManager() {
  const [items, setItems] = useState<PolicyConfigItem[]>([]);
  const [drafts, setDrafts] = useState<Record<string, PolicyConfigItem>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await policyConfigService.getAll();
      setItems(data);
      setDrafts(
        data.reduce<Record<string, PolicyConfigItem>>((acc, item) => {
          acc[item.configKey] = { ...item };
          return acc;
        }, {}),
      );
    } catch {
      toast.error("Failed to load legislative settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const patchDraft = (key: string, partial: Partial<PolicyConfigItem>) =>
    setDrafts((prev) => ({ ...prev, [key]: { ...prev[key], ...partial } }));

  const isDirty = (item: PolicyConfigItem) => {
    const d = drafts[item.configKey];
    if (!d) return false;
    return (
      Number(d.numericValue) !== Number(item.numericValue) ||
      (d.sourceNote ?? "") !== (item.sourceNote ?? "") ||
      (d.effectiveDate ?? "") !== (item.effectiveDate ?? "")
    );
  };

  const save = async (key: string) => {
    const d = drafts[key];
    if (!d) return;
    setSavingKey(key);
    try {
      const updated = await policyConfigService.update(key, {
        numericValue: Number(d.numericValue),
        sourceNote: d.sourceNote ?? undefined,
        effectiveDate: d.effectiveDate ?? undefined,
      });
      setItems((prev) => prev.map((i) => (i.configKey === key ? updated : i)));
      setDrafts((prev) => ({ ...prev, [key]: { ...updated } }));
      toast.success(`Updated "${updated.label}".`);
    } catch {
      toast.error("Failed to save. Check the value and try again.");
    } finally {
      setSavingKey(null);
    }
  };

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat] ?? cat,
    rows: items.filter((i) => i.category === cat),
  })).filter((g) => g.rows.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Scale className="h-6 w-6 text-accent" />
          Legislative Settings
        </h1>
        <p className="text-muted-foreground">
          Cross-check these against the current Home Affairs / Centrelink
          instruments and update them when policy changes. Values feed the points,
          partner, and parent engines directly — no code deploy required.
        </p>
      </div>

      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="flex items-start gap-3 py-4 text-sm text-amber-800">
          <ExternalLink className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            The points pass mark is legislated; the partner weights and the parent
            AoS baseline are indicative heuristics. Record the source you verified
            each value against so the next reviewer can re-check it quickly.
          </span>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading settings…
        </div>
      ) : (
        grouped.map((group) => (
          <Card key={group.category}>
            <CardHeader>
              <CardTitle className="text-lg">{group.label}</CardTitle>
              <CardDescription>
                {group.rows.length} configurable value
                {group.rows.length === 1 ? "" : "s"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {group.rows.map((item) => {
                const d = drafts[item.configKey] ?? item;
                const dirty = isDirty(item);
                return (
                  <div
                    key={item.configKey}
                    className="rounded-xl border border-border/60 p-4"
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground">
                          {item.label}
                        </p>
                        {item.description && (
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="font-mono text-xs">
                        {item.configKey}
                      </Badge>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-4">
                      <div className="space-y-1">
                        <Label className="text-xs">
                          Value{item.unit ? ` (${item.unit})` : ""}
                        </Label>
                        <Input
                          type="number"
                          value={d.numericValue}
                          onChange={(e) =>
                            patchDraft(item.configKey, {
                              numericValue: parseFloat(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-xs">Source / verification note</Label>
                        <Input
                          value={d.sourceNote ?? ""}
                          placeholder="e.g. Migration Regulations 1994, Sch 6D / verified 2026-07"
                          onChange={(e) =>
                            patchDraft(item.configKey, {
                              sourceNote: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Effective date</Label>
                        <Input
                          type="date"
                          value={d.effectiveDate ?? ""}
                          onChange={(e) =>
                            patchDraft(item.configKey, {
                              effectiveDate: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end">
                      <Button
                        size="sm"
                        disabled={!dirty || savingKey === item.configKey}
                        onClick={() => save(item.configKey)}
                      >
                        {savingKey === item.configKey ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        Save
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
