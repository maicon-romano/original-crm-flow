
import { useClientsList } from "./clients/useClientsList";
import { useClientCreate } from "./clients/useClientCreate";
import { useClientUpdate } from "./clients/useClientUpdate";
import { useClientDelete } from "./clients/useClientDelete";
import { Client } from "@/types/client";

export const useClients = () => {
  const { 
    clients, 
    setClients,
    isLoading, 
    refreshClients 
  } = useClientsList();
  
  const { createClient } = useClientCreate(undefined, setClients);
  const { updateClient } = useClientUpdate(setClients);
  const { deleteClient } = useClientDelete(setClients);

  return {
    clients,
    isLoading,
    refreshClients,
    createClient,
    updateClient,
    deleteClient
  };
};
