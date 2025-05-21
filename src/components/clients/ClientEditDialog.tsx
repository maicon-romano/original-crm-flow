
import { Client } from "@/hooks/useClients";
import { 
  Dialog,
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
} from "@/components/ui/dialog";
import { ClientForm } from "./ClientForm";

interface ClientEditDialogProps {
  client: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function ClientEditDialog({ client, open, onOpenChange, onComplete }: ClientEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
          <DialogDescription>
            Atualize as informações do cliente. Modificações nas informações básicas serão atualizadas no sistema.
          </DialogDescription>
        </DialogHeader>
        
        <ClientForm onComplete={onComplete} client={client} />
      </DialogContent>
    </Dialog>
  );
}
