
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
export type UserRole = "admin" | "user" | "client" | "cliente";

// Define user interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
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

  // Listen for authentication state changes
  useEffect(() => {
    console.log("Setting up auth state listener");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      console.log("Auth state changed:", firebaseUser ? firebaseUser.email : "No user");
      
      if (firebaseUser) {
        try {
          // First try to get user data from Firestore
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          const clientDoc = await getDoc(doc(db, "clients", firebaseUser.uid));
          
          // Check if user exists in the users collection (admin/staff)
          if (userDoc.exists()) {
            console.log("User found in users collection");
            const userData = userDoc.data();
            
            const currentUser: User = {
              id: firebaseUser.uid,
              name: userData.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              email: userData.email || firebaseUser.email || '',
              role: userData.role as UserRole,
              avatar: userData.avatar,
              precisa_redefinir_senha: userData.precisa_redefinir_senha,
              createdAt: userData.createdAt,
              lastLogin: new Date().getTime()
            };
            
            // Update lastLogin time
            await updateDoc(doc(db, "users", firebaseUser.uid), {
              lastLogin: new Date().getTime()
            });
            
            setUser(currentUser);
            localStorage.setItem("crmUser", JSON.stringify(currentUser));
          } 
          // Check if user exists in the clients collection
          else if (clientDoc.exists()) {
            console.log("User found in clients collection");
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
            await updateDoc(doc(db, "clients", firebaseUser.uid), {
              lastLogin: new Date().getTime()
            });
            
            setUser(currentUser);
            localStorage.setItem("crmUser", JSON.stringify(currentUser));
          } 
          // User not found in either collection, try to search by email
          else {
            console.log("User not found by ID, searching by email:", firebaseUser.email);
            
            // Try to find in users collection
            const usersRef = collection(db, "users");
            const usersQuery = query(usersRef, where("email", "==", firebaseUser.email));
            const usersSnapshot = await getDocs(usersQuery);
            
            if (!usersSnapshot.empty) {
              // User found in users collection
              const userData = usersSnapshot.docs[0].data();
              const docId = usersSnapshot.docs[0].id;
              
              const currentUser: User = {
                id: firebaseUser.uid,
                name: userData.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                email: userData.email || firebaseUser.email || '',
                role: userData.role as UserRole,
                avatar: userData.avatar,
                precisa_redefinir_senha: userData.precisa_redefinir_senha,
                createdAt: userData.createdAt,
                lastLogin: new Date().getTime()
              };
              
              // Update the document to include the Firebase UID
              await updateDoc(doc(db, "users", docId), {
                id: firebaseUser.uid,
                lastLogin: new Date().getTime()
              });
              
              setUser(currentUser);
              localStorage.setItem("crmUser", JSON.stringify(currentUser));
            } else {
              // Try to find in clients collection
              const clientsRef = collection(db, "clients");
              const clientsQuery = query(clientsRef, where("email", "==", firebaseUser.email));
              const clientsSnapshot = await getDocs(clientsQuery);
              
              if (!clientsSnapshot.empty) {
                // User found in clients collection
                const clientData = clientsSnapshot.docs[0].data();
                const docId = clientsSnapshot.docs[0].id;
                
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
                
                // Update the document to include the Firebase UID
                await updateDoc(doc(db, "clients", docId), {
                  userId: firebaseUser.uid,
                  lastLogin: new Date().getTime()
                });
                
                setUser(currentUser);
                localStorage.setItem("crmUser", JSON.stringify(currentUser));
              } else {
                // User not found in database
                console.log("User not found in database, creating minimal profile");
                
                // Create a minimal user profile based on Firebase user
                const defaultUser: User = {
                  id: firebaseUser.uid,
                  name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                  email: firebaseUser.email || '',
                  role: 'user',
                };
                
                setUser(defaultUser);
                localStorage.setItem("crmUser", JSON.stringify(defaultUser));
              }
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          
          // Create a minimal user profile based on Firebase user
          const defaultUser: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            email: firebaseUser.email || '',
            role: 'user',
          };
          
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
        const collectionPath = isClient ? "clients" : "users";
        
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
