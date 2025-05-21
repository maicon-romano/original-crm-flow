
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BarChart4, DownloadCloud } from "lucide-react";

const ReportsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button>
            <DownloadCloud className="mr-2 h-4 w-4" /> Exportar
          </Button>
        </div>
      </div>

      {/* Placeholder content */}
      <div className="flex flex-col items-center justify-center space-y-4 bg-white dark:bg-gray-800 p-12 rounded-lg border text-center">
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
          <BarChart4 className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">Relatórios em desenvolvimento</h2>
        <p className="text-muted-foreground max-w-sm">
          Esta funcionalidade está sendo implementada. Em breve você poderá gerar e visualizar relatórios.
        </p>
        <Button disabled>
          <DownloadCloud className="mr-2 h-4 w-4" /> Gerar Relatório
        </Button>
      </div>
    </div>
  );
};

export default ReportsPage;
