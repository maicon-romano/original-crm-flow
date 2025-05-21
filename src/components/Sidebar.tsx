import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { 
  Activity, 
  Users, 
  ArrowRight, 
  FileText, 
  ListChecks, 
  FilePen, 
  FileSignature, 
  DollarSign,
  Ticket, 
  Folder,
  Calendar,
  BarChart2,
  Settings,
  Menu,
  X,
  LogOut
} from "lucide-react";

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
}

const NavItem = ({ to, icon: Icon, label, isActive, isCollapsed }: NavItemProps) => {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link to={to} className="w-full">
            <Button
              variant="ghost"
              size={isCollapsed ? "icon" : "default"}
              className={cn(
                "w-full justify-start",
                isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50"
              )}
            >
              <Icon className={cn("h-5 w-5", isCollapsed ? "" : "mr-2")} />
              {!isCollapsed && <span>{label}</span>}
            </Button>
          </Link>
        </TooltipTrigger>
        {isCollapsed && (
          <TooltipContent side="right" className="border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground">
            {label}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};

export function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!user) return null;

  // Check if user is admin (check both role and userType fields)
  const isAdmin = user.role === "admin" || user.userType === "admin";
  const isStaff = isAdmin || user.role === "user" || user.role === "funcionario";
  const isClient = user.role === "client" || user.role === "cliente";
  
  console.log("Sidebar - User role:", user.role, "userType:", user.userType, "isAdmin:", isAdmin);
  
  const navItems = [
    {
      to: "/dashboard",
      icon: Activity,
      label: "Dashboard",
      visible: true,
    },
    {
      to: "/clients",
      icon: Users,
      label: "Clientes",
      visible: isStaff,
    },
    {
      to: "/leads",
      icon: ArrowRight,
      label: "Leads",
      visible: isStaff,
    },
    {
      to: "/projects",
      icon: FileText,
      label: "Projetos",
      visible: true,
    },
    {
      to: "/tasks",
      icon: ListChecks,
      label: "Tarefas",
      visible: true,
    },
    {
      to: "/proposals",
      icon: FilePen,
      label: "Propostas",
      visible: isStaff,
    },
    {
      to: "/contracts",
      icon: FileSignature,
      label: "Contratos",
      visible: isAdmin,
    },
    {
      to: "/finance",
      icon: DollarSign,
      label: "Financeiro",
      visible: isAdmin || isClient,
    },
    {
      to: "/tickets",
      icon: Ticket,
      label: "Suporte",
      visible: true,
    },
    {
      to: "/files",
      icon: Folder,
      label: "Arquivos",
      visible: true,
    },
    {
      to: "/usuarios",
      icon: Users, 
      label: "Usuários",
      visible: isAdmin,
    },
    {
      to: "/calendar",
      icon: Calendar,
      label: "Calendário",
      visible: true,
    },
    {
      to: "/reports",
      icon: BarChart2,
      label: "Relatórios",
      visible: isAdmin,
    },
    {
      to: "/settings",
      icon: Settings,
      label: "Configurações",
      visible: isAdmin,
    },
  ];

  const visibleNavItems = navItems.filter(item => item.visible);

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 h-screen sticky top-0",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex justify-between items-center p-4">
        {!isCollapsed && (
          <h2 className="font-bold text-sidebar-foreground text-lg">
            Original Digital
          </h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 text-sidebar-foreground"
        >
          {isCollapsed ? <Menu /> : <X size={18} />}
        </Button>
      </div>
      
      <Separator className="bg-sidebar-border" />
      
      <div className="flex-1 overflow-auto py-2 px-2">
        <nav className="grid gap-1">
          {visibleNavItems.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              isActive={location.pathname === item.to}
              isCollapsed={isCollapsed}
            />
          ))}
        </nav>
      </div>
      
      <Separator className="bg-sidebar-border" />
      
      <div className="p-4">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={isCollapsed ? "icon" : "default"}
                className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50"
                onClick={logout}
              >
                <LogOut className={cn("h-5 w-5", isCollapsed ? "" : "mr-2")} />
                {!isCollapsed && "Sair"}
              </Button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" className="border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground">
                Sair
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </aside>
  );
}
