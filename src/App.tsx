
import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";

import { MainLayout } from "@/components/MainLayout";
import Login from "@/pages/Login";
import ResetPassword from "@/pages/ResetPassword";
import UpdatePassword from "@/pages/UpdatePassword";
import Dashboard from "@/pages/Dashboard";
import Clients from "@/pages/Clients";
import Leads from "@/pages/Leads";
import UsersPage from "@/pages/Users";
import ProjectsPage from "@/pages/Projects";
import TasksPage from "@/pages/Tasks";
import ProposalsPage from "@/pages/Proposals";
import ContractsPage from "@/pages/Contracts";
import FinancePage from "@/pages/Finance";
import TicketsPage from "@/pages/Tickets";
import FilesPage from "@/pages/Files";
import CalendarPage from "@/pages/Calendar";
import ReportsPage from "@/pages/Reports";
import SettingsPage from "@/pages/Settings";
import NotFound from "@/pages/NotFound";

// Client-specific pages
const ClientProjects = () => (
  <div className="p-4">
    <h1 className="text-2xl font-bold">Meus Projetos</h1>
  </div>
);
const ClientTasks = () => (
  <div className="p-4">
    <h1 className="text-2xl font-bold">Minhas Tarefas</h1>
  </div>
);
const ClientFiles = () => (
  <div className="p-4">
    <h1 className="text-2xl font-bold">Meus Arquivos</h1>
  </div>
);
const ClientInvoices = () => (
  <div className="p-4">
    <h1 className="text-2xl font-bold">Minhas Faturas</h1>
  </div>
);
const ClientProfile = () => (
  <div className="p-4">
    <h1 className="text-2xl font-bold">Meu Perfil</h1>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => {
  return (
    <ThemeProvider defaultTheme="light" storageKey="crm-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/update-password" element={<UpdatePassword />} />

            {/* Protected Routes - MainLayout handles auth check and redirects */}
            <Route element={<MainLayout />}>
              {/* Admin and Staff Routes */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/usuarios" element={<UsersPage />} />
              <Route path="/users" element={<UsersPage />} /> 
              {/* English alias */}
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/proposals" element={<ProposalsPage />} />
              <Route path="/contracts" element={<ContractsPage />} />
              <Route path="/finance" element={<FinancePage />} />
              <Route path="/tickets" element={<TicketsPage />} />
              <Route path="/files" element={<FilesPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              {/* Client Routes */}
              <Route path="/meus-projetos" element={<ClientProjects />} />
              <Route path="/minhas-tarefas" element={<ClientTasks />} />
              <Route path="/meus-arquivos" element={<ClientFiles />} />
              <Route path="/minhas-faturas" element={<ClientInvoices />} />
              <Route path="/meu-perfil" element={<ClientProfile />} />
            </Route>

            {/* Catch-all route for 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
