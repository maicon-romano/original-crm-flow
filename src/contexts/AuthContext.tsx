import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  sendPasswordResetEmail as firebaseSendResetEmail
} from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// Define user roles
export type UserRole = "admin" | "user" | "client" | "cliente" | "funcionario" | "usuario";

// Define user interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  userType?: string;
  avatar?: string;
  precisa_redefinir_senha?: boolean;
  createdAt?: Date | number;
  lastLogin?: Date | number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper function to determine role with priority on admin status
  const determineRole = (userData: any): UserRole => {
    // Check all possible admin indicators with more explicit logging
    console.log("Determining role from data:", {
      role: userData.role,
      userType: userData.userType,
      tipo_usuario: userData.tipo_usuario
    });
    
    // Force admin based on the user's email if it matches
    if (userData.email === "maicon.romano@originaldigital.com.br") {
      console.log("User is Maicon Romano - forcing admin role");
      return "admin";
    }
    
    if (
      userData.role === "admin" || 
      userData.userType === "admin" ||
      userData.tipo_usuario === "admin"
    ) {
      console.log("User has admin privileges");
      return "admin";
    } else if (userData.role === "client" || userData.role === "cliente") {
      return "client";
    } else {
      return userData.role || "user";
    }
  };

  // Listen for authentication state changes
  useEffect(() => {
    console.log("Setting up auth state listener");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      console.log("Auth state changed:", firebaseUser ? firebaseUser.email : "No user");
      
      if (firebaseUser) {
        try {
          console.log("Fetching user data for:", firebaseUser.uid, firebaseUser.email);
          
          // Force admin role for specific email - for testing/backup
          if (firebaseUser.email === "maicon.romano@originaldigital.com.br") {
            console.log("Setting admin role for Maicon Romano");
            const adminUser: User = {
              id: firebaseUser.uid,
              name: "Maicon Romano",
              email: firebaseUser.email,
              role: "admin",
              userType: "admin",
              lastLogin: new Date().getTime()
            };
            
            setUser(adminUser);
            localStorage.setItem("crmUser", JSON.stringify(adminUser));
            setLoading(false);
            return;
          }
          
          // Try multiple collections - "usuarios" first (matches Firebase rules)
          let userDoc = await getDoc(doc(db, "usuarios", firebaseUser.uid)).catch(err => {
            console.log("Error fetching from usuarios collection:", err);
            return null;
          });
          
          let userData = null;
          let collectionUsed = "";
          
          if (userDoc && userDoc.exists()) {
            userData = userDoc.data();
            collectionUsed = "usuarios";
            console.log("User found in 'usuarios' collection:", userData);
          } else {
            // If not in "usuarios", try "users" collection
            const usersDoc = await getDoc(doc(db, "users", firebaseUser.uid)).catch(err => {
              console.log("Error fetching from users collection:", err);
              return null;
            });
            
            if (usersDoc && usersDoc.exists()) {
              userData = usersDoc.data();
              collectionUsed = "users";
              console.log("User found in 'users' collection:", userData);
            }
          }
          
          // Check if user exists in clients collection as a fallback
          const clientDoc = await getDoc(doc(db, "clientes", firebaseUser.uid)).catch(err => {
            console.log("Error fetching from clientes collection:", err);
            return null;
          });
          
          // Process user data if found
          if (userData) {
            console.log("Processing user data:", userData);
            
            // Determine role with priority check on admin status
            const effectiveRole = determineRole(userData);
            console.log("Determined user role:", effectiveRole);
            
            const currentUser: User = {
              id: firebaseUser.uid,
              name: userData.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              email: userData.email || firebaseUser.email || '',
              role: effectiveRole,
              userType: userData.userType || (effectiveRole === "admin" ? "admin" : undefined),
              avatar: userData.avatar,
              precisa_redefinir_senha: userData.precisa_redefinir_senha,
              createdAt: userData.createdAt,
              lastLogin: new Date().getTime()
            };
            
            console.log("Processed user data:", currentUser);
            
            // Update lastLogin time
            try {
              if (collectionUsed) {
                await updateDoc(doc(db, collectionUsed, firebaseUser.uid), {
                  lastLogin: new Date().getTime()
                });
              }
            } catch (updateError) {
              console.error("Error updating lastLogin:", updateError);
            }
            
            setUser(currentUser);
            localStorage.setItem("crmUser", JSON.stringify(currentUser));
          } 
          // Handle client user case
          else if (clientDoc && clientDoc.exists()) {
            console.log("User found in clientes collection");
            const clientData = clientDoc.data();
            
            // For client users, use companyName as name
            const currentUser: User = {
              id: firebaseUser.uid,
              name: clientData.companyName || clientData.contactName || firebaseUser.email?.split('@')[0] || 'Client',
              email: clientData.email || firebaseUser.email || '',
              role: (clientData.role as UserRole) || "client",
              avatar: clientData.avatar,
              precisa_redefinir_senha: clientData.precisa_redefinir_senha,
              createdAt: clientData.createdAt,
              lastLogin: new Date().getTime()
            };
            
            // Update lastLogin time
            try {
              await updateDoc(doc(db, "clientes", firebaseUser.uid), {
                lastLogin: new Date().getTime()
              });
            } catch (updateError) {
              console.error("Error updating lastLogin:", updateError);
            }
            
            setUser(currentUser);
            localStorage.setItem("crmUser", JSON.stringify(currentUser));
          } 
          // Create minimal user profile based on Firebase user as fallback
          else {
            console.log("No user data found, creating minimal profile based on Firebase auth");
            
            // Special handling for known admin emails
            const effectiveRole = firebaseUser.email === "maicon.romano@originaldigital.com.br" ? "admin" : "user";
            const effectiveUserType = firebaseUser.email === "maicon.romano@originaldigital.com.br" ? "admin" : undefined;
            
            const defaultUser: User = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              email: firebaseUser.email || '',
              role: effectiveRole,
              userType: effectiveUserType
            };
            
            console.log("Created minimal user profile:", defaultUser);
            setUser(defaultUser);
            localStorage.setItem("crmUser", JSON.stringify(defaultUser));
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          
          // Create a minimal user profile based on Firebase user as fallback
          // Special handling for known admin emails
          const effectiveRole = firebaseUser.email === "maicon.romano@originaldigital.com.br" ? "admin" : "user";
          const effectiveUserType = firebaseUser.email === "maicon.romano@originaldigital.com.br" ? "admin" : undefined;
          
          const defaultUser: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            email: firebaseUser.email || '',
            role: effectiveRole,
            userType: effectiveUserType
          };
          
          console.log("Created minimal user profile due to error:", defaultUser);
          setUser(defaultUser);
          localStorage.setItem("crmUser", JSON.stringify(defaultUser));
        }
      } else {
        // No Firebase user, clear local user
        setUser(null);
        localStorage.removeItem("crmUser");
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    console.log("Attempting login for:", email);
    
    try {
      // Try Firebase authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Firebase login successful:", userCredential.user.email);
      
      // User data will be set by the onAuthStateChanged listener
      return;
    } catch (error: any) {
      console.error("Firebase login error:", error);
      
      if (error.code === 'auth/invalid-credential') {
        throw new Error("Email ou senha inválidos");
      } else if (error.code === 'auth/user-not-found') {
        throw new Error("Usuário não encontrado");
      } else if (error.code === 'auth/wrong-password') {
        throw new Error("Senha incorreta");
      } else {
        throw new Error(error.message || "Erro ao fazer login");
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log("Logging out");
      await firebaseSignOut(auth);
      localStorage.removeItem("crmUser");
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      // Force logout even if there's an error
      localStorage.removeItem("crmUser");
      setUser(null);
    }
  };
  
  const resetPassword = async (email: string) => {
    try {
      await firebaseSendResetEmail(auth, email);
      console.log("Password reset email sent to:", email);
      return;
    } catch (error: any) {
      console.error("Error sending reset password email:", error);
      if (error.code === 'auth/user-not-found') {
        throw new Error("Email não encontrado");
      }
      throw new Error(error.message || "Erro ao enviar email de redefinição");
    }
  };
  
  const updateUserPassword = async (newPassword: string) => {
    if (!auth.currentUser) {
      throw new Error("Nenhum usuário autenticado encontrado");
    }
    
    try {
      // In a real implementation, we would use updatePassword from firebase/auth
      // For now, just update the precisa_redefinir_senha flag
      
      if (user) {
        const isClient = user.role === "client" || user.role === "cliente";
        const collectionPath = isClient ? "clientes" : "users";
        
        await updateDoc(doc(db, collectionPath, user.id), {
          precisa_redefinir_senha: false,
          updatedAt: new Date().getTime()
        });
        
        // Update local user object
        const updatedUser = { ...user, precisa_redefinir_senha: false };
        setUser(updatedUser);
        localStorage.setItem("crmUser", JSON.stringify(updatedUser));
      }
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
    isAuthenticated: !!user,
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
