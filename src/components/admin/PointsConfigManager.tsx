import { useState, useEffect } from "react";
import { apiClient } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Pencil, Trash2, Calculator, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

/**
 * WARNING — this screen does not currently drive the calculator.
 *
 * It reads and writes `/admin/points-config` (the `points_config` table:
 * category / attribute_name / points_value / persona_type).
 *
 * The calculator posts to `/points/calculate/total`, and the engine behind it
 * (`points-engine/points-aggregator.service.ts`) reads its bracket values from
 * a DIFFERENT table — `points_rule`, keyed by `visa_group` — plus two scalars
 * from `policy_config` (`points.gsmPassMark`, `points.combinedWorkCap`).
 *
 * So the calculator IS config-driven, just not by this screen. Editing a row
 * here changes nothing a visitor sees. Until the backend either points this
 * screen at `points_rule` or migrates the engine onto `points_config`, the
 * copy below has to say so — the previous version claimed "changes apply
 * instantly to all users" and told an admin that adding a rule here would
 * "enable the calculator", neither of which is true.
 */
interface PointsConfig {
  id: string;
  category: string;
  attribute_name: string;
  points_value: number;
  is_active: boolean;
  persona_type: string | null;
  updated_at: string | null;
}

const CATEGORIES = ["Age", "English", "Education", "Experience", "Partner", "Bonus"];

export function PointsConfigManager() {
  const [configs, setConfigs] = useState<PointsConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingConfig, setEditingConfig] = useState<PointsConfig | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    category: "",
    attribute_name: "",
    points_value: 0,
    is_active: true,
    persona_type: "skilled",
  });

  const fetchConfigs = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.get<PointsConfig[]>("/admin/points-config");
      setConfigs(data || []);
    } catch (err) {
      console.error("Error fetching configs:", err);
      toast.error("Failed to load points configuration");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const openAddDialog = () => {
    setEditingConfig(null);
    setFormData({
      category: "",
      attribute_name: "",
      points_value: 0,
      is_active: true,
      persona_type: "skilled",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (config: PointsConfig) => {
    setEditingConfig(config);
    setFormData({
      category: config.category,
      attribute_name: config.attribute_name,
      points_value: config.points_value,
      is_active: config.is_active,
      persona_type: config.persona_type || "skilled",
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.category || !formData.attribute_name) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSaving(true);
    try {
      if (editingConfig) {
        await apiClient.put(`/admin/points-config/${editingConfig.id}`, {
          category: formData.category,
          attribute_name: formData.attribute_name,
          points_value: formData.points_value,
          is_active: formData.is_active,
          persona_type: formData.persona_type,
        });
        toast.success("Points configuration updated");
      } else {
        await apiClient.post("/admin/points-config", {
          category: formData.category,
          attribute_name: formData.attribute_name,
          points_value: formData.points_value,
          is_active: formData.is_active,
          persona_type: formData.persona_type,
        });
        toast.success("Points configuration added");
      }

      setIsDialogOpen(false);
      fetchConfigs();
    } catch (err) {
      console.error("Error saving config:", err);
      toast.error("Failed to save configuration");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this configuration?")) return;

    try {
      await apiClient.delete(`/admin/points-config/${id}`);
      toast.success("Configuration deleted");
      fetchConfigs();
    } catch (err) {
      console.error("Error deleting config:", err);
      toast.error("Failed to delete configuration");
    }
  };

  const toggleActive = async (config: PointsConfig) => {
    try {
      await apiClient.put(`/admin/points-config/${config.id}`, {
        is_active: !config.is_active,
      });
      toast.success(`Configuration ${!config.is_active ? "activated" : "deactivated"}`);
      fetchConfigs();
    } catch (err) {
      console.error("Error toggling config:", err);
      toast.error("Failed to update configuration");
    }
  };

  // Group configs by category
  const groupedConfigs = configs.reduce((acc, config) => {
    if (!acc[config.category]) {
      acc[config.category] = [];
    }
    acc[config.category].push(config);
    return acc;
  }, {} as Record<string, PointsConfig[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Calculator className="w-6 h-6 text-primary" />
            Points Configuration
          </h2>
          <p className="text-muted-foreground mt-1">
            Point values stored against personas, for reference.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchConfigs} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog} className="btn-elite">
                <Plus className="w-4 h-4 mr-2" />
                Add Points Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingConfig ? "Edit Points Rule" : "Add Points Rule"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Attribute Name *</Label>
                  <Input
                    value={formData.attribute_name}
                    onChange={(e) => setFormData({ ...formData, attribute_name: e.target.value })}
                    placeholder="e.g., 25-32 years"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Points Value</Label>
                  <Input
                    type="number"
                    value={formData.points_value}
                    onChange={(e) => setFormData({ ...formData, points_value: parseInt(e.target.value) || 0 })}
                    min={0}
                    max={50}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Active</Label>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>

                <Button onClick={handleSave} disabled={isSaving} className="w-full btn-gold">
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {editingConfig ? "Update Rule" : "Add Rule"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* The screen has to be honest about what it does before an admin
          spends an afternoon editing values that reach nobody. */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            These values are not yet connected to the public calculator.
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The calculator is config-driven, but it reads the{" "}
            <code className="font-mono">points_rule</code> brackets and the{" "}
            <code className="font-mono">policy_config</code> pass mark — not this
            table. Edits here are stored and shown here, and change nothing a
            visitor sees. Connecting the two is a backend change.
          </p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedConfigs).map(([category, items]) => (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  {category}
                  <Badge variant="secondary" className="ml-2">
                    {items.length} rules
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Attribute</TableHead>
                      <TableHead className="w-24 text-center">Points</TableHead>
                      <TableHead className="w-24 text-center">Status</TableHead>
                      <TableHead className="w-32 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((config) => (
                      <TableRow key={config.id}>
                        <TableCell className="font-medium">{config.attribute_name}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={config.points_value > 0 ? "default" : "secondary"}>
                            +{config.points_value}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={config.is_active}
                            onCheckedChange={() => toggleActive(config)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(config)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(config.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}

          {Object.keys(groupedConfigs).length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Calculator className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">No Points Rules Configured</h3>
                <p className="text-muted-foreground mb-4">
                  Nothing has been stored in this table. The public calculator is
                  unaffected either way — it scores from{" "}
                  <code className="font-mono">points_rule</code>, which is seeded
                  separately.
                </p>
                <Button onClick={openAddDialog}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Rule
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
