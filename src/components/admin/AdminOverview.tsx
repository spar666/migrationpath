import { Link } from "react-router-dom";
import {
  Users,
  Newspaper,
  Briefcase,
  Clock,
  Lightbulb,
  Zap,
  MapPin,
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

  // Dynamic insights
  const aiInsights = [
    {
      id: "1",
      title: "Skilled Occupation Surge",
      description: "An increase of onshore applicants targeting ICT and Engineering sectors detected. Recommend updating state priority thresholds.",
      priority: "high",
      icon: Zap,
    },
    {
      id: "2",
      title: "Platform Growth",
      description: `Currently ${users.length} registered users on the platform.`,
      priority: "medium",
      icon: Lightbulb,
    },
  ];

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

      {/* AI-Powered Insights */}
      <Card className="border-accent/30 bg-accent/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-accent" />
            AI-Powered Insights
          </CardTitle>
          <CardDescription>Automated trend detection and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiInsights.map((insight) => {
              const InsightIcon = insight.icon;
              return (
                <div
                  key={insight.id}
                  className={`p-4 rounded-lg border ${insight.priority === "high"
                    ? "border-accent/50 bg-accent/10"
                    : "border-border bg-card"
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${insight.priority === "high"
                        ? "bg-accent/20 text-accent"
                        : "bg-muted text-muted-foreground"
                        }`}
                    >
                      <InsightIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm truncate">{insight.title}</p>
                        {insight.priority === "high" && (
                          <Badge className="bg-accent/20 text-accent border-accent/30 text-xs shrink-0">
                            High Priority
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

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
            <Link
              to="/admin/invitations"
              className="p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors text-left block"
            >
              <MapPin className="h-5 w-5 text-accent mb-2" />
              <p className="font-medium text-sm">Manage Ticker</p>
              <p className="text-xs text-muted-foreground">Live invitations</p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
