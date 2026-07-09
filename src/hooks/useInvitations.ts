import { useState, useCallback, useEffect } from "react";
import { apiClient } from "@/lib/apiClient";

export interface Invitation {
  id: string;
  occupation: string;
  visa_class: string;
  state: string;
  points: number;
  days_ago: number;
  priority: boolean;
  active?: boolean; // UI state or optional backend field
}

export function useInvitations() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchInvitations = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<any>("/invitations/feed");
      const data = Array.isArray(response) ? response : (response.data || []);
      // Ensure 'active' is set if missing
      const normalizedData = data.map((inv: any) => ({
        ...inv,
        active: inv.active ?? true
      }));
      setInvitations(normalizedData);
    } catch (error) {
      console.error("Error fetching invitations:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createInvitation = useCallback(async (invitation: Omit<Invitation, "id">) => {
    try {
      await apiClient.post("/invitations", invitation);
      await fetchInvitations();
    } catch (error) {
      console.error("Error creating invitation:", error);
      throw error;
    }
  }, [fetchInvitations]);

  const updateInvitation = useCallback(async (id: string, updates: Partial<Invitation>) => {
    try {
      await apiClient.patch(`/invitations/${id}`, updates);
      await fetchInvitations();
    } catch (error) {
      console.error("Error updating invitation:", error);
      throw error;
    }
  }, [fetchInvitations]);

  const deleteInvitation = useCallback(async (id: string) => {
    try {
      await apiClient.delete(`/invitations/${id}`);
      await fetchInvitations();
    } catch (error) {
      console.error("Error deleting invitation:", error);
      throw error;
    }
  }, [fetchInvitations]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  return {
    invitations,
    isLoading,
    fetchInvitations,
    createInvitation,
    updateInvitation,
    deleteInvitation
  };
}
