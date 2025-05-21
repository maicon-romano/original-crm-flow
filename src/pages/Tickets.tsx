
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";

const TicketsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Tickets de Suporte</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar ticket..."
              className="pl-8 w-full sm:w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Novo Ticket
          </Button>
        </div>
      </div>

      {/* Placeholder content */}
      <div className="flex flex-col items-center justify-center space-y-4 bg-white dark:bg-gray-800 p-12 rounded-lg border text-center">
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Search className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">Nenhum ticket encontrado</h2>
        <p className="text-muted-foreground max-w-sm">
          Tickets criados aparecerão aqui. Crie um novo ticket para começar.
        </p>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Criar Ticket
        </Button>
      </div>
    </div>
  );
};

export default TicketsPage;
