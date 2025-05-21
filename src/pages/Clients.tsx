
import { useEffect, useState } from "react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/integrations/supabase/client";
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
import { Search, Plus, MoreHorizontal, Edit, Trash2, RefreshCcw, Loader2, FileText, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface Client {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  website?: string;
  status: string;
  created_at: string;
}

const Clients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const { user } = useSupabaseAuth();

  // Fetch clients from Supabase
  useEffect(() => {
    const fetchClients = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        console.log("Attempting to fetch clients with user:", user.email, "role:", user.role);
        
        // Fetch clients
        const { data, error } = await supabase
          .from("clients")
          .select("*")
          .order("created_at", { ascending: false });
        
        if (error) {
          console.error("Error fetching clients:", error);
          toast.error("Erro ao carregar clientes");
          return;
        }
        
        console.log("Clients loaded:", data?.length || 0);
        setClients(data || []);
      } catch (error) {
        console.error("Exception fetching clients:", error);
        toast.error("Erro ao carregar clientes");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchClients();
    }
  }, [user]);

  // Filter clients based on search query
  const filteredClients = clients.filter(client => 
    client.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format date from timestamp
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Novo Cliente
          </Button>
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center space-y-4 bg-white dark:bg-gray-800 p-12 rounded-lg border text-center">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Search className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Nenhum cliente encontrado</h2>
          <p className="text-muted-foreground max-w-sm">
            {searchQuery 
              ? "Nenhum cliente corresponde à sua pesquisa. Tente outros termos."
              : "Clientes cadastrados aparecerão aqui. Adicione um novo cliente para começar."}
          </p>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Adicionar Cliente
          </Button>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Telefone</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="hidden md:table-cell">Cadastro</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.company_name}</TableCell>
                  <TableCell>{client.contact_name}</TableCell>
                  <TableCell className="hidden md:table-cell">{client.email}</TableCell>
                  <TableCell className="hidden md:table-cell">{client.phone || "-"}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge
                      variant={client.status === "active" ? "default" : client.status === "inactive" ? "secondary" : "outline"}
                      className={client.status === "active" ? "bg-green-500" : client.status === "inactive" ? "bg-gray-500" : ""}
                    >
                      {client.status === "active" ? "Ativo" : client.status === "inactive" ? "Inativo" : "Pendente"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{formatDate(client.created_at)}</TableCell>
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
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FileText className="mr-2 h-4 w-4" /> Projetos
                        </DropdownMenuItem>
                        {client.website && (
                          <DropdownMenuItem onClick={() => window.open(client.website, '_blank')}>
                            <ExternalLink className="mr-2 h-4 w-4" /> Website
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default Clients;
