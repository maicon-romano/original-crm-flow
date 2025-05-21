
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const passwordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "A senha deve ter pelo menos 8 caracteres")
      .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula")
      .regex(/[0-9]/, "A senha deve conter pelo menos um número"),
    confirmPassword: z.string(),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

const ResetPassword = () => {
  const { user, isAuthenticated, updateUserPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [showPassword, setShowPassword] = useState(false);

  // Form setup with react-hook-form and zod validation
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Only users who need to reset password should access this page
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (isAuthenticated && !user?.needsPasswordReset) {
    // Role-based redirection
    if (user?.role === "client") {
      return <Navigate to="/meus-projetos" />;
    } else {
      return <Navigate to="/dashboard" />;
    }
  }

  const onSubmit = async (values: PasswordFormValues) => {
    try {
      await updateUserPassword(values.newPassword);
      
      toast({
        title: "Senha atualizada",
        description: "Sua senha foi alterada com sucesso.",
      });
      
      // Redirect based on user role
      setTimeout(() => {
        if (user?.role === "client") {
          navigate("/meus-projetos");
        } else {
          navigate("/dashboard");
        }
      }, 1500);
    } catch (error) {
      toast({
        title: "Erro ao redefinir senha",
        description: error instanceof Error 
          ? error.message 
          : "Ocorreu um erro ao redefinir sua senha. Por favor, tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary">CRM Original Digital</h1>
          <p className="text-muted-foreground mt-2">Redefina sua senha para continuar</p>
        </div>
        
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              Redefinir Senha
            </CardTitle>
            <CardDescription>
              Por segurança, você precisa criar uma nova senha antes de continuar.
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nova Senha</FormLabel>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <FormControl>
                          <Input
                            type={showPassword ? "text" : "password"}
                            className="pl-10"
                            placeholder="Digite sua nova senha"
                            {...field}
                          />
                        </FormControl>
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground mt-1">
                        A senha deve ter pelo menos 8 caracteres, uma letra maiúscula e um número.
                      </p>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Senha</FormLabel>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <FormControl>
                          <Input
                            type={showPassword ? "text" : "password"}
                            className="pl-10"
                            placeholder="Confirme sua nova senha"
                            {...field}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? "Processando..." : "Redefinir Senha"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
