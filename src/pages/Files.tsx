
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Upload, FolderOpen, Loader2, ExternalLink } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface Client {
  id: string;
  company_name: string;
  drive_folder_id?: string;
}

interface DriveFolder {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
}

const FilesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [clientFolders, setClientFolders] = useState<DriveFolder[]>([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);
  const { user } = useSupabaseAuth();
  
  const isAdmin = user?.role === "admin";
  const isClient = user?.role === "client";
  
  const fetchClients = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase.from("clients").select("id, company_name, drive_folder_id");
      
      // If user is a client, only show their client record
      if (isClient) {
        query = query.eq("user_id", user.id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setClients(data || []);
      
      // If we're a client user and have only one client profile, automatically select it
      if (isClient && data && data.length === 1) {
        setSelectedClient(data[0].id);
        fetchClientFolders(data[0].drive_folder_id);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("Erro ao carregar clientes");
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchClientFolders = async (folderId?: string) => {
    if (!folderId) {
      setClientFolders([]);
      return;
    }
    
    try {
      setIsLoadingFolders(true);
      
      const { data, error } = await supabase.functions.invoke('list-drive-folders', {
        body: { folderId }
      });
      
      if (error) throw error;
      
      setClientFolders(data?.folders || []);
    } catch (error) {
      console.error("Error fetching folders:", error);
      toast.error("Erro ao carregar pastas do cliente");
      setClientFolders([]);
    } finally {
      setIsLoadingFolders(false);
    }
  };
  
  const handleClientChange = (clientId: string) => {
    setSelectedClient(clientId);
    const client = clients.find(c => c.id === clientId);
    fetchClientFolders(client?.drive_folder_id);
  };
  
  // Filter clients based on search query
  const filteredClients = clients.filter(client => 
    client.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Initial data fetching
  useEffect(() => {
    fetchClients();
  }, [user]);
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // No clients state
  if (clients.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Arquivos</h1>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar arquivo..."
                className="pl-8 w-full sm:w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
  
        <div className="flex flex-col items-center justify-center space-y-4 bg-white dark:bg-gray-800 p-12 rounded-lg border text-center">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <FolderOpen className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Nenhum cliente encontrado</h2>
          <p className="text-muted-foreground max-w-sm">
            {isAdmin 
              ? "Cadastre novos clientes para visualizar seus arquivos." 
              : "Você não tem acesso a nenhum arquivo no momento."}
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Arquivos</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar cliente..."
              className="pl-8 w-full sm:w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      {isClient && clients.length === 1 ? (
        <div className="text-xl font-bold">{clients[0].company_name}</div>
      ) : (
        <div className="w-full max-w-md">
          <Select value={selectedClient || ""} onValueChange={handleClientChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um cliente" />
            </SelectTrigger>
            <SelectContent>
              {filteredClients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.company_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      {selectedClient && (
        <div className="space-y-4">
          {isLoadingFolders ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : clientFolders.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {clientFolders.map((folder) => (
                <Card key={folder.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-4">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-6 w-6 text-amber-500" />
                        <h3 className="font-medium truncate">{folder.name}</h3>
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-muted/30 p-2 border-t">
                      <span className="text-xs text-muted-foreground">Pasta Google Drive</span>
                      <Button variant="ghost" size="sm" onClick={() => window.open(folder.webViewLink, "_blank")}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4 bg-white dark:bg-gray-800 p-12 rounded-lg border text-center">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <FolderOpen className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">
                {selectedClient 
                  ? "Nenhuma pasta encontrada para este cliente" 
                  : "Selecione um cliente para visualizar suas pastas"}
              </h2>
              <p className="text-muted-foreground max-w-sm">
                Este cliente não possui pastas configuradas no Google Drive.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilesPage;
