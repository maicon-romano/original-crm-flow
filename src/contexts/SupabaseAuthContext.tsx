
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Define user roles
export type UserRole = "admin" | "user" | "client";

// Define user interface
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  position?: string;
  phone?: string;
  avatar_url?: string;
  needs_password_reset?: boolean;
  active?: boolean;
  createdAt?: Date | string;
  lastLogin?: Date | string;
}

interface SupabaseAuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<void>;
  isAuthenticated: boolean;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

// Check if a user is a reserved admin user
const isReservedAdmin = (email: string): boolean => {
  const adminEmails = [
    "originaldigitaloficial@gmail.com",
    "maicon.romano@originaldigital.com.br"
  ];
  return adminEmails.includes(email.toLowerCase());
};

export const SupabaseAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen for authentication state changes
  useEffect(() => {
    console.log("Setting up Supabase auth state listener");
    
    // First check if there's an existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Existing session:", session ? "Yes" : "No");
      setSession(session);
      
      if (session?.user) {
        fetchUserProfile(session.user.id, session);
      } else {
        setLoading(false);
      }
    });
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        setSession(session);

        if (session?.user) {
          // Don't call this directly - it would cause a deadlock
          // Instead defer it with setTimeout
          setTimeout(() => fetchUserProfile(session.user.id, session), 0);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Function to fetch user profile data
  const fetchUserProfile = async (userId: string, currentSession: Session | null) => {
    try {
      console.log("Fetching user profile for:", userId);
      setLoading(true);
      
      // Get user data from public.users table
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();
      
      if (error) {
        console.error("Error fetching user profile:", error);
        
        // Handle reserved admin users specially
        if (currentSession?.user.email && isReservedAdmin(currentSession.user.email)) {
          console.log("Creating admin profile for:", currentSession.user.email);
          
          const adminName = currentSession.user.email === "originaldigitaloficial@gmail.com" 
            ? "Admin Original Digital" 
            : "Maicon Romano";
          
          const adminPosition = currentSession.user.email === "originaldigitaloficial@gmail.com"
            ? "Administrador Principal"
            : "CGO - Diretor Executivo de Crescimento";
            
          const adminUser: AuthUser = {
            id: userId,
            name: adminName,
            email: currentSession.user.email,
            role: "admin",
            position: adminPosition,
            active: true,
            needs_password_reset: false
          };
          
          // Try to create the admin user
          const { error: createError } = await supabase
            .from("users")
            .insert([{ 
              id: userId,
              name: adminName,
              email: currentSession.user.email,
              role: "admin",
              position: adminPosition,
              active: true,
              needs_password_reset: false
            }]);
            
          if (createError) {
            console.error("Error creating admin user:", createError);
          } else {
            console.log("Admin user created successfully");
          }
          
          setUser(adminUser);
          localStorage.setItem("crmUser", JSON.stringify(adminUser));
        } else {
          // Create a minimal profile based on auth user
          const defaultUser: AuthUser = {
            id: userId,
            name: currentSession?.user.user_metadata.name || currentSession?.user.email?.split('@')[0] || 'User',
            email: currentSession?.user.email || '',
            role: "user",
          };
          setUser(defaultUser);
          localStorage.setItem("crmUser", JSON.stringify(defaultUser));
        }
      } else {
        console.log("User profile found:", data);
        
        // Process user data
        const currentUser: AuthUser = {
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role as UserRole,
          position: data.position,
          phone: data.phone,
          avatar_url: data.avatar_url,
          needs_password_reset: data.needs_password_reset,
          active: data.active,
          createdAt: data.created_at,
          lastLogin: data.last_login
        };
        
        // Update last login time
        const { error: updateError } = await supabase
          .from("users")
          .update({ 
            last_login: new Date().toISOString() 
          })
          .eq("id", userId);
        
        if (updateError) {
          console.error("Error updating last login:", updateError);
        }
        
        setUser(currentUser);
        localStorage.setItem("crmUser", JSON.stringify(currentUser));
      }
    } catch (error) {
      console.error("Error in fetchUserProfile:", error);
      
      // Create a minimal profile as fallback
      if (currentSession?.user) {
        const defaultUser: AuthUser = {
          id: userId,
          name: currentSession.user.user_metadata.name || currentSession.user.email?.split('@')[0] || 'User',
          email: currentSession.user.email || '',
          role: "user",
        };
        setUser(defaultUser);
        localStorage.setItem("crmUser", JSON.stringify(defaultUser));
      }
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
    setLoading(true);
    console.log("Attempting login for:", email);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      console.log("Login successful for:", email);
      return;
    } catch (error: any) {
      console.error("Login error:", error);
      
      if (error.message === "Invalid login credentials") {
        throw new Error("Email ou senha inválidos");
      } else {
        throw new Error(error.message || "Erro ao fazer login");
      }
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      console.log("Logging out");
      await supabase.auth.signOut();
      localStorage.removeItem("crmUser");
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error("Logout error:", error);
      // Force logout even on error
      localStorage.removeItem("crmUser");
      setUser(null);
      setSession(null);
    }
  };
  
  // Reset password function
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      console.log("Password reset email sent to:", email);
      return;
    } catch (error: any) {
      console.error("Error sending reset password email:", error);
      throw new Error(error.message || "Erro ao enviar email de redefinição");
    }
  };
  
  // Update password function
  const updateUserPassword = async (newPassword: string) => {
    if (!session?.user) {
      throw new Error("Nenhum usuário autenticado encontrado");
    }
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      if (user) {
        // Update the needs_password_reset flag
        const { error: updateError } = await supabase
          .from("users")
          .update({ 
            needs_password_reset: false,
            updated_at: new Date().toISOString()
          })
          .eq("id", user.id);
        
        if (updateError) {
          console.error("Error updating needs_password_reset flag:", updateError);
        }
        
        // Update local user object
        const updatedUser = { ...user, needs_password_reset: false };
        setUser(updatedUser);
        localStorage.setItem("crmUser", JSON.stringify(updatedUser));
        
        toast.success("Senha atualizada com sucesso");
      }
    } catch (error: any) {
      console.error("Error updating user password:", error);
      throw new Error(error.message || "Erro ao atualizar a senha");
    }
  };

  const value = {
    user,
    session,
    loading,
    login,
    logout,
    resetPassword,
    updateUserPassword,
    isAuthenticated: !!session,
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
