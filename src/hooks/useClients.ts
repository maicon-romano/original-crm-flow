
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";

export interface Client {
  id: string;
  user_id?: string;
  // Person type
  person_type: "juridica" | "fisica";
  
  // Juridical person fields
  company_name?: string;
  legal_name?: string;
  fantasy_name?: string;
  tax_id?: string;
  state_registration?: string;
  municipal_registration?: string;
  
  // Physical person fields
  contact_name: string;
  cpf?: string;
  rg?: string;
  
  // Contact information
  email: string;
  phone?: string;
  responsible_name?: string;
  responsible_position?: string;
  
  // Address
  address?: string;
  address_number?: string;
  address_complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  
  // Internal organization
  status: string;
  client_source?: string;
  plan?: string;
  notes?: string;
  
  // Social media and links
  instagram?: string;
  website?: string;
  whatsapp_link?: string;
  other_social_media?: Record<string, string>;
  
  // Services flags
  social_media?: boolean;
  paid_traffic?: boolean;
  website_development?: boolean;
  
  // Contract
  contract_value?: number;
  contract_start?: string;
  contract_end?: string;
  
  // CRM access
  send_email_invite?: boolean;
  send_whatsapp_invite?: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Google Drive
  drive_folder_id?: string;
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
      
      // Transform the data to ensure person_type is properly typed
      const typedClients = data?.map(client => ({
        ...client,
        person_type: (client.person_type === "fisica" ? "fisica" : "juridica") as "juridica" | "fisica"
      })) || [];
      
      setClients(typedClients);
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
