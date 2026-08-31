import { InviteTrendsManager } from "./InviteTrendsManager";

/**
 * Invitation thresholds.
 *
 * This used to be two tabs. The other one managed "document requirements" per
 * persona — rows describing documents a user would upload and an agent would
 * approve, in a product that has neither uploads nor user accounts. The rows
 * synced to a dashboard that no longer exists, so every one of them was a
 * promise nothing kept. With that gone there is one thing on this screen, and
 * a tab strip over a single tab is just furniture.
 *
 * The route stays /admin/migration-rules so existing bookmarks still land.
 */
export function MigrationRulesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Invite Trends</h1>
        <p className="text-muted-foreground">
          Manage invitation thresholds for migration pathways
        </p>
      </div>

      <InviteTrendsManager />
    </div>
  );
}
