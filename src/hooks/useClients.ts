
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";

export interface Client {
  id: string;
  user_id?: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  address?: string;
  website?: string;
  tax_id?: string;
  status: string;
  created_at: string;
  updated_at: string;
  drive_folder_id?: string;
  social_media?: boolean;
  paid_traffic?: boolean;
  website_development?: boolean;
  instagram?: string;
  city?: string;
  state?: string;
  contract_value?: number;
  contract_start?: string;
  contract_end?: string;
}

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useSupabaseAuth();

  const fetchClients = async () => {
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
      setClients(data || []);
    } catch (error) {
      console.error("Exception fetching clients:", error);
      toast.error("Erro ao carregar clientes");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteClient = async (id: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error("Error deleting client:", error);
        throw new Error(error.message);
      }
      
      setClients(clients.filter(client => client.id !== id));
      return true;
    } catch (error: any) {
      console.error("Exception deleting client:", error);
      throw new Error(error.message || "Erro ao excluir cliente");
    }
  };

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user]);

  return {
    clients,
    isLoading,
    refreshClients: fetchClients,
    deleteClient
  };
};
