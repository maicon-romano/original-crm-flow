
import { Input } from "@/components/ui/input";
import { Search, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientDialog } from "./ClientDialog";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";

interface ClientsHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onRefresh: () => void;
  onClientAdded: () => void;
}

export function ClientsHeader({ 
  searchQuery, 
  setSearchQuery, 
  onRefresh,
  onClientAdded 
}: ClientsHeaderProps) {
  const { user } = useSupabaseAuth();
  const isAdminOrStaff = user?.role === "admin" || user?.role === "user";

  return (
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
        <Button variant="outline" size="icon" onClick={onRefresh} title="Atualizar">
          <RefreshCcw className="h-4 w-4" />
        </Button>
        {isAdminOrStaff && (
          <ClientDialog onClientAdded={onClientAdded} />
        )}
      </div>
    </div>
  );
}
