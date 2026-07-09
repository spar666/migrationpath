import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  FileText,
  Users,
  GraduationCap,
  Briefcase,
  Heart,
  Building2,
  AlertCircle,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { apiClient } from "@/lib/apiClient";
import type { DocumentRequirement } from "@/types/migrationRules";
import { API_ENDPOINTS } from "@/constants/api";

type PersonaType = "student" | "skilled" | "onshore" | "partner" | "employer";

const personaConfig: Record<PersonaType, { label: string; icon: React.ElementType; color: string }> = {
  student: { label: "Student", icon: GraduationCap, color: "bg-blue-500" },
  skilled: { label: "Skilled (Offshore)", icon: Briefcase, color: "bg-emerald-500" },
  onshore: { label: "Onshore Skilled", icon: Building2, color: "bg-amber-500" },
  partner: { label: "Partner/Family", icon: Heart, color: "bg-pink-500" },
  employer: { label: "Employer Sponsored", icon: Users, color: "bg-purple-500" },
};

const personaTypes: PersonaType[] = ["student", "skilled", "onshore", "partner", "employer"];

interface RequirementFormData {
  document_name: string;
  description: string;
  persona_type: PersonaType;
  is_mandatory: boolean;
}

const emptyForm: RequirementFormData = {
  document_name: "",
  description: "",
  persona_type: "student",
  is_mandatory: true,
};

export function MigrationRulesManager() {
  const { toast } = useToast();
  const [requirements, setRequirements] = useState<DocumentRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<RequirementFormData>(emptyForm);

  // Fetch requirements
  const fetchRequirements = useCallback(async () => {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.MIGRATION_RULES);
      const data = Array.isArray(response) ? response : (response.data || []);
      setRequirements(data || []);
    } catch (error) {
      console.error("Error fetching requirements:", error);
      toast({
        variant: "destructive",
        title: "Error loading requirements",
        description: "Failed to load document requirements.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRequirements();
  }, [fetchRequirements]);

  // Group requirements by persona
  const groupedRequirements = personaTypes.reduce(
    (acc, persona) => {
      acc[persona] = requirements.filter((r) => r.persona_type === persona);
      return acc;
    },
    {} as Record<PersonaType, DocumentRequirement[]>
  );

  // Handle add/edit
  const handleSave = async () => {
    if (!formData.document_name.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Document name is required.",
      });
      return;
    }

    setSaving(true);

    try {
      const payload = {
        document_name: formData.document_name.trim(),
        description: formData.description.trim() || null,
        persona_type: formData.persona_type,
        is_mandatory: formData.is_mandatory,
      };

      if (editingId) {
        // Update existing
        await apiClient.put(`${API_ENDPOINTS.MIGRATION_RULES}/${editingId}`, payload);
        toast({
          title: "Requirement Updated",
          description: `"${formData.document_name}" has been updated.`,
        });
      } else {
        // Create new
        await apiClient.post(API_ENDPOINTS.MIGRATION_RULES, payload);
        toast({
          title: "Requirement Added",
          description: `"${formData.document_name}" has been added for ${personaConfig[formData.persona_type].label} users.`,
        });
      }

      setIsAddOpen(false);
      setEditingId(null);
      setFormData(emptyForm);
      await fetchRequirements();
    } catch (error) {
      console.error("Save error:", error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Failed to save requirement. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await apiClient.delete(`${API_ENDPOINTS.MIGRATION_RULES}/${deleteId}`);

      toast({
        title: "Requirement Deleted",
        description: "The document requirement has been removed.",
      });

      await fetchRequirements();
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Failed to delete requirement. Please try again.",
      });
    } finally {
      setDeleteId(null);
    }
  };

  // Open edit dialog
  const openEdit = (requirement: DocumentRequirement) => {
    setFormData({
      document_name: requirement.document_name,
      description: requirement.description || "",
      persona_type: requirement.persona_type as PersonaType,
      is_mandatory: requirement.is_mandatory ?? true,
    });
    setEditingId(requirement.id);
    setIsAddOpen(true);
  };

  // Open add dialog
  const openAdd = (persona?: PersonaType) => {
    setFormData({
      ...emptyForm,
      persona_type: persona || "student",
    });
    setEditingId(null);
    setIsAddOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 bg-muted rounded animate-pulse" />
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Migration Rules</h1>
          <p className="text-muted-foreground mt-1">
            Manage document requirements for each migration pathway. Changes sync instantly to user dashboards.
          </p>
        </div>
        <Button onClick={() => openAdd()} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Requirement
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {personaTypes.map((persona) => {
          const config = personaConfig[persona];
          const Icon = config.icon;
          const count = groupedRequirements[persona]?.length || 0;
          const mandatory = groupedRequirements[persona]?.filter((r) => r.is_mandatory).length || 0;

          return (
            <Card key={persona} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", config.color)}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{count}</p>
                    <p className="text-xs text-muted-foreground">{mandatory} required</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Grouped Requirements */}
      <div className="space-y-6">
        {personaTypes.map((persona) => {
          const config = personaConfig[persona];
          const Icon = config.icon;
          const items = groupedRequirements[persona] || [];

          return (
            <Card key={persona} className="overflow-hidden">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", config.color)}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span>{config.label} Requirements</span>
                    <Badge variant="outline" className="ml-2">
                      {items.length} items
                    </Badge>
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => openAdd(persona)} className="gap-1.5">
                    <Plus className="w-4 h-4" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {items.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No requirements configured for this pathway.</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {items.map((req) => (
                      <div
                        key={req.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="mt-1">
                            {req.is_mandatory ? (
                              <AlertCircle className="w-4 h-4 text-amber-500" />
                            ) : (
                              <Check className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground truncate">
                                {req.document_name}
                              </p>
                              {req.is_mandatory && (
                                <Badge variant="outline" className="text-xs shrink-0">
                                  Required
                                </Badge>
                              )}
                            </div>
                            {req.description && (
                              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                                {req.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(req)}
                            className="h-8 w-8"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(req.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Requirement" : "Add New Requirement"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update the document requirement details."
                : "Add a new document requirement for a migration pathway."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="persona">Pathway</Label>
              <Select
                value={formData.persona_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, persona_type: value as PersonaType })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pathway" />
                </SelectTrigger>
                <SelectContent>
                  {personaTypes.map((persona) => (
                    <SelectItem key={persona} value={persona}>
                      {personaConfig[persona].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="document_name">Document Name</Label>
              <Input
                id="document_name"
                value={formData.document_name}
                onChange={(e) =>
                  setFormData({ ...formData, document_name: e.target.value })
                }
                placeholder="e.g., Passport, English Test Results"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of the requirement..."
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Mandatory Requirement</Label>
                <p className="text-xs text-muted-foreground">
                  Required documents trigger alerts if missing.
                </p>
              </div>
              <Switch
                checked={formData.is_mandatory}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_mandatory: checked })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddOpen(false);
                setEditingId(null);
                setFormData(emptyForm);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {editingId ? "Update" : "Add Requirement"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Requirement?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the document requirement. Users will no longer see this in their checklist.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
