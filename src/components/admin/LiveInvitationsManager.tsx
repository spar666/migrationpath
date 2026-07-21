import { useState } from "react";
import { Plus, Edit2, Trash2, Save, X, TrendingUp, MapPin, Award } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { cn } from "@/lib/utils";

import { useInvitations, Invitation } from "@/hooks/useInvitations";
import { Loader2, RefreshCw } from "lucide-react";

const states = ["National", "NSW", "Victoria", "Queensland", "SA", "WA", "Tasmania", "ACT", "NT"];
const visaClasses = ["189", "190", "491"];

export function LiveInvitationsManager() {
  const {
    invitations,
    isLoading,
    fetchInvitations,
    createInvitation,
    updateInvitation,
    deleteInvitation
  } = useInvitations();

  const [editingInvitation, setEditingInvitation] = useState<Partial<Invitation> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSaveInvitation = async () => {
    if (!editingInvitation || !editingInvitation.occupation) return;

    setIsSaving(true);
    try {
      if (editingInvitation.id) {
        await updateInvitation(editingInvitation.id, editingInvitation);
        toast({
          title: "Invitation Updated",
          description: "The invitation entry has been updated.",
        });
      } else {
        await createInvitation({
          occupation: editingInvitation.occupation,
          state: editingInvitation.state || "National",
          visa_class: editingInvitation.visa_class || "190",
          points: editingInvitation.points || 85,
          priority: editingInvitation.priority || false,
          days_ago: editingInvitation.days_ago || 0,
        });
        toast({
          title: "Invitation Created",
          description: "The new invitation entry has been added.",
        });
      }
      setIsDialogOpen(false);
      setEditingInvitation(null);
    } catch (error) {
      toast({
        title: "Error Saving",
        description: "Failed to save invitation entry.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteInvitation = async (id: string) => {
    try {
      await deleteInvitation(id);
      setDeleteConfirm(null);
      toast({
        title: "Invitation Deleted",
        description: "The invitation entry has been removed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete invitation entry.",
        variant: "destructive",
      });
    }
  };

  const toggleActive = (id: string, current: boolean) => {
    updateInvitation(id, { active: !current });
  };

  const togglePriority = (id: string, current: boolean) => {
    updateInvitation(id, { priority: !current });
  };

  const openAddDialog = () => {
    setEditingInvitation({
      occupation: "",
      visa_class: "190",
      state: "National",
      points: 85,
      days_ago: 0,
      priority: false,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (invitation: Invitation) => {
    setEditingInvitation({ ...invitation });
    setIsDialogOpen(true);
  };

  const activeCount = invitations.filter((i) => i.active).length;
  const priorityCount = invitations.filter((i) => i.priority).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Live Invitations Manager</h1>
          <p className="text-muted-foreground">
            Manage the scrolling invitation ticker on the homepage
          </p>
        </div>
        <Button variant="outline" onClick={fetchInvitations} className="gap-2">
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          Refresh
        </Button>
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Invitation
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{invitations.length}</p>
                <p className="text-xs text-muted-foreground">Total Entries</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-xs text-muted-foreground">Active in Ticker</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Award className="h-5 w-5 text-gold" />
              <div>
                <p className="text-2xl font-bold">{priorityCount}</p>
                <p className="text-xs text-muted-foreground">Priority Flagged</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invitations List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Invitation Entries</CardTitle>
          <CardDescription>These entries scroll across the homepage ticker</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border ${invitation.active ? "border-border bg-card" : "border-border/50 bg-muted/30 opacity-60"
                    }`}
                >
                  {invitation.priority && (
                    <span className="h-2.5 w-2.5 rounded-full bg-gold animate-pulse shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold truncate">{invitation.occupation}</p>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {invitation.visa_class}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {invitation.state}
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        {invitation.points} pts
                      </span>
                      <span>{invitation.days_ago === 0 ? "Today" : `${invitation.days_ago}d ago`}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={invitation.priority}
                        onCheckedChange={() => togglePriority(invitation.id, invitation.priority)}
                      />
                      <Label className="text-xs text-muted-foreground">Priority</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={invitation.active}
                        onCheckedChange={() => toggleActive(invitation.id, invitation.active ?? true)}
                      />
                      <Label className="text-xs text-muted-foreground">Active</Label>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(invitation)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => setDeleteConfirm(invitation.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {invitations.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No invitation entries found. Add one to appear in the ticker.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingInvitation?.id ? "Edit Invitation" : "Add New Invitation"}</DialogTitle>
            <DialogDescription>This entry will appear in the homepage ticker</DialogDescription>
          </DialogHeader>
          {editingInvitation && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Occupation</Label>
                <Input
                  value={editingInvitation.occupation}
                  onChange={(e) =>
                    setEditingInvitation((prev) => prev && { ...prev, occupation: e.target.value })
                  }
                  placeholder="e.g., Software Engineer"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Visa Subclass</Label>
                  <Select
                    value={editingInvitation.visa_class}
                    onValueChange={(v) =>
                      setEditingInvitation((prev) => prev && { ...prev, visa_class: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {visaClasses.map((vc) => (
                        <SelectItem key={vc} value={vc}>
                          {vc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Select
                    value={editingInvitation.state}
                    onValueChange={(v) =>
                      setEditingInvitation((prev) => prev && { ...prev, state: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Points</Label>
                  <Input
                    type="number"
                    value={editingInvitation.points}
                    onChange={(e) =>
                      setEditingInvitation((prev) =>
                        prev && { ...prev, points: parseInt(e.target.value) || 0 }
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Days Ago</Label>
                  <Input
                    type="number"
                    value={editingInvitation.days_ago}
                    onChange={(e) =>
                      setEditingInvitation((prev) =>
                        prev && { ...prev, days_ago: parseInt(e.target.value) || 0 }
                      )
                    }
                  />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingInvitation.priority}
                    onCheckedChange={(checked) =>
                      setEditingInvitation((prev) => prev && { ...prev, priority: checked })
                    }
                  />
                  <Label>Priority (Gold indicator)</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingInvitation.active}
                    onCheckedChange={(checked) =>
                      setEditingInvitation((prev) => prev && { ...prev, active: checked })
                    }
                  />
                  <Label>Active</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSaveInvitation} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {editingInvitation?.id ? "Update Invitation" : "Create Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this invitation from the ticker?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => deleteConfirm && handleDeleteInvitation(deleteConfirm)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
