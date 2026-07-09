import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, TrendingUp } from "lucide-react";
import { MigrationRulesManager } from "./MigrationRulesManager";
import { InviteTrendsManager } from "./InviteTrendsManager";

export function MigrationRulesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Migration Rules</h1>
        <p className="text-muted-foreground">
          Manage document requirements and invitation thresholds for migration pathways
        </p>
      </div>

      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="thresholds" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Invite Trends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-6">
          <MigrationRulesManager />
        </TabsContent>

        <TabsContent value="thresholds" className="mt-6">
          <InviteTrendsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
