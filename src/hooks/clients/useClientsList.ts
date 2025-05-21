
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Client } from "@/types/client";

export const useClientsList = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useSupabaseAuth();
  const dataFetchedRef = useRef(false);

  const fetchClients = useCallback(async () => {
    // If already fetched data and this isn't an explicit refresh, skip
    if (dataFetchedRef.current) {
      return;
    }

    try {
      setIsLoading(true);
      console.log("Fetching clients...");
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching clients:", error);
        toast.error("Erro ao carregar clientes");
        return;
      }
      
      console.log(`Fetched ${data?.length} clients`);
      
      // Transform the data to ensure person_type is properly typed
      const typedClients = data?.map(client => ({
        ...client,
        person_type: (client.person_type === "fisica" ? "fisica" : "juridica") as "juridica" | "fisica",
        // Ensure other_social_media is properly typed as Record<string, string> or undefined
        other_social_media: client.other_social_media ? client.other_social_media as Record<string, string> : undefined
      })) || [];
      
      setClients(typedClients);
      dataFetchedRef.current = true;
    } catch (error) {
      console.error("Exception fetching clients:", error);
      toast.error("Erro ao carregar clientes");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Force refresh clients data and show toasts
  const refreshClients = useCallback(() => {
    dataFetchedRef.current = false;
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    if (user) {
      fetchClients();
    }
    
    // Cleanup function
    return () => {
      // Reset the fetch flag when component unmounts
      dataFetchedRef.current = false;
    };
  }, [user, fetchClients]);

  return {
    clients,
    setClients, // Needed for other hooks to update the client list
    isLoading,
    refreshClients
  };
};
