import { useState } from "react";
import {
  Search,
  User,
  ChevronDown,
  Loader2,
  ClipboardList,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAdminUsers, AdminUserProfile } from "@/hooks/useAdminUsers";
import { ConsultationIntakeTab } from "./ConsultationIntakeTab";
import { AdminStrategyPanel } from "./AdminStrategyPanel";

const personaColors: Record<string, string> = {
  Student: "bg-purple-500/20 text-purple-600 border-purple-500/30",
  "Onshore Skilled": "bg-blue-500/20 text-blue-600 border-blue-500/30",
  Partner: "bg-pink-500/20 text-pink-600 border-pink-500/30",
  "Employer Sponsored": "bg-amber-500/20 text-amber-600 border-amber-500/30",
};

export function UserOversight() {
  const { users, loading: usersLoading } = useAdminUsers();

  const [searchQuery, setSearchQuery] = useState("");
  const [expandedUsers, setExpandedUsers] = useState<string[]>([]);

  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(query) ||
      user.persona_type?.toLowerCase().includes(query)
    );
  });

  const toggleUserExpand = (userId: string) => {
    if (expandedUsers.includes(userId)) {
      setExpandedUsers((prev) => prev.filter((id) => id !== userId));
    } else {
      setExpandedUsers((prev) => [...prev, userId]);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
  };

  if (usersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Oversight</h1>
          <p className="text-muted-foreground">Monitor users and manage their profiles</p>
        </div>
      </div>

      {/* Search */}
      <Card className="border-dashed">
        <CardContent className="py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or persona..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm">
        <p className="text-muted-foreground">
          Showing {filteredUsers.length} of {users.length} users
        </p>
      </div>

      {/* Users List */}
      <div className="space-y-3">
        {filteredUsers.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground">No users found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "Try adjusting your search" : "No users have registered yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => (
            <Collapsible
              key={user.id}
              open={expandedUsers.includes(user.id)}
              onOpenChange={() => toggleUserExpand(user.id)}
            >
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(user.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-base">
                            {user.full_name || "Unnamed User"}
                          </CardTitle>
                          {user.persona_type && (
                            <Badge className={personaColors[user.persona_type] || "bg-muted"}>
                              {user.persona_type}
                            </Badge>
                          )}
                          {user.strategy_delivered_at && (
                            <Badge className="bg-success/15 text-success border-success/30 gap-1">
                              Strategy Sent
                            </Badge>
                          )}
                          {user.is_admin && (
                            <Badge variant="outline" className="text-xs">
                              Admin
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="truncate text-xs">
                          ID: {user.id.slice(0, 8)}...
                        </CardDescription>
                      </div>
                      <div className="hidden md:flex items-center gap-6 text-sm">
                        {user.points_score !== null && user.points_score > 0 && (
                          <div className="text-center">
                            <p className="text-muted-foreground text-xs">PR Points</p>
                            <p className="font-bold text-accent">{user.points_score}</p>
                          </div>
                        )}
                      </div>
                      <Button variant="outline" size="sm" className="mr-2">
                        Manage
                      </Button>
                      <ChevronDown
                        className={`h-5 w-5 text-muted-foreground transition-transform ${expandedUsers.includes(user.id) ? "rotate-180" : ""
                          }`}
                      />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="border-t pt-4">
                      <Tabs defaultValue="intake" className="w-full">
                        <TabsList className="mb-4">
                          <TabsTrigger value="intake" className="gap-2">
                            <ClipboardList className="h-4 w-4" />
                            Consultation Intake
                          </TabsTrigger>
                          <TabsTrigger value="strategy" className="gap-2">
                            <Sparkles className="h-4 w-4" />
                            Strategy
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="intake">
                          <ConsultationIntakeTab userId={user.id} />
                        </TabsContent>

                        <TabsContent value="strategy">
                          <AdminStrategyPanel
                            userId={user.id}
                            userName={user.full_name || "User"}
                            personaType={user.persona_type}
                            pointsScore={user.points_score}
                            consultationNotes={user.consultation_notes}
                            strategyDeliveredAt={user.strategy_delivered_at}
                            onUpdate={() => {
                              window.location.reload();
                            }}
                          />
                        </TabsContent>
                      </Tabs>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))
        )}
      </div>
    </div>
  );
}
