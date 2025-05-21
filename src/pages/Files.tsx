
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Upload, FolderOpen } from "lucide-react";

const FilesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Arquivos</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar arquivo..."
              className="pl-8 w-full sm:w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button>
            <Upload className="mr-2 h-4 w-4" /> Enviar Arquivo
          </Button>
        </div>
      </div>

      {/* Placeholder content */}
      <div className="flex flex-col items-center justify-center space-y-4 bg-white dark:bg-gray-800 p-12 rounded-lg border text-center">
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
          <FolderOpen className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">Nenhum arquivo encontrado</h2>
        <p className="text-muted-foreground max-w-sm">
          Arquivos enviados aparecerão aqui. Envie um arquivo para começar.
        </p>
        <Button>
          <Upload className="mr-2 h-4 w-4" /> Enviar Arquivo
        </Button>
      </div>
    </div>
  );
};

export default FilesPage;
