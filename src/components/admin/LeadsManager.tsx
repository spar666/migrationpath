import { useState, useEffect } from "react";
import { Users, Loader2, RefreshCw, Search, Mail, Phone, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/apiClient";
import { format } from "date-fns";
import { toast } from "sonner";

type LeadStatus = "new" | "contacted" | "converted" | "archived";

interface Lead {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  visa_type?: string;
  message?: string;
  package_id?: string;
  source: string;
  status: LeadStatus;
  created_at: string;
}

const statusColors: Record<LeadStatus, string> = {
  new: "bg-blue-100 text-blue-700 border-blue-200",
  contacted: "bg-amber-100 text-amber-700 border-amber-200",
  converted: "bg-green-100 text-green-700 border-green-200",
  archived: "bg-muted text-muted-foreground border-border",
};

const sourceLabels: Record<string, string> = {
  quote_slideover: "Header Quick Quote",
  quote_page: "Quote Page",
  other: "Other",
};

export function LeadsManager() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLeads = async (targetPage = page) => {
    setLoading(true);
    try {
      const raw = await apiClient.get<any>("/leads", {
        params: { page: targetPage, limit: 20 },
      });
      // Defensive unwrap — matches the shape used elsewhere in the admin panel
      // (TransformInterceptor envelope, optionally wrapping a paginated result).
      const payload = raw?.data ?? raw;
      const list = payload?.data ?? (Array.isArray(payload) ? payload : []);
      setLeads(Array.isArray(list) ? list : []);
      setTotalPages(payload?.totalPages ?? 1);
    } catch (err) {
      console.error("Failed to fetch leads:", err);
      toast.error("Failed to load leads.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleStatusChange = async (leadId: string, status: LeadStatus) => {
    setUpdatingId(leadId);
    const previous = leads;
    // Optimistic update
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status } : l)));
    try {
      await apiClient.patch(`/leads/${leadId}/status`, { status });
    } catch (err) {
      console.error("Failed to update lead status:", err);
      toast.error("Failed to update status — reverting.");
      setLeads(previous);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = leads.filter((lead) => {
    const matchesSearch =
      lead.full_name.toLowerCase().includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6" />
            Leads
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quote requests captured from the header quick-quote form and the /quote page.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchLeads(page)} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as LeadStatus | "all")}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading leads...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No leads match your filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="pb-3 pr-4">Name</th>
                    <th className="pb-3 pr-4">Contact</th>
                    <th className="pb-3 pr-4">Visa Interest</th>
                    <th className="pb-3 pr-4">Source</th>
                    <th className="pb-3 pr-4">Received</th>
                    <th className="pb-3 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((lead) => (
                    <tr key={lead.id} className="border-b last:border-0 align-top">
                      <td className="py-3 pr-4 font-medium text-foreground">{lead.full_name}</td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-col gap-1 text-muted-foreground">
                          <a
                            href={`mailto:${lead.email}`}
                            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                          >
                            <Mail className="h-3.5 w-3.5" />
                            {lead.email}
                          </a>
                          {lead.phone && (
                            <a
                              href={`tel:${lead.phone}`}
                              className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                            >
                              <Phone className="h-3.5 w-3.5" />
                              {lead.phone}
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {lead.visa_type || "—"}
                        {lead.message && (
                          <p className="text-xs mt-1 max-w-xs truncate" title={lead.message}>
                            {lead.message}
                          </p>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline" className="font-normal">
                          {sourceLabels[lead.source] || lead.source}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">
                        {format(new Date(lead.created_at), "d MMM yyyy, h:mm a")}
                      </td>
                      <td className="py-3 pr-4">
                        <Select
                          value={lead.status}
                          onValueChange={(v) => handleStatusChange(lead.id, v as LeadStatus)}
                          disabled={updatingId === lead.id}
                        >
                          <SelectTrigger className={`h-8 w-36 text-xs border ${statusColors[lead.status]}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="converted">Converted</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
