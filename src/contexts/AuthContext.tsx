
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  User as FirebaseUser
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type UserRole = "admin" | "user" | "client";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  needsPasswordReset?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
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
          // Try to get user data from Firestore
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          
          if (userDoc.exists()) {
            // If user exists in Firestore, use that data
            console.log("User found in Firestore");
            const userData = userDoc.data() as Omit<User, "id">;
            setUser({
              id: firebaseUser.uid,
              ...userData
            });
          } else {
            // If user doesn't exist in Firestore, fallback to mock users
            console.log("User not found in Firestore, using mock data");
            const mockUser = MOCK_USERS.find(u => u.email === firebaseUser.email);
            if (mockUser) {
              setUser({
                ...mockUser,
                id: firebaseUser.uid
              });
              // Also store in localStorage for persistence
              localStorage.setItem("crmUser", JSON.stringify({
                ...mockUser,
                id: firebaseUser.uid
              }));
            } else {
              // Default to a regular user if no matching mock user
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
        } catch (error) {
          console.error("Error fetching user data:", error);
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      console.log("Firebase login successful:", firebaseUser.email);
      
      // User data will be set by the onAuthStateChanged listener
      
      // For development fallback - store in localStorage
      const mockUser = MOCK_USERS.find(u => u.email === email);
      if (mockUser) {
        console.log("Storing mock user in localStorage");
        localStorage.setItem("crmUser", JSON.stringify({
          ...mockUser,
          id: firebaseUser.uid
        }));
      }
      
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
      // Fallback logout - just clear local storage
      localStorage.removeItem("crmUser");
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
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
