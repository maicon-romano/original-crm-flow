
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
import { MoreHorizontal, Edit, Trash2, RefreshCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
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
                    {(userData.role === "admin") ? "Administrador" : "Funcionário"}
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
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleResetPassword(userData.email)}>
                        <RefreshCcw className="mr-2 h-4 w-4" /> Redefinir Senha
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
      </Table>
    </div>
  );
};
