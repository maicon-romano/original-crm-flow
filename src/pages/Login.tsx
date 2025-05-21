
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { 
  Dialog,
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const loginSchema = z.object({
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const Login = () => {
  const { login, isAuthenticated, user, resetPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  // Form setup with react-hook-form and zod validation
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  // Redirect if already authenticated
  if (isAuthenticated) {
    // If user needs to reset password, redirect to reset page
    if (user?.needsPasswordReset) {
      console.log("User needs to reset password, redirecting");
      return <Navigate to="/reset-password" />;
    }
    
    // Role-based redirection
    if (user?.role === "client") {
      console.log("Client user authenticated, redirecting to projects");
      return <Navigate to="/meus-projetos" />;
    }
    
    console.log("User is authenticated, redirecting to dashboard");
    return <Navigate to="/dashboard" />;
  }

  const onSubmit = async (values: LoginFormValues) => {
    const { email, password } = values;
    form.setValue("password", "");
    
    try {
      await login(email, password);
      console.log("Login successful, redirect will happen automatically");
      toast({
        title: "Login bem-sucedido",
        description: "Você foi autenticado com sucesso.",
      });
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = error instanceof Error ? error.message : "Falha no login. Verifique suas credenciais.";
      toast({
        title: "Erro de autenticação",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleForgotPassword = async (values: ForgotPasswordFormValues) => {
    const { email } = values;
    
    try {
      await resetPassword(email);
      setForgotPasswordOpen(false);
      toast({
        title: "Email enviado",
        description: `Um email de redefinição de senha foi enviado para ${email}.`,
      });
      forgotPasswordForm.reset();
    } catch (error) {
      console.error("Password reset error:", error);
      const errorMessage = error instanceof Error
        ? error.message
        : "Não foi possível enviar o email de redefinição. Verifique o endereço de email.";
      
      toast({
        title: "Erro ao enviar email",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary">CRM Original Digital</h1>
          <p className="text-muted-foreground mt-2">Acesse sua conta para continuar</p>
        </div>
        
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Entre com suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="seu@email.com" 
                    {...form.register("email")}
                    className="pl-10"
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive mt-1">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <button 
                    type="button"
                    onClick={() => setForgotPasswordOpen(true)}
                    className="text-xs text-primary hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    {...form.register("password")}
                    className="pl-10"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-xs text-destructive mt-1">{form.formState.errors.password.message}</p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Autenticando..." : "Entrar"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
      
      {/* Forgot Password Dialog */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Esqueceu sua senha?</DialogTitle>
            <DialogDescription>
              Informe seu email para receber as instruções de redefinição de senha.
            </DialogDescription>
          </DialogHeader>
          <Form {...forgotPasswordForm}>
            <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-4">
              <FormField
                control={forgotPasswordForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <FormControl>
                        <Input className="pl-10" placeholder="seu@email.com" {...field} />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setForgotPasswordOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={forgotPasswordForm.formState.isSubmitting}
                >
                  {forgotPasswordForm.formState.isSubmitting ? "Enviando..." : "Enviar instruções"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
