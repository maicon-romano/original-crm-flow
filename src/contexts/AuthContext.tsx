
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  sendPasswordResetEmail
} from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// Define user roles
export type UserRole = "admin" | "user" | "client";

// Define user interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  needsPasswordReset?: boolean;
  createdAt?: Date;
  lastLogin?: Date;
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

// Mock users for demonstration - will be used as fallback if Firebase user doesn't have complete profile
const MOCK_USERS = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@originaldigital.com",
    role: "admin" as UserRole,
    avatar: "",
  },
  {
    id: "2",
    name: "Regular User",
    email: "user@originaldigital.com",
    role: "user" as UserRole,
    avatar: "",
  },
  {
    id: "3",
    name: "Client User",
    email: "client@example.com",
    role: "client" as UserRole,
    avatar: "",
    needsPasswordReset: true,
  },
];

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
          // First try to get user data from 'users' collection (internal users)
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          
          if (userDoc.exists()) {
            // If user exists in Firestore as internal user
            console.log("User found in users collection");
            const userData = userDoc.data() as Omit<User, "id">;
            const currentUser = {
              id: firebaseUser.uid,
              ...userData
            };
            
            // Update lastLogin time
            await updateDoc(doc(db, "users", firebaseUser.uid), {
              lastLogin: new Date()
            });
            
            setUser(currentUser);
            localStorage.setItem("crmUser", JSON.stringify(currentUser));
          } else {
            // If not in users collection, try clients collection
            const clientDoc = await getDoc(doc(db, "clients", firebaseUser.uid));
            
            if (clientDoc.exists()) {
              console.log("User found in clients collection");
              const clientData = clientDoc.data();
              const currentUser: User = {
                id: firebaseUser.uid,
                name: clientData.nomeFantasia || clientData.razaoSocial,
                email: clientData.email,
                role: "client" as UserRole,
                needsPasswordReset: clientData.needsPasswordReset,
                avatar: clientData.avatar
              };
              
              // Update lastLogin time
              await updateDoc(doc(db, "clients", firebaseUser.uid), {
                lastLogin: new Date()
              });
              
              setUser(currentUser);
              localStorage.setItem("crmUser", JSON.stringify(currentUser));
            } else {
              console.log("User not found in users or clients collection, searching by email");
              // If user not found by UID, try searching by email in both collections
              
              // Check users collection by email
              const usersRef = collection(db, "users");
              const usersQuery = query(usersRef, where("email", "==", firebaseUser.email));
              const usersSnapshot = await getDocs(usersQuery);
              
              // Check clients collection by email
              const clientsRef = collection(db, "clients");
              const clientsQuery = query(clientsRef, where("email", "==", firebaseUser.email));
              const clientsSnapshot = await getDocs(clientsQuery);
              
              if (!usersSnapshot.empty) {
                console.log("User found in users collection by email");
                const userData = usersSnapshot.docs[0].data() as Omit<User, "id">;
                const currentUser = {
                  id: firebaseUser.uid,
                  ...userData
                };
                setUser(currentUser);
                localStorage.setItem("crmUser", JSON.stringify(currentUser));
              } else if (!clientsSnapshot.empty) {
                console.log("User found in clients collection by email");
                const clientData = clientsSnapshot.docs[0].data();
                const currentUser: User = {
                  id: firebaseUser.uid,
                  name: clientData.nomeFantasia || clientData.razaoSocial,
                  email: clientData.email,
                  role: "client" as UserRole,
                  needsPasswordReset: clientData.needsPasswordReset,
                  avatar: clientData.avatar
                };
                setUser(currentUser);
                localStorage.setItem("crmUser", JSON.stringify(currentUser));
              } else {
                console.log("User not found in Firestore, creating minimal profile from Firebase data");
                // Create basic user profile from Firebase user info
                const defaultUser = {
                  id: firebaseUser.uid,
                  name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                  email: firebaseUser.email || '',
                  role: 'user' as UserRole,
                };
                setUser(defaultUser);
                localStorage.setItem("crmUser", JSON.stringify(defaultUser));
              }
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          
          // Fallback to mock users for specific emails
          console.log("Error fetching Firestore data, checking mock users");
          const mockUser = MOCK_USERS.find(u => u.email === firebaseUser.email);
          if (mockUser) {
            console.log("Using mock user data for:", firebaseUser.email);
            setUser({
              ...mockUser,
              id: firebaseUser.uid
            });
            localStorage.setItem("crmUser", JSON.stringify({
              ...mockUser,
              id: firebaseUser.uid
            }));
          } else {
            // Default to a user based on Firebase info
            console.log("No mock user found, using firebase user info");
            const defaultUser = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              email: firebaseUser.email || '',
              role: 'user' as UserRole,
            };
            setUser(defaultUser);
            localStorage.setItem("crmUser", JSON.stringify(defaultUser));
          }
        }
      } else {
        // Check local storage as fallback (for development only)
        console.log("No Firebase user, checking localStorage");
        const storedUser = localStorage.getItem("crmUser");
        if (storedUser) {
          console.log("Found user in localStorage");
          setUser(JSON.parse(storedUser));
        } else {
          console.log("No user found in localStorage");
          setUser(null);
        }
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    console.log("Attempting login for:", email);
    
    try {
      // First try Firebase authentication
      console.log("Trying Firebase authentication");
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      console.log("Firebase login successful:", firebaseUser.email);
      
      // User data will be set by the onAuthStateChanged listener
      return;
    } catch (firebaseError) {
      console.error("Firebase login error:", firebaseError);
      
      // Fallback to mock users for development
      try {
        console.log("Attempting mock login fallback");
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        // Find user with matching email
        const foundUser = MOCK_USERS.find(u => u.email === email);
        
        if (!foundUser) {
          throw new Error("Usuário não encontrado");
        }
        
        // In a real app, we would validate the password here
        if (password !== "password") {
          throw new Error("Senha inválida");
        }
        
        console.log("Mock login successful:", foundUser.email);
        // Store user in local storage
        localStorage.setItem("crmUser", JSON.stringify(foundUser));
        setUser(foundUser);
      } catch (mockError) {
        console.error("Login error:", mockError);
        throw mockError;
      } finally {
        setLoading(false);
      }
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
      // Fallback logout - just clear local storage
      localStorage.removeItem("crmUser");
      setUser(null);
    }
  };
  
  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      console.log("Password reset email sent to:", email);
      return;
    } catch (error) {
      console.error("Error sending reset password email:", error);
      throw error;
    }
  };
  
  const updateUserPassword = async (newPassword: string) => {
    if (!auth.currentUser) {
      throw new Error("No authenticated user found");
    }
    
    try {
      // In a real app, we'd use updatePassword from firebase/auth
      // For now, we'll just update the needsPasswordReset flag
      if (user) {
        const updatedUser = { ...user, needsPasswordReset: false };
        
        if (user.role === "client") {
          await updateDoc(doc(db, "clients", user.id), {
            needsPasswordReset: false
          });
        } else {
          await updateDoc(doc(db, "users", user.id), {
            needsPasswordReset: false
          });
        }
        
        localStorage.setItem("crmUser", JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    } catch (error) {
      console.error("Error updating user password:", error);
      throw error;
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
