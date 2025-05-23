
import { useState } from "react";
import { doc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
      
      const clientRef = doc(db, 'clientes', id);
      
      // Add updated_at timestamp
      await updateDoc(clientRef, {
        ...clientData,
        updated_at: serverTimestamp()
      });
      
      // Get the updated client data
      const updatedDocSnap = await getDoc(clientRef);
      
      if (!updatedDocSnap.exists()) {
        throw new Error("Cliente não encontrado após atualização");
      }
      
      // Transform the returned client data to ensure correct typing
      const data = updatedDocSnap.data();
      const typedClient = {
        id: updatedDocSnap.id,
        ...data,
        person_type: (data.person_type === "fisica" ? "fisica" : "juridica") as "juridica" | "fisica",
        other_social_media: data.other_social_media || undefined
      } as Client;
      
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
