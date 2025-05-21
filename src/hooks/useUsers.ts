
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  cargo?: string;
  position?: string;
  role: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
  last_login?: string;
}

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useSupabaseAuth();
  const isMounted = useRef(true);
  const dataFetchedRef = useRef(false);

  const fetchUsers = useCallback(async (showToast = true) => {
    if (!isMounted.current || !user?.role) return;
    
    const isAdmin = user?.role === "admin";
    if (!isAdmin) {
      console.log("User is not admin, skipping user fetch");
      return;
    }
    
    try {
      setIsLoading(true);
      console.log("Fetching users from Supabase...");
      if (showToast) {
        toast.info("Carregando usuários...");
      }
      
      // Use rpc call to avoid RLS recursion
      const { data, error } = await supabase.rpc('get_all_users');
      
      if (error) {
        console.error("RPC error:", error);
        
        // Fallback to direct query if RPC fails
        const { data: directData, error: directError } = await supabase
          .from("users")
          .select("*")
          .order("created_at", { ascending: false });
        
        if (directError) throw directError;
        
        if (isMounted.current) {
          setUsers(directData || []);
          dataFetchedRef.current = true;
        }
      } else {
        console.log("Users data from RPC:", data);
        
        if (isMounted.current) {
          setUsers(data as User[]);
          dataFetchedRef.current = true;
        }
      }
      
      if (isMounted.current && showToast) {
        toast.success(`${data?.length || 0} usuários carregados!`);
      }
    } catch (error: any) {
      console.error("Error fetching users:", error);
      
      if (isMounted.current && showToast) {
        toast.error("Erro ao carregar usuários. Verifique suas permissões.");
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [user?.role]);

  // Refresh users data - only explicitly called when needed
  const refreshUsers = useCallback(() => {
    dataFetchedRef.current = false;
    fetchUsers();
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
