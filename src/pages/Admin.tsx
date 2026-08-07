import { Routes, Route, Navigate } from "react-router-dom";
import { Header } from "@/components/common/navbar/Header";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import {
  AdminOverview,
  SiteConfigEditor,
  FormLogicEditor,
  CourseManager,
  LiveInvitationsManager,
  NewsEditor,
  OccupationMaster,
  UserOversight,
  MigrationRulesPage,
  PointsConfigManager,
  PolicyConfigManager,
  RegionalPostcodeManager,
  OccupationListImport,
  LeadsManager,
  ProspectsManager,
} from "@/components/admin";
import { AdminGate } from "@/components/admin/AdminGate";
import { AdminSettings } from "@/components/admin/AdminSettings";

export default function Admin() {
  return (
    <AdminGate>
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1">
          <AdminSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <main className="flex-1 bg-muted/30 p-4 sm:p-6 lg:p-8">
              <Routes>
                <Route index element={<AdminOverview />} />
                <Route path="site-config" element={<SiteConfigEditor />} />
                <Route path="form-logic" element={<FormLogicEditor />} />
                <Route path="migration-rules" element={<MigrationRulesPage />} />
                <Route path="points-config" element={<PointsConfigManager />} />
                <Route path="policy-config" element={<PolicyConfigManager />} />
                <Route path="regional-postcodes" element={<RegionalPostcodeManager />} />
                <Route path="occupation-lists" element={<OccupationListImport />} />
                <Route path="occupations" element={<Navigate to="/admin/occupation-master" replace />} />
                <Route path="courses" element={<CourseManager />} />
                <Route path="invitations" element={<LiveInvitationsManager />} />
                <Route path="occupation-master" element={<OccupationMaster />} />
                <Route path="news" element={<NewsEditor />} />
                <Route path="users" element={<UserOversight />} />
                {/* /admin/consultations is gone. It listed pre-session
                    questionnaires, which the same data now reaches an agent
                    through more usefully: per user, under User Oversight ->
                    Consultation Intake. Old bookmarks fall through to the
                    catch-all below and land on the overview. */}
                <Route path="leads" element={<LeadsManager />} />
                <Route path="prospects" element={<ProspectsManager />} />

                <Route path="settings" element={<AdminSettings />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      </div>
    </AdminGate>
  );
}
