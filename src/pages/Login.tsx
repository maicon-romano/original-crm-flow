
import { useState, FormEvent, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2, Eye, EyeOff } from "lucide-react"; 
import { toast } from "sonner";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { login, isAuthenticated, user } = useSupabaseAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check authentication status when component mounts and when it changes
  useEffect(() => {
    if (isAuthenticated) {
      if (user?.needs_password_reset) {
        console.log("User needs to reset password, redirecting to update-password");
        navigate("/update-password", { replace: true });
      } else {
        const from = (location.state as any)?.from?.pathname || "/dashboard";
        console.log(`User authenticated, redirecting to ${from}`);
        navigate(from, { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, location.state]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // Login normal
      await login(email, password);
      toast.success("Login bem-sucedido!");
      // Navigation will happen via the useEffect hook above
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Erro ao fazer login. Verifique suas credenciais.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-primary">Original Digital CRM</h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Entre com suas credenciais para acessar o sistema
          </p>
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
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="********" 
                  required
                  autoComplete="current-password"
                />
                <button 
                  type="button"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
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

            <div className="text-center text-sm text-gray-500">
              Contate um administrador para criar uma nova conta.
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
