
import { useState } from "react";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Client } from "@/types/client";

export const useClientDelete = (
  setClients?: (updater: (prevClients: Client[]) => Client[]) => void
) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteClient = async (id: string) => {
    try {
      setIsDeleting(true);
      console.log(`Attempting to delete client with ID: ${id}`);
      
      await deleteDoc(doc(db, 'clientes', id));
      
      // Remove the client from the clients array if setClients was provided
      if (setClients) {
        setClients(clients => clients.filter(client => client.id !== id));
      }
      
      console.log(`Client with ID: ${id} successfully deleted`);
      return true;
    } catch (error: any) {
      console.error("Exception deleting client:", error);
      throw new Error(error.message || "Erro ao excluir cliente");
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteClient,
    isDeleting
  };
};
