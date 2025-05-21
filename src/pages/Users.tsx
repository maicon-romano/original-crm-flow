
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { useToast } from "@/components/ui/use-toast";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableFooter, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, MoreHorizontal, Edit, Trash2, RefreshCcw, Loader2, UserCog } from "lucide-react";
import { UserForm } from "@/components/users/UserForm";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  cargo?: string;
  position?: string;
  role: string;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if current user is admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      toast({
        title: "Acesso restrito",
        description: "Você não tem permissão para acessar esta página.",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  }, [user, navigate, toast]);

  // Fetch users from Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      if (user?.role !== "admin") return;
      
      try {
        setIsLoading(true);
        const usersRef = collection(db, "users");
        const q = query(usersRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        const usersData: User[] = [];
        querySnapshot.forEach((doc) => {
          usersData.push({ ...doc.data(), id: doc.id } as User);
        });
        
        setUsers(usersData);
        console.log("Users fetched:", usersData.length);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          title: "Erro ao carregar usuários",
          description: "Não foi possível carregar a lista de usuários.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, [user, toast]);

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.cargo?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format date from timestamp
  const formatDate = (timestamp: number) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleDateString('pt-BR');
  };

  // Handle user create/edit complete
  const handleUserFormComplete = () => {
    setIsAddUserOpen(false);
    // Refetch users
    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        const usersData: User[] = [];
        querySnapshot.forEach((doc) => {
          usersData.push({ ...doc.data(), id: doc.id } as User);
        });
        
        setUsers(usersData);
      } catch (error) {
        console.error("Error refetching users:", error);
      }
    };
    
    fetchUsers();
  };

  // If user is not admin, don't render the page
  if (user?.role !== "admin") {
    return null;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar usuário..."
              className="pl-8 w-full sm:w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                <DialogDescription>
                  Preencha os dados do novo usuário do sistema. Um email será enviado com as instruções de acesso.
                </DialogDescription>
              </DialogHeader>
              <UserForm onComplete={handleUserFormComplete} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Data Cadastro</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((userData) => (
                  <TableRow key={userData.id}>
                    <TableCell className="font-medium">{userData.name}</TableCell>
                    <TableCell>{userData.email}</TableCell>
                    <TableCell>{userData.cargo || userData.position || "-"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={userData.role === "admin" ? "default" : "outline"}
                        className={userData.role === "admin" ? "bg-blue-500" : ""}
                      >
                        {userData.role === "admin" ? "Administrador" : "Funcionário"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(userData.createdAt)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={userData.active ? "default" : "secondary"}
                        className={userData.active ? "bg-green-500" : "bg-gray-500"}
                      >
                        {userData.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <RefreshCcw className="mr-2 h-4 w-4" /> Redefinir Senha
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
