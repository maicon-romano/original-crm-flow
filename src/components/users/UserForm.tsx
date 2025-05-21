
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateTemporaryPassword } from "@/lib/utils";

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
  const { toast } = useToast();
  
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
    try {
      setIsSubmitting(true);
      
      // Generate temporary password
      const tempPassword = generateTemporaryPassword();
      
      // Create firebase auth user
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, tempPassword);
      const uid = userCredential.user.uid;
      
      // Create user document
      await setDoc(doc(db, "users", uid), {
        ...data,
        active: true,
        username: data.email.split('@')[0],
        lastTempPassword: tempPassword,
        precisa_redefinir_senha: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        userType: data.role, // For consistency
      });
      
      toast({
        title: "Usuário criado com sucesso",
        description: `${data.name} foi cadastrado e receberá um email com os dados de acesso.`,
      });
      
      // TODO: Send email with temporary password
      
      onComplete();
    } catch (error: any) {
      console.error("Error creating user:", error);
      
      if (error.code === 'auth/email-already-in-use') {
        toast({
          title: "Erro ao criar usuário",
          description: "Este email já está em uso. Tente outro email.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao criar usuário",
          description: error.message || "Ocorreu um erro ao criar o usuário.",
          variant: "destructive",
        });
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
