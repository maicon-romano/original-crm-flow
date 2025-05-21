
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Client } from "@/types/client";

export const useClientUpdate = (
  setClients?: (updater: (prevClients: Client[]) => Client[]) => void
) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateClient = async (id: string, clientData: Partial<Client>) => {
    try {
      setIsUpdating(true);
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
      
      // Update the client in the clients array if setClients was provided
      if (setClients) {
        setClients(prevClients => prevClients.map(client => 
          client.id === id ? typedClient : client
        ));
      }
      
      return typedClient;
    } catch (error: any) {
      console.error("Exception updating client:", error);
      throw new Error(error.message || "Erro ao atualizar cliente");
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateClient,
    isUpdating
  };
};
