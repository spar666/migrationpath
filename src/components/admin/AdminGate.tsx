import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Loader2 } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";

interface AdminGateProps {
  children: React.ReactNode;
}

export function AdminGate({ children }: AdminGateProps) {
  const { isAdmin, loading, adminUser } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-navy to-navy/95 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <div className="flex items-center gap-2 text-primary-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Verifying admin access...</span>
          </div>
        </div>
      </div>
    );
  }

  // If not admin, the hook will redirect - this is a fallback
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-navy to-navy/95 flex items-center justify-center">
        <div className="text-center space-y-4 text-primary-foreground">
          <Shield className="h-12 w-12 mx-auto text-destructive" />
          <p>Access Denied</p>
          <p className="text-sm text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
