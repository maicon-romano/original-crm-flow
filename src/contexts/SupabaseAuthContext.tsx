
import React, { useContext } from "react";
import { useAuth, AuthUser, UserRole } from "@/contexts/AuthContext";

// Re-export types for backward compatibility
export { UserRole, AuthUser };

// Create a compatibility context
interface SupabaseAuthContextType {
  user: AuthUser | null;
  session: any | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<void>;
  isAuthenticated: boolean;
}

const SupabaseAuthContext = React.createContext<SupabaseAuthContextType | undefined>(undefined);

// Wrapper that uses our real AuthContext
export const SupabaseAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const auth = useAuth();
  
  // Create a compatibility layer for components still using Supabase context
  const value: SupabaseAuthContextType = {
    user: auth.user,
    session: auth.user ? { user: auth.user } : null, // Mock session object
    loading: auth.loading,
    login: auth.login,
    logout: auth.logout,
    resetPassword: auth.resetPassword,
    updateUserPassword: auth.updateUserPassword,
    isAuthenticated: auth.isAuthenticated
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error("useSupabaseAuth must be used within a SupabaseAuthProvider");
  }
  return context;
};
