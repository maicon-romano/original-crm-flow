
import { useState, useEffect, useRef, useCallback } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  cargo?: string;
  position?: string;
  role: string;
  active: boolean;
  created_at?: string | number;
  updated_at?: string | number;
  last_login?: string | number;
}

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const isMounted = useRef(true);
  const dataFetchedRef = useRef(false);

  const fetchUsers = useCallback(async (showToast = true) => {
    if (!isMounted.current || !user?.role) return;
    
    const isAdmin = user?.role === "admin";
    if (!isAdmin) {
      console.log("User is not admin, skipping user fetch");
      return;
    }
    
    // If data is already fetched and we're not forcing a refresh with showToast=true, skip
    if (dataFetchedRef.current && !showToast) {
      return;
    }
    
    try {
      setIsLoading(true);
      console.log("Fetching users from Firebase...");
      
      if (showToast) {
        toast.info("Carregando usuários...");
      }
      
      // Fetch users from the usuarios collection
      const usersQuery = query(collection(db, 'usuarios'), orderBy('created_at', 'desc'));
      const snapshot = await getDocs(usersQuery);
      
      const usersData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Convert timestamps to ISO strings if they exist
          created_at: data.created_at ? 
            (typeof data.created_at === 'object' ? data.created_at.toDate().toISOString() : data.created_at) : 
            undefined,
          updated_at: data.updated_at ? 
            (typeof data.updated_at === 'object' ? data.updated_at.toDate().toISOString() : data.updated_at) : 
            undefined,
          last_login: data.last_login ? 
            (typeof data.last_login === 'object' ? data.last_login.toDate().toISOString() : data.last_login) : 
            undefined
        } as User;
      });
      
      if (isMounted.current) {
        setUsers(usersData);
        dataFetchedRef.current = true;
      }
      
      if (isMounted.current && showToast) {
        toast.success(`${usersData.length || 0} usuários carregados!`);
      }
    } catch (error: any) {
      console.error("Error fetching users:", error);
      
      if (isMounted.current && showToast) {
        toast.error("Erro ao carregar usuários. Verifique suas permissões.");
      }
      
      // Set an empty array if fetch fails
      if (isMounted.current) {
        setUsers([]);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [user?.role]);

  // Explicitly refresh users data when called
  const refreshUsers = useCallback(() => {
    dataFetchedRef.current = false;
    fetchUsers(true);
  }, [fetchUsers]);

  // Cleanup function to prevent state updates on unmounted component
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Fetch users only once when component mounts and user is admin
  useEffect(() => {
    if (user?.role === "admin" && !dataFetchedRef.current) {
      fetchUsers(false); // Initial fetch without toast
    }
  }, [user?.role, fetchUsers]);

  return {
    users,
    isLoading,
    refreshUsers,
  };
};
