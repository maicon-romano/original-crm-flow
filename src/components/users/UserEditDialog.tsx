
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogClose } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

// Form schema for validation
const userFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  phone: z.string().optional(),
  position: z.string().optional(),
  role: z.string().min(1, "Função é obrigatória"),
  active: z.boolean().default(true),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  position?: string;
  role: string;
  active: boolean;
}

interface UserEditDialogProps {
  user: User;
  onComplete: () => void;
}

export const UserEditDialog = ({ user, onComplete }: UserEditDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize form with user data
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      position: user.position || "",
      role: user.role || "user",
      active: user.active !== undefined ? user.active : true,
    },
  });

  const handleSubmit = async (data: UserFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Update user in the database
      const { error } = await supabase
        .from("users")
        .update({
          name: data.name,
          email: data.email,
          phone: data.phone,
          position: data.position,
          role: data.role,
          active: data.active,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);
      
      if (error) {
        console.error("Error updating user:", error);
        throw new Error(error.message || "Erro ao atualizar usuário");
      }
      
      toast.success("Usuário atualizado com sucesso");
      onComplete();
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error(error.message || "Erro ao atualizar usuário");
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
                  <Input placeholder="(00) 00000-0000" {...field} value={field.value || ''} />
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
                  <Input placeholder="Cargo ou função na empresa" {...field} value={field.value || ''} />
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
          
          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Status da conta</FormLabel>
                  <FormDescription>
                    Determina se o usuário pode fazer login no sistema
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end gap-3">
          <DialogClose asChild>
            <Button variant="outline" type="button">Cancelar</Button>
          </DialogClose>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
