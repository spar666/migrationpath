import { Link } from "react-router-dom";
import {
  Users,
  Newspaper,
  Briefcase,
  Clock,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAdminUsers } from "@/hooks/useAdminUsers";

export function AdminOverview() {
  const { users, loading: usersLoading } = useAdminUsers();

  // Dynamic statistics
  const stats = [
    {
      title: "Total Registered Users",
      value: usersLoading ? "..." : users.length,
      icon: Users,
      change: `+${users.filter(u => new Date(u.created_at || '').getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000).length} this week`,
      changeType: "positive",
      description: "active migration profiles",
    },
    {
      title: "Platform News Feed",
      value: "Live",
      icon: Newspaper,
      change: "Updated",
      changeType: "positive",
      description: "Migration updates and articles",
    },
    {
      title: "API Status",
      value: "Healthy",
      icon: Zap,
      change: "100%",
      changeType: "positive",
      description: "NestJS core engine live",
    },
  ];

  // "AI-Powered Insights" used to sit here: two hardcoded cards under a
  // heading that promised "automated trend detection". The high-priority one
  // ("an increase of onshore applicants targeting ICT and Engineering sectors
  // detected") was invented — nothing detected anything, and it recommended a
  // threshold change on the strength of it. The other restated the user count
  // already shown in the tiles above. Nothing analyses anything here yet, and
  // an operator acting on a fabricated trend is the whole risk.

  // Dynamic recent activities
  const recentActivity = users
    .slice(0, 5)
    .map((user) => ({
      user: user.full_name || "New Client",
      action: `registered as ${user.persona_type || "Client"}`,
      time: user.created_at ? new Date(user.created_at).toLocaleDateString("en-AU") : "Recently",
      status: user.points_score ? "approved" : "pending",
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of MigrationPath.com.au platform status</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="secondary"
                  className={
                    stat.changeType === "positive"
                      ? "bg-emerald-500/20 text-emerald-600"
                      : stat.changeType === "warning"
                        ? "bg-amber-500/20 text-amber-600"
                        : ""
                  }
                >
                  {stat.change}
                </Badge>
                <span className="text-xs text-muted-foreground">{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest platform events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No recent registrations detected.
              </div>
            ) : (
              recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 border-b border-border/40 pb-2 last:border-0 last:pb-0">
                  <div
                    className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${activity.status === "pending" ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user}</span>{" "}
                      <span className="text-muted-foreground">{activity.action}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              to="/admin/news"
              className="p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors text-left block"
            >
              <Newspaper className="h-5 w-5 text-primary mb-2" />
              <p className="font-medium text-sm">New Article</p>
              <p className="text-xs text-muted-foreground">Create content</p>
            </Link>
            <Link
              to="/admin/occupations"
              className="p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors text-left block"
            >
              <Briefcase className="h-5 w-5 text-primary mb-2" />
              <p className="font-medium text-sm">Update Occupations</p>
              <p className="text-xs text-muted-foreground">Manage ANZSCO</p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
