
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";

// Form schema for validation
const userFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  phone: z.string().optional(),
  position: z.string().optional(),
  role: z.string().min(1, "Função é obrigatória"),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormProps {
  onComplete: () => void;
  user?: any; // For editing in the future
}

export const UserForm = ({ onComplete, user }: UserFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user: currentUser } = useSupabaseAuth();
  
  // Initialize form
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: user || {
      name: "",
      email: "",
      phone: "",
      position: "",
      role: "user",
    },
  });

  const handleSubmit = async (data: UserFormValues) => {
    if (!currentUser) {
      toast.error("Você precisa estar logado para adicionar usuários");
      return;
    }

    try {
      setIsSubmitting(true);
      
      const invitedBy = {
        name: currentUser.name,
        email: currentUser.email
      };
      
      // Utilize a função Edge para enviar o convite
      const { data: responseData, error } = await supabase.functions.invoke("send-invitation", {
        body: {
          email: data.email,
          name: data.name,
          role: data.role,
          position: data.position,
          invitedBy
        }
      });
      
      if (error) {
        throw error;
      }
      
      if (!responseData.success) {
        throw new Error(responseData.error || "Erro ao criar usuário");
      }
      
      toast.success(`${data.name} foi cadastrado com sucesso`, {
        description: "Um email foi enviado com as instruções de acesso"
      });
      
      onComplete();
    } catch (error: any) {
      console.error("Error creating user:", error);
      
      if (error.message?.includes("already taken")) {
        toast.error("Este email já está em uso. Tente outro email.");
      } else {
        toast.error(error.message || "Ocorreu um erro ao criar o usuário.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo</FormLabel>
                <FormControl>
                  <Input placeholder="Nome do usuário" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="usuario@originaldigital.com.br" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone/WhatsApp</FormLabel>
                <FormControl>
                  <Input placeholder="(00) 00000-0000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cargo</FormLabel>
                <FormControl>
                  <Input placeholder="Cargo ou função na empresa" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nível de Acesso</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o nível de acesso" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="user">Funcionário</SelectItem>
                      <SelectItem value="client">Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={onComplete}>Cancelar</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Salvando..." : "Salvar Usuário"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
