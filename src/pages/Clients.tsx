
import { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableFooter, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, MoreHorizontal, Edit, Trash2, FileText, Folder, Loader2, ExternalLink } from "lucide-react";
import { collection, getDocs, query, orderBy, getFirestore } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { ClientForm } from "@/components/clients/ClientForm";
import { toast as sonnerToast } from "sonner";

// Define client interface from Firestore data
interface Client {
  userId: string;
  companyName: string;
  contactName: string;
  cnpjCpf: string;
  email: string;
  phone: string;
  instagram?: string;
  contractValue?: string;
  address?: string;
  city?: string;
  state?: string;
  status: string;
  createdAt: number;
  googleDriveFolderUrl?: string;
}

const Clients = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Fetch clients from Firestore with better error handling
  useEffect(() => {
    const fetchClients = async () => {
      if (!user) {
        console.log("No authenticated user, skipping client fetch");
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        console.log("Attempting to fetch clients with user:", user.email, "role:", user.role, "userType:", user.userType);
        sonnerToast.info("Carregando clientes...");
        
        const clientsRef = collection(db, "clients");
        const q = query(clientsRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        const clientsData: Client[] = [];
        querySnapshot.forEach((doc) => {
          clientsData.push({ ...doc.data(), userId: doc.id } as Client);
        });
        
        setClients(clientsData);
        console.log("Clients fetched successfully:", clientsData.length);
        sonnerToast.success(`${clientsData.length} clientes carregados com sucesso!`);
      } catch (error) {
        console.error("Error fetching clients:", error);
        sonnerToast.error("Erro ao carregar clientes. Verifique suas permissões.");
        toast({
          title: "Erro ao carregar clientes",
          description: "Não foi possível carregar a lista de clientes. Verifique suas permissões.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    // Only fetch clients if user is authenticated
    if (user) {
      // Add a small delay to ensure auth is fully resolved
      setTimeout(() => {
        fetchClients();
      }, 500);
    }
  }, [toast, user]);
  
  // Filter clients based on search query
  const filteredClients = clients.filter(client => 
    client.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.cnpjCpf?.includes(searchQuery) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Format currency
  const formatCurrency = (value: string | undefined) => {
    if (!value) return "R$ 0,00";
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return "R$ 0,00";
    
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(numValue);
  };

  // Format date from timestamp
  const formatDate = (timestamp: number) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleDateString('pt-BR');
  };

  // Handle client create/edit complete
  const handleClientFormComplete = () => {
    setIsAddClientOpen(false);
    // Refetch clients
    const fetchClients = async () => {
      try {
        sonnerToast.info("Atualizando lista de clientes...");
        const clientsRef = collection(db, "clients");
        const q = query(clientsRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        const clientsData: Client[] = [];
        querySnapshot.forEach((doc) => {
          clientsData.push({ ...doc.data(), userId: doc.id } as Client);
        });
        
        setClients(clientsData);
        sonnerToast.success("Lista de clientes atualizada!");
      } catch (error) {
        console.error("Error refetching clients:", error);
        sonnerToast.error("Erro ao atualizar lista de clientes");
      }
    };
    
    fetchClients();
  };

  // Check if user has permission to manage clients
  const isAdmin = user?.role === "admin" || user?.userType === "admin";
  const canManageClients = user && (isAdmin || user.role === "user");

  // If user is not logged in or doesn't have permission, redirect
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h2 className="text-xl font-semibold mb-2">Carregando informações...</h2>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
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
          {canManageClients && (
            <Dialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Novo Cliente
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Cliente</DialogTitle>
                  <DialogDescription>
                    Preencha os dados do novo cliente. Ao salvar, uma pasta será criada automaticamente no Google Drive e um email será enviado com os dados de acesso.
                  </DialogDescription>
                </DialogHeader>
                <ClientForm onComplete={handleClientFormComplete} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Identificação</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead className="text-right">Valor Mensal</TableHead>
                <TableHead>Data Cadastro</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Nenhum cliente encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.userId}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{client.companyName}</div>
                        <div className="text-xs text-muted-foreground">{client.contactName}</div>
                      </div>
                    </TableCell>
                    <TableCell>{client.cnpjCpf}</TableCell>
                    <TableCell>
                      <div>
                        <div>{client.email}</div>
                        <div className="text-xs text-muted-foreground">{client.phone}</div>
                        {client.instagram && (
                          <div className="text-xs text-muted-foreground">{client.instagram}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(client.contractValue)}
                    </TableCell>
                    <TableCell>
                      {formatDate(client.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={client.status === "active" ? "default" : "secondary"}
                        className={client.status === "active" ? "bg-green-500" : "bg-gray-500"}
                      >
                        {client.status === "active" ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {isAdmin && (
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>
                            <FileText className="mr-2 h-4 w-4" /> Ver Projetos
                          </DropdownMenuItem>
                          {client.googleDriveFolderUrl && (
                            <DropdownMenuItem onSelect={(e) => {
                              e.preventDefault();
                              window.open(client.googleDriveFolderUrl, '_blank');
                            }}>
                              <Folder className="mr-2 h-4 w-4" /> Abrir no Drive
                              <ExternalLink className="ml-2 h-3 w-3" />
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {isAdmin && (
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" /> Excluir
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3}>Total: {filteredClients.length} clientes</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(
                    filteredClients
                      .map(client => parseFloat(client.contractValue || "0"))
                      .filter(value => !isNaN(value))
                      .reduce((sum, value) => sum + value, 0)
                      .toString()
                  )}
                </TableCell>
                <TableCell colSpan={3}></TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
    </div>
  );
};

export default Clients;
