import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/authService";
import { setSuppressAuthRedirect } from "@/lib/apiClient";

interface AdminUser {
  id: string;
  full_name: string | null;
  is_admin: boolean;
}

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const checkAdminStatus = useCallback(async () => {
    try {
      setSuppressAuthRedirect(true);
      // Check if we have an auth token at all
      if (!authService.isAuthenticated()) {
        setIsAdmin(false);
        setLoading(false);
        navigate("/auth", { replace: true });
        return;
      }

      // Fetch profile from API
      const profile = await authService.me();
      console.debug('[useAdminAuth] Fetched profile:', profile);

      if (!profile) {
        setIsAdmin(false);
        navigate("/auth", { replace: true });
        return;
      }

      // Thorough check for admin privileges
      const hasAdminFlag = !!(
        profile.isAdmin || 
        (profile as any).is_admin || 
        (profile as any).role === 'admin' ||
        (Array.isArray((profile as any).roles) && (profile as any).roles.includes('admin'))
      );

      if (!hasAdminFlag) {
        console.warn('[useAdminAuth] Access Denied: User is not an admin', profile);
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You do not have admin privileges.",
        });
        setIsAdmin(false);
        navigate("/dashboard", { replace: true });
        return;
      }

      setIsAdmin(true);
      setAdminUser({
        id: profile.id,
        full_name: profile.firstName ? `${profile.firstName} ${profile.lastName || ''}`.trim() : null,
        is_admin: true,
      });
    } catch (error) {
      console.error("Admin auth check error:", error);
      setIsAdmin(false);
      navigate("/dashboard", { replace: true });
    } finally {
      setSuppressAuthRedirect(false);
      setLoading(false);
    }
  }, [navigate, toast]);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  return {
    isAdmin,
    adminUser,
    loading,
    refetch: checkAdminStatus,
  };
}
