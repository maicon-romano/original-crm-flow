import { useEffect, useState } from "react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
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
import { Badge } from "@/components/ui/badge";
import { Search, Plus, MoreHorizontal, Edit, Trash2, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface Lead {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  source?: string;
  stage: string;
  created_at: string;
}

const stageColors: { [key: string]: string } = {
  new: "bg-blue-500",
  contacted: "bg-cyan-500",
  meeting_scheduled: "bg-teal-500",
  proposal_sent: "bg-yellow-500",
  negotiation: "bg-orange-500",
  won: "bg-green-500",
  lost: "bg-red-500",
  on_hold: "bg-gray-500",
  archive: "bg-gray-400"
};

const stageTitles: { [key: string]: string } = {
  new: "Novo",
  contacted: "Contatado",
  meeting_scheduled: "Reunião Agendada",
  proposal_sent: "Proposta Enviada",
  negotiation: "Em Negociação",
  won: "Ganho",
  lost: "Perdido",
  on_hold: "Em Espera",
  archive: "Arquivado"
};

const Leads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useSupabaseAuth();

  // Fetch leads from Firestore
  useEffect(() => {
    const fetchLeads = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        
        // Fetch leads using Firebase
        const leadsQuery = query(
          collection(db, "leads"), 
          orderBy("created_at", "desc")
        );
        
        const querySnapshot = await getDocs(leadsQuery);
        const leadsData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Ensure created_at is a string
            created_at: data.created_at instanceof Date 
              ? data.created_at.toISOString() 
              : typeof data.created_at === 'object' && data.created_at?.toDate 
                ? data.created_at.toDate().toISOString()
                : data.created_at || new Date().toISOString()
          } as Lead;
        });
        
        console.log("Leads loaded:", leadsData.length || 0);
        setLeads(leadsData);
      } catch (error) {
        console.error("Exception fetching leads:", error);
        toast.error("Erro ao carregar leads");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchLeads();
    }
  }, [user]);

  // Filter leads based on search query
  const filteredLeads = leads.filter(lead => 
    lead.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.email?.toLowerCase().includes(searchQuery.toLowerCase())
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
        <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar lead..."
              className="pl-8 w-full sm:w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Novo Lead
          </Button>
        </div>
      </div>

      {filteredLeads.length === 0 ? (
        <div className="flex flex-col items-center justify-center space-y-4 bg-white dark:bg-gray-800 p-12 rounded-lg border text-center">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Search className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Nenhum lead encontrado</h2>
          <p className="text-muted-foreground max-w-sm">
            {searchQuery 
              ? "Nenhum lead corresponde à sua pesquisa. Tente outros termos."
              : "Leads cadastrados aparecerão aqui. Adicione um novo lead para começar."}
          </p>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Adicionar Lead
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
                <TableHead>Estágio</TableHead>
                <TableHead className="hidden md:table-cell">Cadastro</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.company_name}</TableCell>
                  <TableCell>{lead.contact_name}</TableCell>
                  <TableCell className="hidden md:table-cell">{lead.email}</TableCell>
                  <TableCell className="hidden md:table-cell">{lead.phone || "-"}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={stageColors[lead.stage] || "bg-gray-500"}
                    >
                      {stageTitles[lead.stage] || lead.stage}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{formatDate(lead.created_at)}</TableCell>
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
                          <ArrowRight className="mr-2 h-4 w-4" /> Avançar Estágio
                        </DropdownMenuItem>
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

export default Leads;
