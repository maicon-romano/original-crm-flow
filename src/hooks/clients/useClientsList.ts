
import { useState, useEffect, useCallback, useRef } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Client } from "@/types/client";

export const useClientsList = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const dataFetchedRef = useRef(false);

  const fetchClients = useCallback(async () => {
    // If already fetched data and this isn't an explicit refresh, skip
    if (dataFetchedRef.current) {
      return;
    }

    try {
      setIsLoading(true);
      console.log("Fetching clients...");
      
      const clientsQuery = query(collection(db, 'clientes'), orderBy('created_at', 'desc'));
      const snapshot = await getDocs(clientsQuery);
      
      const clientsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          person_type: (data.person_type === "fisica" ? "fisica" : "juridica") as "juridica" | "fisica",
          other_social_media: data.other_social_media || undefined
        } as Client;
      });
      
      console.log(`Fetched ${clientsData.length} clients`);
      setClients(clientsData);
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
