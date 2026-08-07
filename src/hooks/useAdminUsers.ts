import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiClient, unwrapArray } from "@/lib/apiClient";

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
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    try {
      const response = await apiClient.get<unknown>('/users?limit=100');
      setUsers(unwrapArray<AdminUserProfile>(response));
      setError(null);
    } catch (err) {
      // A silent failure here reads as "no users on the platform", which is a
      // very different thing from "we could not reach the API".
      console.error('Error fetching users:', err);
      setUsers([]);
      setError(
        err instanceof Error
          ? err.message
          : 'Could not load users from the API.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
  };
}
