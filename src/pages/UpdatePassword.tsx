
import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const UpdatePassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { updateUserPassword, user } = useSupabaseAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    
    // Validação básica
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    setIsSubmitting(true);

    try {
      await updateUserPassword(password);
      toast.success("Senha atualizada com sucesso!");
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Erro ao atualizar senha:", err);
      setError(err.message || "Erro ao atualizar a senha. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-primary">Atualizar Senha</h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {user?.name ? `Olá, ${user.name}! ` : ''}
            Por favor, defina uma nova senha para sua conta
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
              <Label htmlFor="password">Nova Senha</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="********" 
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirme a Nova Senha</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
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
                  Atualizando...
                </>
              ) : (
                "Atualizar Senha"
              )}
            </Button>
          </form>
        </div>
        
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          &copy; {new Date().getFullYear()} Original Digital. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};

export default UpdatePassword;
