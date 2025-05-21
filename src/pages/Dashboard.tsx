
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  FileSignature, 
  Inbox, 
  ListChecks, 
  Users 
} from "lucide-react";

// Mock data for the dashboard
const mockData = {
  tasks: {
    total: 24,
    completed: 18,
    pending: 6,
    overdue: 2
  },
  invoices: {
    total: 12,
    paid: 8,
    pending: 4,
    overdue: 1,
    totalAmount: 24500,
    pendingAmount: 9800
  },
  tickets: {
    total: 8,
    open: 3,
    resolved: 5
  },
  contracts: {
    total: 15,
    active: 12,
    pending: 3,
    expiringSoon: 2
  },
  leads: {
    total: 32,
    newThisMonth: 8,
    converted: 5,
    conversionRate: 15.6
  },
  clients: {
    total: 18,
    active: 15,
    inactive: 3
  },
  projects: {
    total: 21,
    onTrack: 16,
    delayed: 3,
    completed: 2
  }
};

// Dashboard stat card component
interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  linkTo?: string;
  linkText?: string;
}

const StatCard = ({ 
  title, 
  value, 
  description, 
  icon, 
  trend, 
  linkTo,
  linkText
}: StatCardProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {linkTo && (
          <Button variant="link" size="sm" asChild className="mt-2 p-0">
            <a href={linkTo}>{linkText || "Ver detalhes"}</a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isClient = user?.role === "client";
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Olá, {user?.name.split(" ")[0]}!
        </h1>
        <Button>
          {isAdmin ? "Exportar Relatório" : "Ver Meus Projetos"}
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tarefas"
          value={`${mockData.tasks.completed}/${mockData.tasks.total}`}
          description={`${mockData.tasks.pending} pendentes, ${mockData.tasks.overdue} atrasadas`}
          icon={<ListChecks className="h-4 w-4 text-muted-foreground" />}
          linkTo="/tasks"
        />
        
        {(isAdmin || isClient) && (
          <StatCard
            title="Faturas"
            value={formatCurrency(mockData.invoices.pendingAmount)}
            description={`${mockData.invoices.pending} faturas pendentes`}
            icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
            linkTo="/finance"
          />
        )}
        
        <StatCard
          title="Tickets"
          value={mockData.tickets.open}
          description={`${mockData.tickets.total} tickets no total`}
          icon={<Inbox className="h-4 w-4 text-muted-foreground" />}
          linkTo="/tickets"
        />
        
        {isAdmin && (
          <StatCard
            title="Contratos"
            value={mockData.contracts.pending}
            description="Aguardando assinatura"
            icon={<FileSignature className="h-4 w-4 text-muted-foreground" />}
            linkTo="/contracts"
          />
        )}
        
        {isAdmin && (
          <StatCard
            title="Leads"
            value={mockData.leads.total}
            description={`${mockData.leads.converted} convertidos (${mockData.leads.conversionRate}%)`}
            icon={<Activity className="h-4 w-4 text-muted-foreground" />}
            linkTo="/leads"
          />
        )}
        
        {isAdmin && !isClient && (
          <StatCard
            title="Clientes"
            value={mockData.clients.active}
            description={`${mockData.clients.inactive} inativos`}
            icon={<Users className="h-4 w-4 text-muted-foreground" />}
            linkTo="/clients"
          />
        )}
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-1 md:col-span-2 lg:col-span-2">
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
            <CardDescription>Últimas 5 atividades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="rounded-full p-2 bg-green-100 dark:bg-green-900">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-300" />
                </div>
                <div>
                  <p className="font-medium">Tarefa concluída</p>
                  <p className="text-sm text-muted-foreground">Criação de conteúdo para Instagram</p>
                  <p className="text-xs text-muted-foreground">Há 2 horas</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="rounded-full p-2 bg-yellow-100 dark:bg-yellow-900">
                  <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-300" />
                </div>
                <div>
                  <p className="font-medium">Reunião agendada</p>
                  <p className="text-sm text-muted-foreground">Revisão de campanha Facebook Ads</p>
                  <p className="text-xs text-muted-foreground">Amanhã às 14:00</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="rounded-full p-2 bg-blue-100 dark:bg-blue-900">
                  <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <p className="font-medium">Fatura paga</p>
                  <p className="text-sm text-muted-foreground">Cliente XYZ - R$ 2.500,00</p>
                  <p className="text-xs text-muted-foreground">Ontem</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="rounded-full p-2 bg-purple-100 dark:bg-purple-900">
                  <FileSignature className="h-4 w-4 text-purple-600 dark:text-purple-300" />
                </div>
                <div>
                  <p className="font-medium">Contrato assinado</p>
                  <p className="text-sm text-muted-foreground">Novo cliente ABC</p>
                  <p className="text-xs text-muted-foreground">Há 3 dias</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="rounded-full p-2 bg-red-100 dark:bg-red-900">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-300" />
                </div>
                <div>
                  <p className="font-medium">Ticket aberto</p>
                  <p className="text-sm text-muted-foreground">Problema de acesso ao Instagram</p>
                  <p className="text-xs text-muted-foreground">Há 1 dia</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Próximas Tarefas</CardTitle>
            <CardDescription>Vencendo nos próximos dias</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col">
                <span className="text-sm font-medium">Criar estratégia de conteúdo</span>
                <span className="text-xs text-muted-foreground">Vence hoje</span>
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-1 mt-1 rounded-full">
                  <div className="bg-red-500 h-1 rounded-full" style={{ width: "85%" }}></div>
                </div>
              </div>
              
              <div className="flex flex-col">
                <span className="text-sm font-medium">Configurar campanha Google Ads</span>
                <span className="text-xs text-muted-foreground">Vence em 2 dias</span>
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-1 mt-1 rounded-full">
                  <div className="bg-yellow-500 h-1 rounded-full" style={{ width: "50%" }}></div>
                </div>
              </div>
              
              <div className="flex flex-col">
                <span className="text-sm font-medium">Elaborar relatório mensal</span>
                <span className="text-xs text-muted-foreground">Vence em 3 dias</span>
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-1 mt-1 rounded-full">
                  <div className="bg-blue-500 h-1 rounded-full" style={{ width: "30%" }}></div>
                </div>
              </div>
              
              <div className="flex flex-col">
                <span className="text-sm font-medium">Reunião de onboarding</span>
                <span className="text-xs text-muted-foreground">Vence em 5 dias</span>
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-1 mt-1 rounded-full">
                  <div className="bg-green-500 h-1 rounded-full" style={{ width: "10%" }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
