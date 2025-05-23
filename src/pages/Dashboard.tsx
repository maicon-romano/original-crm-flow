import { useEffect, useState } from "react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Users,
  FileText,
  Calendar,
  AlertCircle,
  DollarSign,
  BarChart4,
  CheckCircle,
  Clock,
  ListTodo
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

interface DashboardCounts {
  clients: number;
  leads: number;
  activeProjects: number;
  tasks: number;
  proposals: number;
  contracts: number;
  tickets: number;
  invoicesPending: number;
  invoicesOverdue: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  entity_id?: string;
}

const Dashboard = () => {
  const { user } = useSupabaseAuth();
  const [counts, setCounts] = useState<DashboardCounts>({
    clients: 0,
    leads: 0,
    activeProjects: 0,
    tasks: 0,
    proposals: 0,
    contracts: 0,
    tickets: 0,
    invoicesPending: 0,
    invoicesOverdue: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      setLoading(true);
      try {
        // Get client count - using Firebase instead of Supabase
        const clientsSnapshot = await getDocs(collection(db, "clients"));
        const clientCount = clientsSnapshot.size;

        // Get leads count
        const leadsQuery = query(
          collection(db, "leads"), 
          where("stage", "not-in", ["won", "lost"])
        );
        const leadsSnapshot = await getDocs(leadsQuery);
        const leadsCount = leadsSnapshot.size;

        // Get active projects count
        const projectsQuery = query(
          collection(db, "projects"), 
          where("status", "==", "active")
        );
        const projectsSnapshot = await getDocs(projectsQuery);
        const projectsCount = projectsSnapshot.size;

        // Get tasks count
        const tasksQuery = query(
          collection(db, "tasks"), 
          where("status", "!=", "done")
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        const tasksCount = tasksSnapshot.size;

        // Get proposals count
        const proposalsQuery = query(
          collection(db, "proposals"), 
          where("status", "==", "draft")
        );
        const proposalsSnapshot = await getDocs(proposalsQuery);
        const proposalsCount = proposalsSnapshot.size;

        // Get contracts count
        const contractsQuery = query(
          collection(db, "contracts"), 
          where("status", "==", "draft")
        );
        const contractsSnapshot = await getDocs(contractsQuery);
        const contractsCount = contractsSnapshot.size;

        // Get tickets count
        const ticketsQuery = query(
          collection(db, "tickets"), 
          where("status", "not-in", ["resolved", "closed"])
        );
        const ticketsSnapshot = await getDocs(ticketsQuery);
        const ticketsCount = ticketsSnapshot.size;

        // Get pending invoices count
        const pendingInvoicesQuery = query(
          collection(db, "invoices"), 
          where("status", "==", "pending")
        );
        const pendingInvoicesSnapshot = await getDocs(pendingInvoicesQuery);
        const pendingInvoicesCount = pendingInvoicesSnapshot.size;

        // Get overdue invoices count
        const overdueInvoicesQuery = query(
          collection(db, "invoices"), 
          where("status", "==", "overdue")
        );
        const overdueInvoicesSnapshot = await getDocs(overdueInvoicesQuery);
        const overdueInvoicesCount = overdueInvoicesSnapshot.size;

        // Update state with counts
        setCounts({
          clients: clientCount,
          leads: leadsCount,
          activeProjects: projectsCount,
          tasks: tasksCount,
          proposals: proposalsCount,
          contracts: contractsCount,
          tickets: ticketsCount,
          invoicesPending: pendingInvoicesCount,
          invoicesOverdue: overdueInvoicesCount
        });

        // Mock recent activity for now
        // In a real implementation, we'd fetch this from a dedicated activity log table
        setRecentActivity([
          {
            id: "1",
            type: "task",
            description: "Nova tarefa criada: Revisão de website",
            timestamp: new Date().toISOString()
          },
          {
            id: "2",
            type: "lead",
            description: "Novo lead adicionado: Empresa ABC",
            timestamp: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: "3",
            type: "invoice",
            description: "Fatura #INV-2023-042 marcada como paga",
            timestamp: new Date(Date.now() - 172800000).toISOString()
          },
          {
            id: "4",
            type: "client",
            description: "Cliente XYZ adicionado ao sistema",
            timestamp: new Date(Date.now() - 259200000).toISOString()
          }
        ]);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    };
    return new Date(dateString).toLocaleDateString("pt-BR", options);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.clients}</div>
            <p className="text-xs text-muted-foreground">
              {counts.clients > 0 ? "Clientes ativos" : "Nenhum cliente ainda"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Leads</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.leads}</div>
            <p className="text-xs text-muted-foreground">
              {counts.leads > 0 ? "Leads em acompanhamento" : "Nenhum lead ativo"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Projetos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.activeProjects}</div>
            <p className="text-xs text-muted-foreground">
              {counts.activeProjects > 0 ? "Projetos ativos" : "Nenhum projeto ativo"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tarefas</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.tasks}</div>
            <p className="text-xs text-muted-foreground">
              {counts.tasks > 0 ? "Tarefas pendentes" : "Nenhuma tarefa pendente"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {/* Main content area - 4/7 of the space */}
        <div className="lg:col-span-4 space-y-4">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
              <CardDescription>
                Últimas atualizações no sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-4">
                      <div className="bg-primary/10 rounded-full p-2">
                        {activity.type === "task" && <CheckCircle className="h-4 w-4 text-primary" />}
                        {activity.type === "lead" && <Activity className="h-4 w-4 text-primary" />}
                        {activity.type === "invoice" && <DollarSign className="h-4 w-4 text-primary" />}
                        {activity.type === "client" && <Users className="h-4 w-4 text-primary" />}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(activity.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">Nenhuma atividade recente</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - 3/7 of the space */}
        <div className="lg:col-span-3 space-y-4">
          {/* Pending Items */}
          <Card>
            <CardHeader>
              <CardTitle>Itens Pendentes</CardTitle>
              <CardDescription>Itens que precisam de atenção</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Proposals */}
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Propostas em rascunho</span>
                </div>
                <Badge variant={counts.proposals > 0 ? "default" : "outline"}>
                  {counts.proposals}
                </Badge>
              </div>

              {/* Contracts */}
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Contratos em rascunho</span>
                </div>
                <Badge variant={counts.contracts > 0 ? "default" : "outline"}>
                  {counts.contracts}
                </Badge>
              </div>

              {/* Tickets */}
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Tickets abertos</span>
                </div>
                <Badge variant={counts.tickets > 0 ? "secondary" : "outline"} className={counts.tickets > 0 ? "bg-orange-500" : ""}>
                  {counts.tickets}
                </Badge>
              </div>

              {/* Pending Invoices */}
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Faturas pendentes</span>
                </div>
                <Badge variant={counts.invoicesPending > 0 ? "secondary" : "outline"} className={counts.invoicesPending > 0 ? "bg-yellow-500" : ""}>
                  {counts.invoicesPending}
                </Badge>
              </div>

              {/* Overdue Invoices */}
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Faturas vencidas</span>
                </div>
                <Badge variant={counts.invoicesOverdue > 0 ? "destructive" : "outline"}>
                  {counts.invoicesOverdue}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Agenda</CardTitle>
              <CardDescription>Próximos eventos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-6">
                <Calendar className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
                <p>Nenhum evento programado</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
