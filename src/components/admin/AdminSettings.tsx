import { useState } from "react";
import { Trash2, Loader2, Settings, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { apiClient } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";

export function AdminSettings() {
  const [purging, setPurging] = useState(false);
  const [purgeResult, setPurgeResult] = useState<{ success: boolean; message: string } | null>(null);
  const { toast } = useToast();

  const handlePurgeOldDocuments = async () => {
    setPurging(true);
    setPurgeResult(null);

    try {
      // Call the database function to delete old rejected documents
      const { error } = await apiClient.post("delete_old_rejected_documents");

      if (error) throw error;

      setPurgeResult({
        success: true,
        message: "Successfully purged rejected documents older than 90 days.",
      });

      toast({
        title: "Cleanup Complete",
        description: "Old rejected documents have been purged from the system.",
      });
    } catch (error) {
      console.error("Purge error:", error);
      setPurgeResult({
        success: false,
        message: "Failed to purge documents. Please try again or check the logs.",
      });

      toast({
        variant: "destructive",
        title: "Cleanup Failed",
        description: "Could not purge old documents. Check the console for details.",
      });
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Settings</h1>
        <p className="text-muted-foreground">System maintenance and configuration</p>
      </div>

      {/* Maintenance Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Maintenance
          </CardTitle>
          <CardDescription>
            Perform system cleanup and maintenance tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Document Purge */}
          <div className="flex items-start justify-between gap-4 p-4 border rounded-lg">
            <div className="space-y-1">
              <h3 className="font-medium flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-destructive" />
                Purge Old Rejected Documents
              </h3>
              <p className="text-sm text-muted-foreground">
                Delete all rejected documents that are older than 90 days.
                This helps maintain storage efficiency and user privacy.
              </p>
              {purgeResult && (
                <div
                  className={`flex items-center gap-2 text-sm mt-2 ${
                    purgeResult.success ? "text-emerald-600" : "text-destructive"
                  }`}
                >
                  {purgeResult.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  {purgeResult.message}
                </div>
              )}
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={purging}>
                  {purging ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Purging...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Run Cleanup
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Document Purge</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all rejected documents that are older than 90 days.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handlePurgeOldDocuments}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, Purge Documents
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Additional maintenance options can be added here */}
          <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground">
            <p className="text-sm">Additional maintenance options coming soon...</p>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">About Document Cleanup</p>
              <p className="text-xs text-muted-foreground">
                The automatic cleanup function removes database records for rejected documents.
                Note that the actual files in storage may need to be cleaned separately
                using a scheduled Edge Function or manual bucket cleanup.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
