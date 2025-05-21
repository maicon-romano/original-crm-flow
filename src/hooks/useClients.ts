
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Client, ClientInsert } from "@/types/client";

export const useClients = () => {
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

  const createClient = async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log("Creating client:", clientData);

      // Ensure required fields are present for database insertion
      const insertData: ClientInsert = {
        ...clientData,
        // Make sure person_type is always defined with a default value if missing
        person_type: clientData.person_type || "juridica",
        company_name: clientData.person_type === "juridica" ? clientData.company_name || clientData.fantasy_name || "" : clientData.company_name || "",
        contact_name: clientData.contact_name || "",
        email: clientData.email || "",
        status: clientData.status || "active"
      };
      
      const { data, error } = await supabase
        .from('clients')
        .insert(insertData)
        .select('*')
        .single();
      
      if (error) {
        console.error("Error creating client:", error);
        throw new Error(error.message);
      }
      
      // Transform the returned client data to ensure correct typing
      const typedClient = {
        ...data,
        person_type: (data.person_type === "fisica" ? "fisica" : "juridica") as "juridica" | "fisica",
        other_social_media: data.other_social_media ? data.other_social_media as Record<string, string> : undefined
      };
      
      // Add the new client to the clients array
      setClients(prevClients => [typedClient, ...prevClients]);

      // Create Drive folders for the new client if they have a company_name
      if (typedClient.company_name) {
        try {
          const { data: driveData, error: driveError } = await supabase.functions.invoke('create-drive-folders', {
            body: { client: typedClient }
          });
          
          if (driveError) {
            console.error("Error creating Drive folders:", driveError);
            toast.error("Erro ao criar pastas no Google Drive");
          } else if (driveData?.folder_id) {
            console.log("Drive folders created successfully:", driveData);
            toast.success("Pastas do Google Drive criadas com sucesso!");
            
            // Update the client with the Drive folder ID
            updateClient(typedClient.id, { drive_folder_id: driveData.folder_id });
          }
        } catch (driveErr) {
          console.error("Exception creating Drive folders:", driveErr);
        }
      }

      // Send email invitation if requested
      if (typedClient.send_email_invite && typedClient.email) {
        try {
          const randomPassword = Math.random().toString(36).slice(-10);
          
          const { error: inviteError } = await supabase.functions.invoke('send-invitation', {
            body: {
              email: typedClient.email,
              name: typedClient.contact_name,
              company: typedClient.company_name,
              password: randomPassword,
              role: 'client',
              position: typedClient.responsible_position || '',
              phone: typedClient.phone || '',
              send_whatsapp: typedClient.send_whatsapp_invite || false
            }
          });
          
          if (inviteError) {
            console.error("Error sending invitation:", inviteError);
            toast.error("Erro ao enviar convite por e-mail");
          } else {
            toast.success("Convite enviado com sucesso!");
          }
        } catch (inviteErr) {
          console.error("Exception sending invitation:", inviteErr);
          toast.error("Erro ao enviar convite por e-mail");
        }
      }
      
      return typedClient;
    } catch (error: any) {
      console.error("Exception creating client:", error);
      throw new Error(error.message || "Erro ao criar cliente");
    }
  };

  const updateClient = async (id: string, clientData: Partial<Client>) => {
    try {
      console.log("Updating client:", id, clientData);
      
      const { data, error } = await supabase
        .from('clients')
        .update({
          ...clientData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single();
      
      if (error) {
        console.error("Error updating client:", error);
        throw new Error(error.message);
      }
      
      // Transform the returned client data to ensure correct typing
      const typedClient = {
        ...data,
        person_type: (data.person_type === "fisica" ? "fisica" : "juridica") as "juridica" | "fisica",
        other_social_media: data.other_social_media ? data.other_social_media as Record<string, string> : undefined
      };
      
      // Update the client in the clients array
      setClients(prevClients => prevClients.map(client => 
        client.id === id ? typedClient : client
      ));
      
      return typedClient;
    } catch (error: any) {
      console.error("Exception updating client:", error);
      throw new Error(error.message || "Erro ao atualizar cliente");
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
    
    // Cleanup function
    return () => {
      // Reset the fetch flag when component unmounts
      dataFetchedRef.current = false;
    };
  }, [user, fetchClients]);

  return {
    clients,
    isLoading,
    refreshClients,
    createClient,
    updateClient,
    deleteClient
  };
};
