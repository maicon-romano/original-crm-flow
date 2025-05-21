
import { AuthProvider } from "@/contexts/AuthContext";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { MainLayout } from "@/components/MainLayout";
import Login from "@/pages/Login";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import Clients from "@/pages/Clients";
import Leads from "@/pages/Leads";
import UsersPage from "@/pages/Users";
import NotFound from "@/pages/NotFound";

// Temporary placeholder for client-specific pages
const ClientProjects = () => <div className="p-4"><h1 className="text-2xl font-bold">Meus Projetos</h1></div>;
const ClientTasks = () => <div className="p-4"><h1 className="text-2xl font-bold">Minhas Tarefas</h1></div>;
const ClientFiles = () => <div className="p-4"><h1 className="text-2xl font-bold">Meus Arquivos</h1></div>;
const ClientInvoices = () => <div className="p-4"><h1 className="text-2xl font-bold">Minhas Faturas</h1></div>;
const ClientProfile = () => <div className="p-4"><h1 className="text-2xl font-bold">Meu Perfil</h1></div>;

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Protected Routes - MainLayout handles auth check and redirects */}
            <Route element={<MainLayout />}>
              {/* Admin and Staff Routes */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/usuarios" element={<UsersPage />} />
              <Route path="/users" element={<UsersPage />} /> {/* Alias em inglês */}
              
              {/* Client Routes */}
              <Route path="/meus-projetos" element={<ClientProjects />} />
              <Route path="/minhas-tarefas" element={<ClientTasks />} />
              <Route path="/meus-arquivos" element={<ClientFiles />} />
              <Route path="/minhas-faturas" element={<ClientInvoices />} />
              <Route path="/meu-perfil" element={<ClientProfile />} />
              
              {/* Placeholder routes - will be implemented later */}
              <Route path="/projects" element={<Dashboard />} />
              <Route path="/tasks" element={<Dashboard />} />
              <Route path="/proposals" element={<Dashboard />} />
              <Route path="/contracts" element={<Dashboard />} />
              <Route path="/finance" element={<Dashboard />} />
              <Route path="/tickets" element={<Dashboard />} />
              <Route path="/files" element={<Dashboard />} />
              <Route path="/calendar" element={<Dashboard />} />
              <Route path="/reports" element={<Dashboard />} />
              <Route path="/settings" element={<Dashboard />} />
            </Route>
            
            {/* Catch-all route for 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
