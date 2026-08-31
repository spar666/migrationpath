import { Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * System maintenance.
 *
 * Currently empty on purpose. Its only control was "Purge Old Rejected
 * Documents", which POSTed to `delete_old_rejected_documents` — an endpoint
 * belonging to a document vault that was never built and has since been
 * dropped from the backend. It ran against nothing, and the version before
 * this one read `error` off a response body that never carried it, so it
 * reported success either way.
 *
 * An honest empty state beats a destructive-looking button that does nothing.
 */
export function AdminSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Settings</h1>
        <p className="text-muted-foreground">System maintenance and configuration</p>
      </div>

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
        <CardContent>
          <div className="p-6 border border-dashed rounded-lg text-center text-muted-foreground">
            <p className="text-sm">No maintenance tasks are available.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
