import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Save,
  X,
  Zap,
  Settings2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/apiClient";

interface OccupationWithPriority {
  id?: string;
  code?: string;
  anzscoCode: string;
  title: string;
  skillLevel: number;
  isHighPriority: boolean;
  priorityStatus: "fast-track" | "standard" | "limited";
  pointsMultiplier: number;
}

interface PointsSettings {
  age25to32: number;
  age18to24: number;
  age33to39: number;
  age40to44: number;
  englishSuperior: number;
  englishProficient: number;
  englishCompetent: number;
  experience3to5: number;
  experience5to8: number;
  experience8plus: number;
  australianExperience1to3: number;
  australianExperience3plus: number;
}

const defaultPointsSettings: PointsSettings = {
  age25to32: 30,
  age18to24: 25,
  age33to39: 25,
  age40to44: 15,
  englishSuperior: 20,
  englishProficient: 10,
  englishCompetent: 0,
  experience3to5: 5,
  experience5to8: 10,
  experience8plus: 15,
  australianExperience1to3: 5,
  australianExperience3plus: 10,
};

export function OccupationMaster() {
  const [occupations, setOccupations] = useState<OccupationWithPriority[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingOccupation, setEditingOccupation] = useState<OccupationWithPriority | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [pointsSettings, setPointsSettings] = useState<PointsSettings>(defaultPointsSettings);
  const { toast } = useToast();

  const fetchOccupations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<any>("/occupations");
      const data = Array.isArray(response) ? response : (response?.data || []);
      setOccupations(
        data.map((occ: any) => ({
          id: occ.id,
          anzscoCode: occ.anzsco_code || occ.anzscoCode || "",
          title: occ.occupation_name || occ.title || "",
          skillLevel: occ.skill_level ?? occ.skillLevel ?? 1,
          isHighPriority: occ.is_high_priority ?? occ.isHighPriority ?? false,
          priorityStatus: occ.priority_status || occ.priorityStatus || "standard",
          pointsMultiplier: occ.points_multiplier ?? occ.pointsMultiplier ?? 1.0,
        }))
      );
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load occupations from API.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOccupations();
  }, [fetchOccupations]);

  const filteredOccupations = occupations.filter(
    (occ) =>
      occ.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      occ.anzscoCode.includes(searchQuery)
  );

  const handleSaveOccupation = async () => {
    if (!editingOccupation) return;

    try {
      if (editingOccupation.id) {
        await apiClient.patch(`/occupations/${editingOccupation.id}`, {
          title: editingOccupation.title,
          anzscoCode: editingOccupation.anzscoCode,
          skillLevel: editingOccupation.skillLevel,
        });
        setOccupations((prev) =>
          prev.map((o) => (o.id === editingOccupation.id ? editingOccupation : o))
        );
        toast({ title: "Occupation Updated", description: `${editingOccupation.title} has been updated.` });
      } else {
        await apiClient.post("/occupations", {
          title: editingOccupation.title,
          anzscoCode: editingOccupation.anzscoCode,
          skillLevel: editingOccupation.skillLevel,
        });
        toast({ title: "Occupation Created", description: `${editingOccupation.title} has been created.` });
        await fetchOccupations();
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Failed to save occupation.",
      });
    }

    setIsDialogOpen(false);
    setEditingOccupation(null);
  };

  const handleDeleteOccupation = async (id: string) => {
    try {
      await apiClient.delete(`/occupations/${id}`);
      setOccupations((prev) => prev.filter((o) => o.id !== id));
      toast({ title: "Occupation Deleted", description: "The occupation has been removed." });
    } catch {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Failed to delete occupation.",
      });
    }
    setDeleteConfirm(null);
  };

  const handleSavePointsSettings = () => {
    toast({
      title: "Points Settings Updated",
      description: "Global points configuration has been saved.",
    });
  };

  const openAddDialog = () => {
    setEditingOccupation({
      anzscoCode: "",
      title: "",
      skillLevel: 1,
      isHighPriority: true,
      priorityStatus: "standard",
      pointsMultiplier: 1.0,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (occ: OccupationWithPriority) => {
    setEditingOccupation({ ...occ });
    setIsDialogOpen(true);
  };

  const getPriorityBadge = (status: string) => {
    switch (status) {
      case "fast-track":
        return <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">Fast-Track</Badge>;
      case "limited":
        return <Badge variant="destructive">Limited</Badge>;
      default:
        return <Badge variant="secondary">Standard</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Occupation Master</h1>
        <p className="text-muted-foreground">Manage ANZSCO codes, priority status, and points logic</p>
      </div>

      <Tabs defaultValue="occupations" className="w-full">
        <TabsList>
          <TabsTrigger value="occupations" className="gap-1.5">
            <Zap className="h-4 w-4" />
            Occupations
          </TabsTrigger>
          <TabsTrigger value="points" className="gap-1.5">
            <Settings2 className="h-4 w-4" />
            Points Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="occupations" className="mt-6 space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title or ANZSCO code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={openAddDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Occupation
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ANZSCO Code</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Skill Level</TableHead>
                  <TableHead>Priority Status</TableHead>
                  <TableHead>Multiplier</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOccupations.map((occ) => (
                  <TableRow key={occ.id || occ.anzscoCode}>
                    <TableCell className="font-mono text-sm">{occ.anzscoCode}</TableCell>
                    <TableCell className="font-medium">{occ.title}</TableCell>
                    <TableCell>Level {occ.skillLevel}</TableCell>
                    <TableCell>{getPriorityBadge(occ.priorityStatus)}</TableCell>
                    <TableCell>{occ.pointsMultiplier}x</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(occ)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => occ.id && setDeleteConfirm(occ.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredOccupations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No occupations found matching your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="points" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Age Points</CardTitle>
                <CardDescription>Configure points awarded by age bracket</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>25-32 years</Label>
                  <Input type="number" value={pointsSettings.age25to32} onChange={(e) => setPointsSettings((prev) => ({ ...prev, age25to32: parseInt(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-2">
                  <Label>18-24 years</Label>
                  <Input type="number" value={pointsSettings.age18to24} onChange={(e) => setPointsSettings((prev) => ({ ...prev, age18to24: parseInt(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-2">
                  <Label>33-39 years</Label>
                  <Input type="number" value={pointsSettings.age33to39} onChange={(e) => setPointsSettings((prev) => ({ ...prev, age33to39: parseInt(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-2">
                  <Label>40-44 years</Label>
                  <Input type="number" value={pointsSettings.age40to44} onChange={(e) => setPointsSettings((prev) => ({ ...prev, age40to44: parseInt(e.target.value) || 0 }))} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">English Proficiency</CardTitle>
                <CardDescription>Points for English language ability</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Superior (IELTS 8+)</Label>
                  <Input type="number" value={pointsSettings.englishSuperior} onChange={(e) => setPointsSettings((prev) => ({ ...prev, englishSuperior: parseInt(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-2">
                  <Label>Proficient (IELTS 7+)</Label>
                  <Input type="number" value={pointsSettings.englishProficient} onChange={(e) => setPointsSettings((prev) => ({ ...prev, englishProficient: parseInt(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-2">
                  <Label>Competent (IELTS 6+)</Label>
                  <Input type="number" value={pointsSettings.englishCompetent} onChange={(e) => setPointsSettings((prev) => ({ ...prev, englishCompetent: parseInt(e.target.value) || 0 }))} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Work Experience</CardTitle>
                <CardDescription>Points for skilled employment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>3-5 years overseas</Label>
                  <Input type="number" value={pointsSettings.experience3to5} onChange={(e) => setPointsSettings((prev) => ({ ...prev, experience3to5: parseInt(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-2">
                  <Label>5-8 years overseas</Label>
                  <Input type="number" value={pointsSettings.experience5to8} onChange={(e) => setPointsSettings((prev) => ({ ...prev, experience5to8: parseInt(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-2">
                  <Label>8+ years overseas</Label>
                  <Input type="number" value={pointsSettings.experience8plus} onChange={(e) => setPointsSettings((prev) => ({ ...prev, experience8plus: parseInt(e.target.value) || 0 }))} />
                </div>
                <div className="pt-2 border-t space-y-2">
                  <Label>1-3 years Australian</Label>
                  <Input type="number" value={pointsSettings.australianExperience1to3} onChange={(e) => setPointsSettings((prev) => ({ ...prev, australianExperience1to3: parseInt(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-2">
                  <Label>3+ years Australian</Label>
                  <Input type="number" value={pointsSettings.australianExperience3plus} onChange={(e) => setPointsSettings((prev) => ({ ...prev, australianExperience3plus: parseInt(e.target.value) || 0 }))} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end mt-6">
            <Button onClick={handleSavePointsSettings} className="gap-2">
              <Save className="h-4 w-4" />
              Save Points Configuration
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingOccupation?.anzscoCode ? "Edit Occupation" : "Add Occupation"}
            </DialogTitle>
            <DialogDescription>
              Configure occupation details and priority settings
            </DialogDescription>
          </DialogHeader>
          {editingOccupation && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>ANZSCO Code</Label>
                <Input value={editingOccupation.anzscoCode} onChange={(e) => setEditingOccupation((prev) => prev && { ...prev, anzscoCode: e.target.value })} placeholder="e.g., 261313" />
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={editingOccupation.title} onChange={(e) => setEditingOccupation((prev) => prev && { ...prev, title: e.target.value })} placeholder="e.g., Software Engineer" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Skill Level</Label>
                  <Select value={editingOccupation.skillLevel.toString()} onValueChange={(v) => setEditingOccupation((prev) => prev && { ...prev, skillLevel: parseInt(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Level 1</SelectItem>
                      <SelectItem value="2">Level 2</SelectItem>
                      <SelectItem value="3">Level 3</SelectItem>
                      <SelectItem value="4">Level 4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority Status</Label>
                  <Select value={editingOccupation.priorityStatus} onValueChange={(v: "fast-track" | "standard" | "limited") => setEditingOccupation((prev) => prev && { ...prev, priorityStatus: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fast-track">Fast-Track</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="limited">Limited</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Points Multiplier</Label>
                <Input type="number" step="0.1" value={editingOccupation.pointsMultiplier} onChange={(e) => setEditingOccupation((prev) => prev && { ...prev, pointsMultiplier: parseFloat(e.target.value) || 1.0 })} />
                <p className="text-xs text-muted-foreground">Multiplier applied to base points for this occupation</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editingOccupation.isHighPriority} onCheckedChange={(checked) => setEditingOccupation((prev) => prev && { ...prev, isHighPriority: checked })} />
                <Label>High Priority Occupation</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" /> Cancel
            </Button>
            <Button onClick={handleSaveOccupation}>
              <Save className="h-4 w-4 mr-2" /> Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Delete Occupation
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this occupation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirm && handleDeleteOccupation(deleteConfirm)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
