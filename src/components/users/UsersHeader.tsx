
import { useState } from "react";
import { Search, Plus, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { UserForm } from "@/components/users/UserForm";
import { InviteUserDialog } from "@/components/users/InviteUserDialog";

interface UsersHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onUserAdded: () => void;
}

export const UsersHeader = ({ searchQuery, setSearchQuery, onUserAdded }: UsersHeaderProps) => {
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const handleUserFormComplete = () => {
    setIsAddUserOpen(false);
    setIsInviteOpen(false);
    onUserAdded();
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
      <div className="flex gap-2 w-full sm:w-auto">
        <div className="relative flex-1 sm:flex-initial">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar usuário..."
            className="pl-8 w-full sm:w-[250px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Mail className="mr-2 h-4 w-4" /> Convidar
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Convidar Novo Usuário</DialogTitle>
              <DialogDescription>
                Envie um convite por email para um novo usuário se cadastrar no sistema.
              </DialogDescription>
            </DialogHeader>
            <InviteUserDialog onComplete={handleUserFormComplete} />
          </DialogContent>
        </Dialog>
        
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Usuário</DialogTitle>
              <DialogDescription>
                Preencha os dados do novo usuário do sistema. Um email será enviado com as instruções de acesso.
              </DialogDescription>
            </DialogHeader>
            <UserForm onComplete={handleUserFormComplete} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
