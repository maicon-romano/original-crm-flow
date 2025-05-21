
import { useState } from "react";
import { Client } from "@/hooks/useClients";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHeader, 
  TableHead, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  ExternalLink, 
  FileText,
  Loader2,
  FolderOpen,
  Search
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ClientEditDialog } from "./ClientEditDialog";

interface ClientsListProps {
  clients: Client[];
  isLoading: boolean;
  onRefresh: () => void;
  onDelete?: (id: string) => Promise<boolean>;
}

export function ClientsList({ clients, isLoading, onRefresh, onDelete }: ClientsListProps) {
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const { user } = useSupabaseAuth();
  
  // User roles
  const isAdmin = user?.role === "admin";
  const isAdminOrStaff = user?.role === "admin" || user?.role === "user";
  const isClient = user?.role === "client";

  // Format date from timestamp
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleDelete = async () => {
    if (!clientToDelete || !onDelete) return;
    
    try {
      setIsDeleting(true);
      await onDelete(clientToDelete.id);
      toast.success("Cliente excluído com sucesso");
      setClientToDelete(null);
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir cliente");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewFiles = (client: Client) => {
    if (client.drive_folder_id) {
      window.open(`https://drive.google.com/drive/folders/${client.drive_folder_id}`, '_blank');
    } else {
      toast.error("Este cliente não possui pasta no Drive");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 bg-white dark:bg-gray-800 p-12 rounded-lg border text-center">
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Search className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">Nenhum cliente encontrado</h2>
        <p className="text-muted-foreground max-w-sm">
          {clients.length === 0 ? "Nenhum cliente encontrado." : "Clientes cadastrados aparecerão aqui."}
        </p>
        {isAdminOrStaff && (
          <Button onClick={() => onRefresh()}>
            <RefreshCcw className="mr-2 h-4 w-4" /> Atualizar
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
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
            {clients.map((client) => (
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
                      
                      {isAdminOrStaff && (
                        <DropdownMenuItem onClick={() => setClientToEdit(client)}>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuItem onClick={() => handleViewFiles(client)}>
                        <FolderOpen className="mr-2 h-4 w-4" /> Arquivos
                      </DropdownMenuItem>
                      
                      {isAdmin && (
                        <DropdownMenuItem onClick={() => window.location.href = `/projects?client=${client.id}`}>
                          <FileText className="mr-2 h-4 w-4" /> Projetos
                        </DropdownMenuItem>
                      )}
                      
                      {client.website && (
                        <DropdownMenuItem onClick={() => window.open(client.website, '_blank')}>
                          <ExternalLink className="mr-2 h-4 w-4" /> Website
                        </DropdownMenuItem>
                      )}
                      
                      {isAdmin && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive" 
                            onClick={() => setClientToDelete(client)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                          </DropdownMenuItem>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!clientToDelete} onOpenChange={open => !open && setClientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente "{clientToDelete?.company_name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      {clientToEdit && (
        <ClientEditDialog 
          client={clientToEdit} 
          open={!!clientToEdit}
          onOpenChange={(open) => !open && setClientToEdit(null)}
          onComplete={() => {
            setClientToEdit(null);
            onRefresh();
          }}
        />
      )}
    </>
  );
}
