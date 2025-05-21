
import { useState, FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react"; 
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [error, setError] = useState("");
  const { login, isAuthenticated } = useSupabaseAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  if (isAuthenticated) {
    const from = (location.state as any)?.from?.pathname || "/dashboard";
    navigate(from, { replace: true });
    return null;
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(email, password);
      toast.success("Login bem-sucedido!");
      // Navigation will happen automatically through auth state change
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Erro ao fazer login. Verifique suas credenciais.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const createAdminUser = async () => {
    const adminEmail = "originaldigitaloficial@gmail.com";
    const adminPassword = "Original.280712";
    
    try {
      setIsCreatingAdmin(true);
      setError("");
      
      // Create the admin user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          name: "Admin Original Digital",
          role: "admin"
        }
      });
      
      if (authError) {
        throw authError;
      }
      
      // If the user was created successfully, automatically fill the login form
      setEmail(adminEmail);
      setPassword(adminPassword);
      
      toast.success("Administrador criado com sucesso!", {
        description: "Agora você pode fazer login com as credenciais de administrador."
      });
    } catch (err: any) {
      console.error("Error creating admin:", err);
      
      if (err.message?.includes("already taken")) {
        toast.info("Este administrador já existe!", {
          description: "Você pode fazer login com as credenciais de administrador."
        });
        setEmail(adminEmail);
        setPassword(adminPassword);
      } else {
        setError(err.message || "Erro ao criar administrador.");
        toast.error("Erro ao criar administrador", {
          description: err.message || "Ocorreu um erro ao criar o usuário administrador."
        });
      }
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-primary">Original Digital CRM</h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Entre com suas credenciais para acessar o sistema</p>
        </div>
        
        <div className="bg-white p-8 shadow-lg rounded-lg dark:bg-gray-800">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="seu@email.com" 
                required 
                autoComplete="email"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link 
                  to="/reset-password" 
                  className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="********" 
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>

            <div className="mt-4 pt-4 border-t text-center">
              <p className="text-sm text-gray-500 mb-2">Primeira vez usando o sistema?</p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={isCreatingAdmin}
                onClick={createAdminUser}
              >
                {isCreatingAdmin ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando administrador...
                  </>
                ) : (
                  "Criar administrador principal"
                )}
              </Button>
            </div>
          </form>
        </div>
        
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          &copy; {new Date().getFullYear()} Original Digital. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};

export default Login;
