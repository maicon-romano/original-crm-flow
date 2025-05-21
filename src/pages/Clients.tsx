
import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCaption, 
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
  DialogFooter, 
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
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, MoreHorizontal, Edit, Trash2, FileText, Folder } from "lucide-react";

// Mock client data
const clientsData = [
  {
    id: "1",
    razaoSocial: "Empresa ABC Ltda",
    nomeFantasia: "ABC Marketing",
    cnpj: "12.345.678/0001-90",
    email: "contato@abcmarketing.com",
    telefone: "(11) 98765-4321",
    instagram: "@abcmarketing",
    valorMensal: 2500.0,
    status: "active"
  },
  {
    id: "2",
    razaoSocial: "XYZ Comércio e Serviços Ltda",
    nomeFantasia: "XYZ Digital",
    cnpj: "98.765.432/0001-10",
    email: "contato@xyzdigital.com",
    telefone: "(21) 98765-4321",
    instagram: "@xyzdigital",
    valorMensal: 3300.0,
    status: "active"
  },
  {
    id: "3",
    razaoSocial: "Tech Solutions Ltda",
    nomeFantasia: "TechSol",
    cnpj: "45.678.901/0001-23",
    email: "contato@techsol.com",
    telefone: "(31) 98765-4321",
    instagram: "@techsol",
    valorMensal: 1700.0,
    status: "inactive"
  },
  {
    id: "4",
    razaoSocial: "Inovação Digital Ltda",
    nomeFantasia: "Inova Digital",
    cnpj: "56.789.012/0001-34",
    email: "contato@inovadigital.com",
    telefone: "(41) 98765-4321",
    instagram: "@inovadigital",
    valorMensal: 2300.0,
    status: "active"
  },
  {
    id: "5",
    razaoSocial: "Marketing Estratégico S.A.",
    nomeFantasia: "Estratégia Marketing",
    cnpj: "67.890.123/0001-45",
    email: "contato@estrategiamarketing.com",
    telefone: "(51) 98765-4321",
    instagram: "@estrategiamarketing",
    valorMensal: 3000.0,
    status: "active"
  }
];

const Clients = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  
  // Filter clients based on search query
  const filteredClients = clientsData.filter(client => 
    client.nomeFantasia.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.razaoSocial.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.cnpj.includes(searchQuery)
  );
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

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
          <Dialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Cliente</DialogTitle>
                <DialogDescription>
                  Preencha os dados do novo cliente. Ao salvar, uma pasta será criada automaticamente no Google Drive.
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh]">
                <div className="grid gap-4 py-4 px-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="razaoSocial">Razão Social</Label>
                      <Input id="razaoSocial" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
                      <Input id="nomeFantasia" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cnpj">CNPJ</Label>
                      <Input id="cnpj" placeholder="00.000.000/0001-00" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="valorMensal">Valor Mensal</Label>
                      <Input id="valorMensal" type="number" min="0" step="100" placeholder="0,00" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="endereco">Endereço Completo</Label>
                      <Input id="endereco" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <Input id="whatsapp" placeholder="(00) 00000-0000" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="instagram">Instagram</Label>
                      <Input id="instagram" placeholder="@perfil" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="site">Site</Label>
                      <Input id="site" placeholder="https://..." />
                    </div>
                  </div>
                </div>
              </ScrollArea>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddClientOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setIsAddClientOpen(false)}>
                  Salvar Cliente
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead className="text-right">Valor Mensal</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{client.nomeFantasia}</div>
                      <div className="text-xs text-muted-foreground">{client.razaoSocial}</div>
                    </div>
                  </TableCell>
                  <TableCell>{client.cnpj}</TableCell>
                  <TableCell>
                    <div>
                      <div>{client.email}</div>
                      <div className="text-xs text-muted-foreground">{client.telefone}</div>
                      <div className="text-xs text-muted-foreground">{client.instagram}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(client.valorMensal)}
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
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FileText className="mr-2 h-4 w-4" /> Ver Projetos
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Folder className="mr-2 h-4 w-4" /> Ver Arquivos
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3}>Total</TableCell>
              <TableCell className="text-right">
                {formatCurrency(
                  filteredClients.reduce((sum, client) => sum + client.valorMensal, 0)
                )}
              </TableCell>
              <TableCell colSpan={2}></TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
};

export default Clients;
