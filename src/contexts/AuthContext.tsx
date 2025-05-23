
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, updatePassword } from "firebase/auth";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
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
  avatar_url?: string; // Changed from avatar to avatar_url
  needs_password_reset?: boolean;
  active?: boolean;
  createdAt?: Date | string;
  lastLogin?: Date | string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Check if a user is a reserved admin user
const isReservedAdmin = (email: string): boolean => {
  const adminEmails = [
    "originaldigitaloficial@gmail.com",
    "maicon.romano@originaldigital.com.br"
  ];
  return adminEmails.includes(email.toLowerCase());
};

// Clean up auth state
const cleanupAuthState = () => {
  // Remove any auth-related data from localStorage
  localStorage.removeItem('crmUser');
  
  // Remove any other auth tokens if needed
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('firebase:auth') || key.includes('user')) {
      localStorage.removeItem(key);
    }
  });
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const firstLoadComplete = React.useRef(false);

  // Listen for authentication state changes
  useEffect(() => {
    console.log("Setting up Firebase auth state listener");
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser?.email);
      
      if (firebaseUser) {
        // Defer profile fetch to avoid issues
        setTimeout(() => fetchUserProfile(firebaseUser), 0);
      } else {
        setUser(null);
        setLoading(false);
        firstLoadComplete.current = true;
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Function to fetch user profile data
  const fetchUserProfile = async (firebaseUser: User) => {
    try {
      console.log("Fetching user profile for:", firebaseUser.uid);
      setLoading(true);
      
      // Get user data from Firestore
      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnapshot = await getDoc(userRef);
      
      if (!userSnapshot.exists()) {
        console.log("No user profile found, checking if reserved admin");
        
        // Handle reserved admin users specially
        if (firebaseUser.email && isReservedAdmin(firebaseUser.email)) {
          console.log("Creating admin profile for:", firebaseUser.email);
          
          const adminName = firebaseUser.email === "originaldigitaloficial@gmail.com" 
            ? "Admin Original Digital" 
            : "Maicon Romano";
          
          const adminPosition = firebaseUser.email === "originaldigitaloficial@gmail.com"
            ? "Administrador Principal"
            : "CGO - Diretor Executivo de Crescimento";
            
          const adminUser: AuthUser = {
            id: firebaseUser.uid,
            name: adminName,
            email: firebaseUser.email,
            role: "admin",
            position: adminPosition,
            active: true,
            needs_password_reset: false
          };
          
          // Create the admin user in Firestore
          try {
            await setDoc(userRef, { 
              id: firebaseUser.uid,
              name: adminName,
              email: firebaseUser.email,
              role: "admin",
              position: adminPosition,
              active: true,
              needs_password_reset: false,
              created_at: new Date().toISOString()
            });
            console.log("Admin user created successfully");
          } catch (createError) {
            console.error("Error creating admin user:", createError);
          }
          
          setUser(adminUser);
          localStorage.setItem("crmUser", JSON.stringify(adminUser));
        } else {
          // Create a minimal profile based on auth user
          const defaultUser: AuthUser = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            email: firebaseUser.email || '',
            role: "user",
          };
          setUser(defaultUser);
          localStorage.setItem("crmUser", JSON.stringify(defaultUser));
        }
      } else {
        const userData = userSnapshot.data();
        console.log("User profile found:", userData);
        
        // Check if user is active
        if (userData.active === false) {
          console.log("User account is inactive");
          toast.error("Sua conta está inativa. Entre em contato com o administrador.");
          await auth.signOut();
          cleanupAuthState();
          setUser(null);
          return;
        }
        
        // Process user data
        const currentUser: AuthUser = {
          id: userData.id || firebaseUser.uid,
          name: userData.name || firebaseUser.displayName || '',
          email: userData.email || firebaseUser.email || '',
          role: userData.role as UserRole,
          position: userData.position,
          phone: userData.phone,
          avatar_url: userData.avatar_url,
          needs_password_reset: userData.needs_password_reset,
          active: userData.active,
          createdAt: userData.created_at,
          lastLogin: userData.last_login
        };
        
        // Update last login time only if not requiring password reset
        if (!userData.needs_password_reset) {
          try {
            await updateDoc(userRef, { 
              last_login: new Date().toISOString() 
            });
          } catch (updateError) {
            console.error("Error updating last login:", updateError);
          }
        }
        
        setUser(currentUser);
        localStorage.setItem("crmUser", JSON.stringify(currentUser));
      }
    } catch (error) {
      console.error("Error in fetchUserProfile:", error);
      
      // Create a minimal profile as fallback
      if (firebaseUser) {
        const defaultUser: AuthUser = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email || '',
          role: "user",
        };
        setUser(defaultUser);
        localStorage.setItem("crmUser", JSON.stringify(defaultUser));
      }
    } finally {
      setLoading(false);
      firstLoadComplete.current = true;
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
    setLoading(true);
    console.log("Attempting login for:", email);
    
    try {
      // Clean up existing state first
      cleanupAuthState();
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Login successful for:", email);
      return;
    } catch (error: any) {
      console.error("Login error:", error);
      
      if (error.code === "auth/invalid-credential") {
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
      
      // Clean up auth state
      cleanupAuthState();
      
      await signOut(auth);
      
      localStorage.removeItem("crmUser");
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      // Force logout even on error
      localStorage.removeItem("crmUser");
      setUser(null);
    }
  };
  
  // Reset password function
  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      console.log("Password reset email sent to:", email);
      return;
    } catch (error: any) {
      console.error("Error sending reset password email:", error);
      throw new Error(error.message || "Erro ao enviar email de redefinição");
    }
  };
  
  // Update password function
  const updateUserPassword = async (newPassword: string) => {
    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error("Nenhum usuário autenticado encontrado");
      }
      
      console.log("Updating password for the user");
      
      await updatePassword(currentUser, newPassword);
      
      // Update the needs_password_reset flag in Firestore
      const userRef = doc(db, "users", currentUser.uid);
      const userSnapshot = await getDoc(userRef);
      
      if (userSnapshot.exists()) {
        await updateDoc(userRef, { 
          needs_password_reset: false,
          updated_at: new Date().toISOString()
        });
        
        // Update local user object if it exists
        if (user && user.id === currentUser.uid) {
          const updatedUser = { ...user, needs_password_reset: false };
          setUser(updatedUser);
          localStorage.setItem("crmUser", JSON.stringify(updatedUser));
        }
      }
      
      toast.success("Senha atualizada com sucesso");
    } catch (error: any) {
      console.error("Error updating user password:", error);
      throw new Error(error.message || "Erro ao atualizar a senha");
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    resetPassword,
    updateUserPassword,
    isAuthenticated: !!auth.currentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
