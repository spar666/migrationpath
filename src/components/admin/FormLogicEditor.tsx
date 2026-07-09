import { useState } from "react";
import { Plus, Edit2, Trash2, Save, X, GripVertical } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface FormOption {
  id: string;
  value: string;
  label: string;
  order: number;
}

interface FormCategory {
  id: string;
  name: string;
  description: string;
  options: FormOption[];
}

const initialCategories: FormCategory[] = [
  {
    id: "visas",
    name: "Visa Types",
    description: "Available visa options for the Onshore Strategy Audit",
    options: [
      { id: "v1", value: "482", label: "482 - Temporary Skill Shortage", order: 1 },
      { id: "v2", value: "485", label: "485 - Temporary Graduate", order: 2 },
      { id: "v3", value: "sid", label: "Skills in Demand (SID) - 2026", order: 3 },
      { id: "v4", value: "407", label: "407 - Training Visa", order: 4 },
      { id: "v5", value: "other", label: "Other Work Visa", order: 5 },
    ],
  },
  {
    id: "occupations",
    name: "Occupation List",
    description: "Occupations displayed in the audit form dropdown",
    options: [
      { id: "o1", value: "software-engineer", label: "Software Engineer", order: 1 },
      { id: "o2", value: "civil-engineer", label: "Civil Engineer", order: 2 },
      { id: "o3", value: "registered-nurse", label: "Registered Nurse", order: 3 },
      { id: "o4", value: "accountant", label: "Accountant", order: 4 },
      { id: "o5", value: "marketing-specialist", label: "Marketing Specialist", order: 5 },
      { id: "o6", value: "chef", label: "Chef", order: 6 },
      { id: "o7", value: "electrician", label: "Electrician", order: 7 },
      { id: "o8", value: "mechanical-engineer", label: "Mechanical Engineer", order: 8 },
      { id: "o9", value: "data-analyst", label: "Data Analyst", order: 9 },
      { id: "o10", value: "project-manager", label: "Project Manager", order: 10 },
    ],
  },
  {
    id: "experience",
    name: "Experience Levels",
    description: "Australian work experience duration options",
    options: [
      { id: "e1", value: "0-1", label: "Less than 1 year", order: 1 },
      { id: "e2", value: "1-2", label: "1-2 years", order: 2 },
      { id: "e3", value: "2-3", label: "2-3 years", order: 3 },
      { id: "e4", value: "3-5", label: "3-5 years", order: 4 },
      { id: "e5", value: "5+", label: "5+ years", order: 5 },
    ],
  },
];

export function FormLogicEditor() {
  const [categories, setCategories] = useState<FormCategory[]>(initialCategories);
  const [activeTab, setActiveTab] = useState("visas");
  const [editingOption, setEditingOption] = useState<FormOption | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ categoryId: string; optionId: string } | null>(null);
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSaveOption = () => {
    if (!editingOption || !currentCategoryId) return;

    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== currentCategoryId) return cat;
        const existingIndex = cat.options.findIndex((o) => o.id === editingOption.id);
        if (existingIndex >= 0) {
          return {
            ...cat,
            options: cat.options.map((o, i) => (i === existingIndex ? editingOption : o)),
          };
        }
        return {
          ...cat,
          options: [...cat.options, { ...editingOption, order: cat.options.length + 1 }],
        };
      })
    );

    setIsDialogOpen(false);
    setEditingOption(null);
    setCurrentCategoryId(null);
    toast({
      title: "Option Saved",
      description: "The form option has been updated successfully.",
    });
  };

  const handleDeleteOption = (categoryId: string, optionId: string) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== categoryId) return cat;
        return {
          ...cat,
          options: cat.options.filter((o) => o.id !== optionId),
        };
      })
    );
    setDeleteConfirm(null);
    toast({
      title: "Option Deleted",
      description: "The form option has been removed.",
    });
  };

  const openAddDialog = (categoryId: string) => {
    setCurrentCategoryId(categoryId);
    setEditingOption({
      id: `new-${Date.now()}`,
      value: "",
      label: "",
      order: 0,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (categoryId: string, option: FormOption) => {
    setCurrentCategoryId(categoryId);
    setEditingOption({ ...option });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Form Logic Editor</h1>
        <p className="text-muted-foreground">
          Manage dropdown options for the Onshore Strategy Audit and other forms
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="visas">Visa Types</TabsTrigger>
              <TabsTrigger value="occupations">Occupations</TabsTrigger>
              <TabsTrigger value="experience">Experience</TabsTrigger>
            </TabsList>

            {categories.map((category) => (
              <TabsContent key={category.id} value={category.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </div>
                  <Button onClick={() => openAddDialog(category.id)} size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Option
                  </Button>
                </div>

                <div className="space-y-2">
                  {category.options
                    .sort((a, b) => a.order - b.order)
                    .map((option) => (
                      <div
                        key={option.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-glacier/50 transition-colors"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{option.label}</p>
                          <Badge variant="secondary" className="text-xs">
                            value: {option.value}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(category.id, option)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => setDeleteConfirm({ categoryId: category.id, optionId: option.id })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingOption?.value ? "Edit Option" : "Add New Option"}</DialogTitle>
            <DialogDescription>Configure the form dropdown option</DialogDescription>
          </DialogHeader>
          {editingOption && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="value">Value (internal)</Label>
                <Input
                  id="value"
                  value={editingOption.value}
                  onChange={(e) =>
                    setEditingOption((prev) => prev && { ...prev, value: e.target.value })
                  }
                  placeholder="e.g., software-engineer"
                />
                <p className="text-xs text-muted-foreground">Used in code and database</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="label">Label (displayed)</Label>
                <Input
                  id="label"
                  value={editingOption.label}
                  onChange={(e) =>
                    setEditingOption((prev) => prev && { ...prev, label: e.target.value })
                  }
                  placeholder="e.g., Software Engineer"
                />
                <p className="text-xs text-muted-foreground">Shown to users in the dropdown</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSaveOption}>
              <Save className="h-4 w-4 mr-2" />
              Save Option
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Option</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this option? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() =>
                deleteConfirm && handleDeleteOption(deleteConfirm.categoryId, deleteConfirm.optionId)
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
