
import { useState } from "react";
import { useClients } from "@/hooks/useClients";
import { ClientsList } from "@/components/clients/ClientsList";
import { ClientsHeader } from "@/components/clients/ClientsHeader";
import { toast } from "sonner";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";

const Clients = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { clients, isLoading, refreshClients, deleteClient } = useClients();
  const { user } = useSupabaseAuth();

  // Filter clients based on search query
  const filteredClients = clients.filter(client => 
    client.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Client deletion handler
  const handleDeleteClient = async (id: string) => {
    try {
      return await deleteClient(id);
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir cliente");
      return false;
    }
  };

  return (
    <div className="space-y-6">
      <ClientsHeader 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onRefresh={refreshClients}
        onClientAdded={refreshClients}
      />
      
      <ClientsList 
        clients={filteredClients}
        isLoading={isLoading}
        onRefresh={refreshClients}
        onDelete={user?.role === "admin" ? handleDeleteClient : undefined}
      />
    </div>
  );
};

export default Clients;
