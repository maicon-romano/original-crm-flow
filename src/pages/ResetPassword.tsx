
import { useState, FormEvent, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react"; 
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { resetPassword } = useSupabaseAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Efeito para tentar ler parâmetros de autenticação da URL e lidar com erros
  useEffect(() => {
    // Processar parâmetros de URL ou hash
    const processAuthParams = async () => {
      // Verificar por erros no hash da URL (formato #error=xxx&error_description=xxx)
      if (location.hash) {
        const hashParams = new URLSearchParams(location.hash.substring(1));
        const error = hashParams.get("error");
        const errorDescription = hashParams.get("error_description");
        
        if (error) {
          console.error("Auth error:", error, errorDescription);
          
          if (error === "access_denied" && errorDescription?.includes("expired")) {
            toast.error("O link expirou ou é inválido. Por favor, solicite um novo link de redefinição de senha.", {
              duration: 6000,
            });
          } else {
            toast.error(errorDescription || "Ocorreu um erro na autenticação", {
              duration: 6000,
            });
          }
          
          // Limpar a URL após processar o erro
          window.history.replaceState({}, document.title, location.pathname);
        }
      }
      
      // Verificar por token na query string (formato ?token=xxx)
      const queryParams = new URLSearchParams(location.search);
      const token = queryParams.get("token");
      
      if (token) {
        // Redirecionar para a página de atualização de senha com o token
        navigate("/update-password", { 
          state: { token },
          replace: true
        });
      }
    };

    processAuthParams();
  }, [location, navigate]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsSubmitting(true);

    try {
      await resetPassword(email);
      setSuccess(true);
      toast.success("E-mail de redefinição enviado!");
    } catch (err: any) {
      console.error("Reset password error:", err);
      setError(err.message || "Erro ao enviar e-mail de redefinição. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-primary">Redefinir Senha</h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Enviaremos um e-mail com instruções para redefinir sua senha
          </p>
        </div>
        
        <div className="bg-white p-8 shadow-lg rounded-lg dark:bg-gray-800">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <h3 className="text-xl font-medium">E-mail enviado!</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Verifique sua caixa de entrada para o link de redefinição de senha.
              </p>
              <Button asChild className="mt-4">
                <Link to="/login">Voltar para Login</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
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
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Link de Redefinição"
                )}
              </Button>
              
              <div className="text-center mt-4">
                <Link 
                  to="/login" 
                  className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                >
                  Voltar para o Login
                </Link>
              </div>
            </form>
          )}
        </div>
        
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          &copy; {new Date().getFullYear()} Original Digital. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
