import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Settings,
  Briefcase,
  Newspaper,
  Users,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Home,
  GraduationCap,
  Calculator,
  ListChecks,
  TrendingUp,
  Scale,
  FileQuestion,
  Inbox,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FreshnessDot, type FreshnessStatus } from "@/components/common/FreshnessBadge";
import { dataFreshnessService } from "@/services/dataFreshnessService";

const menuItems = [
  { title: "Overview", icon: LayoutDashboard, path: "/admin" },
  { title: "Leads", icon: Inbox, path: "/admin/leads" },
  { title: "Consultations", icon: FileQuestion, path: "/admin/consultations" },
  { title: "Site Configuration", icon: Settings, path: "/admin/site-config" },
  { title: "Form Logic", icon: ListChecks, path: "/admin/form-logic" },
  { title: "Migration Rules", icon: Scale, path: "/admin/migration-rules" },
  { title: "Points Configuration", icon: Calculator, path: "/admin/points-config" },
  { title: "Legislative Settings", icon: Scale, path: "/admin/policy-config" },
  { title: "Course Manager", icon: GraduationCap, path: "/admin/courses" },
  { title: "Live Invitations", icon: TrendingUp, path: "/admin/invitations" },
  { title: "Occupations", icon: Briefcase, path: "/admin/occupation-master" },
  { title: "Regional Postcodes", icon: MapPin, path: "/admin/regional-postcodes" },
  { title: "Occupation Lists", icon: ListChecks, path: "/admin/occupation-lists" },
  { title: "User Oversight", icon: Users, path: "/admin/users" },
  { title: "Settings", icon: Settings, path: "/admin/settings" },
];

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const [freshness, setFreshness] = useState<Record<string, FreshnessStatus>>({});

  useEffect(() => {
    dataFreshnessService
      .getAll()
      .then((rows) => {
        const map: Record<string, FreshnessStatus> = {};
        rows.forEach((r) => {
          if (r.adminRoute) map[r.adminRoute] = r.status;
        });
        setFreshness(map);
      })
      .catch(() => {});
  }, []);

  return (
    <aside
      className={cn(
        // Icon-only rail on mobile; full sidebar (collapsible) from lg up
        "flex flex-col bg-navy text-primary-foreground transition-all duration-300 min-h-screen",
        collapsed ? "w-16" : "w-16 lg:w-64"
      )}
    >
      {/* Header — collapse toggle is desktop-only */}
      <div className="hidden lg:flex items-center justify-between p-4 border-b border-primary-foreground/10">
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight">Admin Suite</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-primary-foreground hover:bg-primary-foreground/10"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={item.title}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                "hover:bg-primary-foreground/10",
                isActive && "bg-accent text-navy font-semibold"
              )}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-navy")} />
              {!collapsed && <span className="hidden lg:inline text-sm">{item.title}</span>}
              {!collapsed && freshness[item.path] && (
                <FreshnessDot status={freshness[item.path]} className="ml-auto hidden lg:block" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-primary-foreground/10">
        <NavLink
          to="/"
          title="Back to Site"
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-primary-foreground/10 transition-colors"
        >
          <Home className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="hidden lg:inline text-sm">Back to Site</span>}
        </NavLink>
      </div>
    </aside>
  );
}
