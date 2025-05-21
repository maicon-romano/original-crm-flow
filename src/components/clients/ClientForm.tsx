
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp, collection } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { generateTemporaryPassword } from "@/lib/utils";

// Form schema for validation
const clientFormSchema = z.object({
  companyName: z.string().min(1, "Nome da empresa é obrigatório"),
  contactName: z.string().min(1, "Nome do contato é obrigatório"),
  cnpjCpf: z.string().min(1, "CNPJ/CPF é obrigatório"),
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  instagram: z.string().optional(),
  website: z.string().optional(),
  contractValue: z.string().optional(),
  contractStart: z.string().optional(),
  contractEnd: z.string().optional(),
  description: z.string().optional(),
  status: z.string().default("active"),
  createAccess: z.boolean().default(true),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

interface ClientFormProps {
  onComplete: () => void;
  client?: any; // For editing in the future
}

export const ClientForm = ({ onComplete, client }: ClientFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Initialize form
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: client || {
      companyName: "",
      contactName: "",
      cnpjCpf: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      instagram: "",
      website: "",
      contractValue: "",
      contractStart: "",
      contractEnd: "",
      description: "",
      status: "active",
      createAccess: true,
    },
  });

  const handleSubmit = async (data: ClientFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Generate temporary password for client access
      const tempPassword = generateTemporaryPassword();
      
      if (data.createAccess) {
        try {
          // Create firebase auth user
          const userCredential = await createUserWithEmailAndPassword(auth, data.email, tempPassword);
          const uid = userCredential.user.uid;
          
          // Create client document with auth UID
          await setDoc(doc(db, "clients", uid), {
            ...data,
            role: "cliente", // Portuguese for consistency
            userType: "client",
            precisa_redefinir_senha: true,
            lastTempPassword: tempPassword,
            username: data.email.split('@')[0],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          
          toast({
            title: "Cliente criado com sucesso",
            description: "O cliente foi cadastrado e receberá um email com os dados de acesso.",
          });
          
          // TODO: Create Google Drive folder
          // TODO: Send email with temporary password
          
          onComplete();
        } catch (error: any) {
          console.error("Error creating client with auth account:", error);
          
          // Handle common Firebase auth errors
          if (error.code === 'auth/email-already-in-use') {
            toast({
              title: "Erro ao criar cliente",
              description: "Este email já está em uso. Tente outro email.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Erro ao criar cliente",
              description: error.message || "Ocorreu um erro ao criar o cliente.",
              variant: "destructive",
            });
          }
        }
      } else {
        // Create client document without auth account
        const docRef = doc(collection(db, "clients"));
        await setDoc(docRef, {
          ...data,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        
        toast({
          title: "Cliente criado com sucesso",
          description: "O cliente foi cadastrado sem acesso ao sistema.",
        });
        
        onComplete();
      }
    } catch (error) {
      console.error("Error creating client:", error);
      toast({
        title: "Erro ao criar cliente",
        description: "Ocorreu um erro ao criar o cliente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Empresa</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome fantasia ou razão social" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Contato</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da pessoa responsável" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="cnpjCpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CNPJ/CPF</FormLabel>
                  <FormControl>
                    <Input placeholder="00.000.000/0001-00 ou 000.000.000-00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contractValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Mensal (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="contato@empresa.com" {...field} />
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
          </div>
          
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Endereço</FormLabel>
                <FormControl>
                  <Input placeholder="Endereço completo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cidade</FormLabel>
                  <FormControl>
                    <Input placeholder="Cidade" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="UF" />
                      </SelectTrigger>
                      <SelectContent>
                        {["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"].map(state => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="instagram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instagram</FormLabel>
                  <FormControl>
                    <Input placeholder="@perfil" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contractStart"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Início do Contrato</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contractEnd"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fim do Contrato</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição/Observações</FormLabel>
                <FormControl>
                  <Textarea placeholder="Informações adicionais sobre o cliente" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="createAccess"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Criar acesso ao CRM</FormLabel>
                  <FormDescription>
                    Cria uma conta de acesso ao sistema para o cliente com senha temporária
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={onComplete}>Cancelar</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Salvando..." : "Salvar Cliente"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
