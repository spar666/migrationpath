import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Save,
  X,
  Loader2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  useAllOccupationThresholds,
  upsertOccupationThreshold,
  deleteOccupationThreshold,
  OccupationThreshold,
} from "@/hooks/useOccupationThreshold";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type EditableThreshold = Partial<OccupationThreshold> & {
  isNew?: boolean;
};

export function InviteTrendsManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingThreshold, setEditingThreshold] = useState<EditableThreshold | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const { data: thresholds = [], isLoading, refetch } = useAllOccupationThresholds();

  const filteredThresholds = thresholds.filter(
    (t) =>
      t.anzsco_code.includes(searchQuery) ||
      searchQuery.length < 2
  );

  const handleSaveThreshold = async () => {
    if (!editingThreshold) return;

    if (!editingThreshold.anzsco_code) {
      toast({
        title: "Validation Error",
        description: "ANZSCO Code is required.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await upsertOccupationThreshold({
        anzsco_code: editingThreshold.anzsco_code,
        min_legal_points: editingThreshold.min_legal_points ?? 65,
        high_probability_points: editingThreshold.high_probability_points ?? 85,
        last_invite_date: editingThreshold.last_invite_date ?? null,
        trend_status: editingThreshold.trend_status ?? "stable",
      });

      toast({
        title: editingThreshold.isNew ? "Threshold Created" : "Threshold Updated",
        description: `ANZSCO ${editingThreshold.anzsco_code} has been saved successfully.`,
      });

      setIsDialogOpen(false);
      setEditingThreshold(null);
      refetch();
    } catch (error) {
      toast({
        title: "Error saving threshold",
        description: "Could not save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteThreshold = async (id: string) => {
    try {
      await deleteOccupationThreshold(id);
      setDeleteConfirm(null);
      refetch();
      toast({
        title: "Threshold Deleted",
        description: "The threshold has been removed.",
      });
    } catch (error) {
      toast({
        title: "Error deleting threshold",
        description: "Could not delete threshold. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openAddDialog = () => {
    setEditingThreshold({
      isNew: true,
      anzsco_code: "",
      min_legal_points: 65,
      high_probability_points: 85,
      trend_status: "stable",
      last_invite_date: format(new Date(), "yyyy-MM-dd"),
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (threshold: OccupationThreshold) => {
    setEditingThreshold({ ...threshold, isNew: false });
    setIsDialogOpen(true);
  };

  const getTrendBadge = (status: string | null) => {
    switch (status) {
      case "rising":
        return (
          <Badge className="bg-red-500/15 text-red-600 border-red-500/30 gap-1">
            <TrendingUp className="h-3 w-3" />
            Rising
          </Badge>
        );
      case "falling":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 gap-1">
            <TrendingDown className="h-3 w-3" />
            Falling
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1">
            <Minus className="h-3 w-3" />
            Stable
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Invite Trends</h2>
        <p className="text-muted-foreground text-sm">
          Manage high-probability points thresholds by ANZSCO code after each invitation round
        </p>
      </div>

      {/* Search and Add */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ANZSCO code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={() => refetch()} className="gap-2">
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          Refresh
        </Button>
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Threshold
        </Button>
      </div>

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">ANZSCO Code</TableHead>
                <TableHead className="w-[100px]">Min Points</TableHead>
                <TableHead className="w-[140px]">High Probability</TableHead>
                <TableHead>Trend</TableHead>
                <TableHead>Last Invite</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredThresholds.map((threshold) => (
                <TableRow key={threshold.id}>
                  <TableCell className="font-mono text-sm font-medium">
                    {threshold.anzsco_code}
                  </TableCell>
                  <TableCell>{threshold.min_legal_points ?? 65} pts</TableCell>
                  <TableCell>
                    <span className="font-semibold text-primary">
                      {threshold.high_probability_points ?? 85} pts
                    </span>
                  </TableCell>
                  <TableCell>{getTrendBadge(threshold.trend_status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {threshold.last_invite_date
                      ? format(new Date(threshold.last_invite_date), "dd MMM yyyy")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(threshold)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteConfirm(threshold.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredThresholds.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {searchQuery
                      ? `No thresholds found for "${searchQuery}"`
                      : "No invite thresholds configured yet. Add one to get started."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Edit/Add Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingThreshold?.isNew ? "Add Invite Threshold" : "Edit Invite Threshold"}
            </DialogTitle>
            <DialogDescription>
              Set the high-probability points threshold for this occupation
            </DialogDescription>
          </DialogHeader>
          {editingThreshold && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>ANZSCO Code</Label>
                <Input
                  value={editingThreshold.anzsco_code || ""}
                  onChange={(e) =>
                    setEditingThreshold((prev) =>
                      prev ? { ...prev, anzsco_code: e.target.value } : null
                    )
                  }
                  placeholder="e.g., 261313"
                  disabled={!editingThreshold.isNew}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Min Legal Points</Label>
                  <Input
                    type="number"
                    value={editingThreshold.min_legal_points ?? 65}
                    onChange={(e) =>
                      setEditingThreshold((prev) =>
                        prev
                          ? { ...prev, min_legal_points: parseInt(e.target.value) || 65 }
                          : null
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>High Probability Points</Label>
                  <Input
                    type="number"
                    value={editingThreshold.high_probability_points ?? 85}
                    onChange={(e) =>
                      setEditingThreshold((prev) =>
                        prev
                          ? {
                              ...prev,
                              high_probability_points: parseInt(e.target.value) || 85,
                            }
                          : null
                      )
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Trend Status</Label>
                <Select
                  value={editingThreshold.trend_status || "stable"}
                  onValueChange={(v) =>
                    setEditingThreshold((prev) =>
                      prev ? { ...prev, trend_status: v } : null
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stable">Stable</SelectItem>
                    <SelectItem value="rising">Rising (Points increasing)</SelectItem>
                    <SelectItem value="falling">Falling (Points decreasing)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Last Invite Date</Label>
                <Input
                  type="date"
                  value={editingThreshold.last_invite_date || ""}
                  onChange={(e) =>
                    setEditingThreshold((prev) =>
                      prev ? { ...prev, last_invite_date: e.target.value } : null
                    )
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSaveThreshold} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Threshold?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the invite threshold for this occupation. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirm && handleDeleteThreshold(deleteConfirm)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
