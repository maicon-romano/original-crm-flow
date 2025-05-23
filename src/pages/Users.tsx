
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useToast } from "@/components/ui/use-toast";
import { UsersList } from "@/components/users/UsersList";
import { UsersHeader } from "@/components/users/UsersHeader";
import { useUsers } from "@/hooks/useUsers";
import type { HookUser } from "@/hooks/useUsers";

const UsersPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const { users, isLoading, refreshUsers } = useUsers();

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.cargo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.position?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if current user is admin - only run this check once when the component mounts
  useEffect(() => {
    const isAdmin = user?.role === "admin";
    console.log("UsersPage - Checking admin permission:", { 
      userRole: user?.role, 
      isAdmin 
    });
    
    if (user && !isAdmin) {
      toast({
        title: "Acesso restrito",
        description: "Você não tem permissão para acessar esta página.",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  }, [user?.id, navigate, toast]); // Only depend on user.id to prevent re-running on every change

  // If user is not admin, show loading or redirect
  if (user && user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h2 className="text-xl font-semibold mb-2">Verificando permissões...</h2>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <UsersHeader 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        onUserAdded={refreshUsers} 
      />
      <UsersList 
        users={filteredUsers as any[]} 
        isLoading={isLoading} 
        onRefresh={refreshUsers} 
      />
    </div>
  );
};

export default UsersPage;
