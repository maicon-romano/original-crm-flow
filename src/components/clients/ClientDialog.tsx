
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ClientForm } from "@/components/clients/ClientForm";
import { Plus } from "lucide-react";

interface ClientDialogProps {
  onClientAdded: () => void;
}

export function ClientDialog({ onClientAdded }: ClientDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleComplete = () => {
    setIsOpen(false);
    onClientAdded();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Adicionar Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
          <DialogDescription>
            Cadastre um novo cliente e defina suas informações básicas. O cliente receberá um email com as credenciais de acesso caso a opção seja selecionada.
          </DialogDescription>
        </DialogHeader>
        
        <ClientForm onComplete={handleComplete} />
      </DialogContent>
    </Dialog>
  );
}
