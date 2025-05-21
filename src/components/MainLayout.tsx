
import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function MainLayout() {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Debug authentication status
  useEffect(() => {
    console.log("MainLayout - Auth status:", { isAuthenticated, user, loading, path: location.pathname });
  }, [isAuthenticated, user, loading, location.pathname]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log("Not authenticated, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to reset password page if user needs to reset password
  if (user?.needsPasswordReset) {
    console.log("User needs password reset, redirecting");
    return <Navigate to="/reset-password" replace />;
  }

  console.log("Rendering main layout for authenticated user");
  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
