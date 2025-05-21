
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Plus } from "lucide-react";

const CalendarPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Calendário</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Novo Evento
          </Button>
        </div>
      </div>

      {/* Placeholder content */}
      <div className="flex flex-col items-center justify-center space-y-4 bg-white dark:bg-gray-800 p-12 rounded-lg border text-center">
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
          <CalendarIcon className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">Calendário em desenvolvimento</h2>
        <p className="text-muted-foreground max-w-sm">
          Esta funcionalidade está sendo implementada. Em breve você poderá gerenciar sua agenda.
        </p>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" /> Criar Evento
        </Button>
      </div>
    </div>
  );
};

export default CalendarPage;
