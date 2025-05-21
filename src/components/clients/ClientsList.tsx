
import { useState } from "react";
import { Client } from "@/hooks/useClients";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ClientEditDialog } from "./ClientEditDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, MoreHorizontal, RefreshCw } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface ClientsListProps {
  clients: Client[];
  isLoading: boolean;
  onRefresh: () => void;
  onDelete?: (id: string) => Promise<boolean>;
}

export function ClientsList({ clients, isLoading, onRefresh, onDelete }: ClientsListProps) {
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  const handleEditComplete = () => {
    setIsDialogOpen(false);
    onRefresh();
    toast.success("Cliente atualizado com sucesso!");
  };
  
  const handleEdit = (client: Client) => {
    setEditClient(client);
    setIsDialogOpen(true);
  };
  
  const handleDelete = async (id: string, name: string) => {
    if (!onDelete) return;
    
    const success = await onDelete(id);
    if (success) {
      toast.success(`Cliente ${name} excluído com sucesso!`);
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Empty state
  if (clients.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nenhum cliente encontrado</CardTitle>
          <CardDescription>
            Não foram encontrados clientes com os critérios atuais.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Tente ajustar sua pesquisa ou adicione um novo cliente.
            </p>
            <Button onClick={onRefresh} variant="outline" className="mt-2">
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar Lista
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Clientes</CardTitle>
        <CardDescription>
          Gerencie e visualize todos os clientes da plataforma.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Serviços</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Criado em</TableHead>
                <TableHead className="hidden md:table-cell">Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {getInitials(client.company_name || client.contact_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{client.company_name}</div>
                        <div className="text-sm text-muted-foreground">{client.contact_name}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {client.social_media && (
                        <Badge variant="outline" className="text-xs">Social Media</Badge>
                      )}
                      {client.paid_traffic && (
                        <Badge variant="outline" className="text-xs">Tráfego Pago</Badge>
                      )}
                      {client.website_development && (
                        <Badge variant="outline" className="text-xs">Site</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                      {client.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatDate(client.created_at)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatCurrency(client.contract_value || 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleEdit(client)}>
                          Editar
                        </DropdownMenuItem>
                        {onDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  Excluir
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o cliente {client.company_name}.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(client.id, client.company_name)}>
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      
      {editClient && (
        <ClientEditDialog 
          client={editClient} 
          open={isDialogOpen} 
          onOpenChange={setIsDialogOpen}
          onComplete={handleEditComplete}
        />
      )}
    </Card>
  );
}
