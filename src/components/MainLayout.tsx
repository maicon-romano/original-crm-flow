
import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useIsMobile } from "@/hooks/use-mobile";

// Define client-only routes
const CLIENT_ROUTES = [
  "/meus-projetos",
  "/minhas-tarefas",
  "/meus-arquivos",
  "/minhas-faturas",
  "/meu-perfil",
];

// Define protected admin routes
const ADMIN_ONLY_ROUTES = [
  "/configuracoes",
  "/financeiro",
  "/contratos",
  "/relatorios",
  "/usuarios", 
  "/users",
  "/settings",
  "/reports"
];

export function MainLayout() {
  const { isAuthenticated, user, loading } = useSupabaseAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Debug authentication status with user details
  useEffect(() => {
    console.log("MainLayout - Auth status:", { 
      isAuthenticated, 
      user: user ? {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        needs_password_reset: user.needs_password_reset
      } : null, 
      loading, 
      path: location.pathname 
    });
  }, [isAuthenticated, user, loading, location.pathname]);

  useEffect(() => {
    // Check permissions for current route
    if (isAuthenticated && user && !loading) {
      // Check if user is admin
      const isAdmin = user.role === "admin";
                     
      console.log(`User role check - role: ${user.role}, isAdmin: ${isAdmin}`);
      
      // If user is client and trying to access a non-client route
      if (user.role === "client" && 
          !CLIENT_ROUTES.includes(location.pathname) && 
          location.pathname !== "/dashboard") {
        console.log("Client accessing restricted route, redirecting to /meus-projetos");
        navigate("/meus-projetos");
      }
      
      // If user is regular user (not admin) and trying to access admin-only route
      if (!isAdmin && 
          ADMIN_ONLY_ROUTES.some(route => location.pathname.startsWith(route))) {
        console.log("Regular user accessing admin route, redirecting to /dashboard");
        navigate("/dashboard");
      }
    }
  }, [isAuthenticated, user, loading, location.pathname, navigate]);

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

  // Redirect to update password page if user needs to reset password
  if (user?.needs_password_reset) {
    console.log("User needs password reset, redirecting to update-password");
    return <Navigate to="/update-password" replace />;
  }

  // For clients on dashboard route, redirect to projects
  if (user?.role === "client" && location.pathname === "/dashboard") {
    console.log("Client on dashboard, redirecting to projects");
    return <Navigate to="/meus-projetos" replace />;
  }

  console.log("Rendering main layout for authenticated user");
  return (
    <div className="flex min-h-screen bg-muted/30 dark:bg-gray-900">
      <Sidebar />
      <div className={`flex-1 flex flex-col ${isMobile ? 'ml-0' : 'ml-64'}`}>
        <Header />
        <main className="flex-1 container mx-auto p-4 md:p-6 transition-all duration-300">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
