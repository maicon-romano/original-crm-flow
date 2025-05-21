
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { 
  LayoutDashboard, 
  Users, 
  Send, 
  FileText, 
  ListTodo, 
  File,  // Replaced FileContract with File
  DollarSign,
  TicketCheck, 
  FolderOpen, 
  Calendar, 
  BarChart4, 
  Settings,
  Menu,
  X,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile"; // Fixed hook name from useMobile to useIsMobile

interface SidebarNavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  clientOnly?: boolean;
  submenu?: SidebarNavItem[];
  open?: boolean;
}

export function Sidebar() {
  const location = useLocation();
  const { user } = useSupabaseAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [navItems, setNavItems] = useState<SidebarNavItem[]>([]);
  const { isMobile } = useIsMobile(); // Fixed hook usage
  
  // Determine if the user is an admin
  const isAdmin = user?.role === "admin";
  const isClient = user?.role === "client";
  
  // Log for debugging
  console.log("Sidebar - User role:", user?.role, "isAdmin:", isAdmin);
  
  useEffect(() => {
    // Define navigation items based on user role
    let items: SidebarNavItem[] = [];
    
    // Items for admin and staff users
    if (!isClient) {
      items = [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: <LayoutDashboard className="h-5 w-5" />,
        },
        {
          title: "Clientes",
          href: "/clients",
          icon: <Users className="h-5 w-5" />,
        },
        {
          title: "Leads",
          href: "/leads",
          icon: <Send className="h-5 w-5" />,
        },
        {
          title: "Projetos",
          href: "/projects",
          icon: <FileText className="h-5 w-5" />,
        },
        {
          title: "Tarefas",
          href: "/tasks",
          icon: <ListTodo className="h-5 w-5" />,
        },
        {
          title: "Propostas",
          href: "/proposals",
          icon: <FileText className="h-5 w-5" />,
          adminOnly: true,
        },
        {
          title: "Contratos",
          href: "/contracts",
          icon: <File className="h-5 w-5" />, // Changed from FileContract to File
          adminOnly: true,
        },
        {
          title: "Financeiro",
          href: "/finance",
          icon: <DollarSign className="h-5 w-5" />,
          adminOnly: true,
        },
        {
          title: "Tickets",
          href: "/tickets",
          icon: <TicketCheck className="h-5 w-5" />,
        },
        {
          title: "Arquivos",
          href: "/files",
          icon: <FolderOpen className="h-5 w-5" />,
        },
        {
          title: "Calendário",
          href: "/calendar",
          icon: <Calendar className="h-5 w-5" />,
        },
        {
          title: "Relatórios",
          href: "/reports",
          icon: <BarChart4 className="h-5 w-5" />,
          adminOnly: true,
        },
        {
          title: "Usuários",
          href: "/users",
          icon: <Users className="h-5 w-5" />,
          adminOnly: true,
        },
        {
          title: "Configurações",
          href: "/settings",
          icon: <Settings className="h-5 w-5" />,
          adminOnly: true,
        },
      ];
    } 
    // Items for client users
    else {
      items = [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: <LayoutDashboard className="h-5 w-5" />,
        },
        {
          title: "Meus Projetos",
          href: "/meus-projetos",
          icon: <FileText className="h-5 w-5" />,
          clientOnly: true,
        },
        {
          title: "Minhas Tarefas",
          href: "/minhas-tarefas",
          icon: <ListTodo className="h-5 w-5" />,
          clientOnly: true,
        },
        {
          title: "Meus Arquivos",
          href: "/meus-arquivos",
          icon: <FolderOpen className="h-5 w-5" />,
          clientOnly: true,
        },
        {
          title: "Minhas Faturas",
          href: "/minhas-faturas",
          icon: <DollarSign className="h-5 w-5" />,
          clientOnly: true,
        },
        {
          title: "Meu Perfil",
          href: "/meu-perfil",
          icon: <Users className="h-5 w-5" />,
          clientOnly: true,
        },
      ];
    }
    
    // Filter items based on user role
    const filteredItems = items.filter(item => {
      if (item.adminOnly && !isAdmin) return false;
      if (item.clientOnly && !isClient) return false;
      return true;
    });
    
    setNavItems(filteredItems);
    
    // Close mobile sidebar when route changes
    if (isMobile) {
      setIsOpen(false);
    }
  }, [isAdmin, isClient, user, isMobile, location.pathname]);
  
  // Toggle submenu
  const toggleSubmenu = (index: number) => {
    setNavItems(currentItems =>
      currentItems.map((item, i) =>
        i === index ? { ...item, open: !item.open } : item
      )
    );
  };
  
  // Close mobile sidebar if screen is resized to desktop
  useEffect(() => {
    if (!isMobile && isOpen) {
      setIsOpen(false);
    }
  }, [isMobile]);

  return (
    <>
      {/* Mobile Menu Toggle */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50 md:hidden"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </Button>
      )}
      
      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-white transition-transform dark:bg-gray-800 dark:border-gray-700",
          isMobile && !isOpen && "-translate-x-full",
          isMobile && isOpen && "translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-6 dark:border-gray-700">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">Original Digital</span>
          </Link>
        </div>
        
        {/* Navigation Items */}
        <ScrollArea className="flex-1 py-4">
          <nav className="grid gap-1 px-2">
            {navItems.map((item, index) => (
              <div key={item.title}>
                {item.submenu ? (
                  <div className="space-y-1">
                    <Button
                      variant="ghost"
                      className="w-full justify-between"
                      onClick={() => toggleSubmenu(index)}
                    >
                      <span className="flex items-center gap-2">
                        {item.icon}
                        {item.title}
                      </span>
                      {item.open ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    
                    {item.open && item.submenu && (
                      <div className="ml-6 space-y-1 border-l dark:border-gray-700 pl-2">
                        {item.submenu.map((subitem) => (
                          <Button
                            key={subitem.href}
                            variant="ghost"
                            asChild
                            className={cn(
                              "w-full justify-start",
                              subitem.href === location.pathname && "bg-muted"
                            )}
                          >
                            <Link to={subitem.href} className="flex items-center gap-2">
                              {subitem.icon}
                              {subitem.title}
                            </Link>
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    asChild
                    className={cn(
                      "w-full justify-start",
                      item.href === location.pathname && "bg-muted dark:bg-gray-700"
                    )}
                  >
                    <Link to={item.href} className="flex items-center gap-2">
                      {item.icon}
                      {item.title}
                    </Link>
                  </Button>
                )}
              </div>
            ))}
          </nav>
        </ScrollArea>
        
        {/* User Info */}
        {user && (
          <div className="border-t p-4 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                {user.name?.slice(0, 1) || "U"}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.role === "admin" ? "Administrador" : user.role === "user" ? "Equipe" : "Cliente"}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
