import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/apiClient";

export interface AdminUserProfile {
  id: string;
  full_name: string | null;
  persona_type: string | null;
  points_score: number | null;
  is_admin: boolean | null;
  consultation_notes: string | null;
  strategy_delivered_at: string | null;
  created_at?: string | null;
}

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    try {
      const data = await apiClient.get<AdminUserProfile[]>('/admin/users');
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        variant: "destructive",
        title: "Error loading users",
        description: "Failed to load user list.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    refetch: fetchUsers,
  };
}
