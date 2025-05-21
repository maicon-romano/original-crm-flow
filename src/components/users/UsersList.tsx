
import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MoreHorizontal, Edit, Trash2, RefreshCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { UserEditDialog } from "./UserEditDialog";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  cargo?: string;
  position?: string;
  role: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
  last_login?: string;
}

interface UsersListProps {
  users: User[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const UsersList = ({ users, isLoading, onRefresh }: UsersListProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const { user: currentUser } = useSupabaseAuth();
  
  // Format date from timestamp
  const formatDate = (timestamp?: string) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleDateString('pt-BR');
  };
  
  // Reset user password
  const handleResetPassword = async (email: string) => {
    try {
      toast.info("Enviando email de redefinição de senha...");
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      toast.success("Email de redefinição de senha enviado!");
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast.error("Erro ao enviar redefinição de senha");
    }
  };

  // Delete user
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      setIsDeleting(true);
      toast.info("Excluindo usuário...");
      
      // First, check if we're trying to delete ourselves
      if (userToDelete.id === currentUser?.id) {
        throw new Error("Você não pode excluir sua própria conta");
      }
      
      // Delete from users table
      const { error: deleteError } = await supabase
        .from("users")
        .delete()
        .eq("id", userToDelete.id);
      
      if (deleteError) throw deleteError;
      
      // Delete from auth.users using an edge function
      const { error: authDeleteError } = await supabase.functions.invoke("delete-user", {
        body: {
          userId: userToDelete.id,
        }
      });
      
      if (authDeleteError) {
        console.error("Error deleting auth user:", authDeleteError);
        // Continue anyway since we've already deleted from our users table
      }
      
      toast.success(`Usuário ${userToDelete.name} excluído com sucesso`);
      onRefresh(); // Refresh the list
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "Erro ao excluir usuário");
    } finally {
      setIsDeleting(false);
      setUserToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Data Cadastro</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            ) : (
              users.map((userData) => (
                <TableRow key={userData.id}>
                  <TableCell className="font-medium">{userData.name}</TableCell>
                  <TableCell>{userData.email}</TableCell>
                  <TableCell>{userData.cargo || userData.position || "-"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={(userData.role === "admin") ? "default" : "outline"}
                      className={(userData.role === "admin") ? "bg-blue-500" : ""}
                    >
                      {(userData.role === "admin") ? "Administrador" : (userData.role === "client" ? "Cliente" : "Funcionário")}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(userData.created_at)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={userData.active ? "default" : "secondary"}
                      className={userData.active ? "bg-green-500" : "bg-gray-500"}
                    >
                      {userData.active ? "Ativo" : "Inativo"}
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
                        <DropdownMenuItem onClick={() => setUserToEdit(userData)}>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleResetPassword(userData.email)}>
                          <RefreshCcw className="mr-2 h-4 w-4" /> Redefinir Senha
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => setUserToDelete(userData)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Edit User Dialog */}
      <Dialog open={!!userToEdit} onOpenChange={() => userToEdit && setUserToEdit(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          {userToEdit && (
            <UserEditDialog 
              user={userToEdit} 
              onComplete={() => {
                setUserToEdit(null);
                onRefresh();
              }} 
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete User Confirmation */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => userToDelete && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário {userToDelete?.name}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
