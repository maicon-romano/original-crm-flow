
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";

// Form schema for validation
const clientFormSchema = z.object({
  company_name: z.string().min(1, "Nome da empresa é obrigatório"),
  contact_name: z.string().min(1, "Nome do contato é obrigatório"),
  tax_id: z.string().optional(),
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  instagram: z.string().optional(),
  website: z.string().optional(),
  contract_value: z.string().optional(),
  contract_start: z.string().optional(),
  contract_end: z.string().optional(),
  description: z.string().optional(),
  status: z.string().default("active"),
  create_access: z.boolean().default(true),
  social_media: z.boolean().default(false),
  paid_traffic: z.boolean().default(false),
  website_development: z.boolean().default(false),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

interface ClientFormProps {
  onComplete: () => void;
  client?: any; // For editing existing client
}

export const ClientForm = ({ onComplete, client }: ClientFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!client;

  // Initialize form
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: client ? {
      company_name: client.company_name || "",
      contact_name: client.contact_name || "",
      tax_id: client.tax_id || "",
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      city: client.city || "",
      state: client.state || "",
      instagram: client.instagram || "",
      website: client.website || "",
      contract_value: client.contract_value?.toString() || "",
      contract_start: client.contract_start || "",
      contract_end: client.contract_end || "",
      description: client.description || "",
      status: client.status || "active",
      create_access: !!client.user_id,
      social_media: !!client.social_media,
      paid_traffic: !!client.paid_traffic,
      website_development: !!client.website_development,
    } : {
      company_name: "",
      contact_name: "",
      tax_id: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      instagram: "",
      website: "",
      contract_value: "",
      contract_start: "",
      contract_end: "",
      description: "",
      status: "active",
      create_access: true,
      social_media: false,
      paid_traffic: false,
      website_development: false,
    },
  });

  const createDriveFolders = async (clientId: string, clientData: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-drive-folders', {
        body: { 
          client: {
            id: clientId,
            company_name: clientData.company_name,
            email: clientData.email
          }
        }
      });

      if (error) {
        console.error("Error creating Drive folders:", error);
        toast.error("Erro ao criar pastas no Google Drive");
        return false;
      }

      console.log("Drive folders created:", data);
      toast.success("Pastas criadas no Google Drive");
      return true;
    } catch (error) {
      console.error("Exception creating Drive folders:", error);
      toast.error("Erro ao criar pastas no Google Drive");
      return false;
    }
  };

  const handleSubmit = async (data: ClientFormValues) => {
    try {
      setIsSubmitting(true);
      
      if (isEditing) {
        // Update existing client
        const { error } = await supabase
          .from('clients')
          .update({
            company_name: data.company_name,
            contact_name: data.contact_name,
            tax_id: data.tax_id,
            email: data.email,
            phone: data.phone,
            address: data.address,
            city: data.city,
            state: data.state,
            instagram: data.instagram,
            website: data.website,
            contract_value: data.contract_value ? parseFloat(data.contract_value) : null,
            contract_start: data.contract_start || null,
            contract_end: data.contract_end || null,
            description: data.description,
            status: data.status,
            social_media: data.social_media,
            paid_traffic: data.paid_traffic,
            website_development: data.website_development,
            updated_at: new Date().toISOString()
          })
          .eq('id', client.id);
        
        if (error) {
          throw error;
        }

        toast.success("Cliente atualizado com sucesso");
        onComplete();
      } else {
        // Create new client
        const { data: newClient, error } = await supabase
          .from('clients')
          .insert({
            company_name: data.company_name,
            contact_name: data.contact_name,
            tax_id: data.tax_id,
            email: data.email,
            phone: data.phone,
            address: data.address,
            city: data.city,
            state: data.state,
            instagram: data.instagram,
            website: data.website,
            contract_value: data.contract_value ? parseFloat(data.contract_value) : null,
            contract_start: data.contract_start || null,
            contract_end: data.contract_end || null,
            description: data.description,
            status: data.status,
            social_media: data.social_media,
            paid_traffic: data.paid_traffic,
            website_development: data.website_development
          })
          .select()
          .single();
          
        if (error) {
          throw error;
        }
        
        // Create client access if needed
        if (data.create_access && newClient) {
          // Create auth user for client
          const { data: authData, error: authError } = await supabase.functions.invoke('create-client-user', {
            body: {
              client: {
                id: newClient.id,
                email: data.email,
                name: data.contact_name,
                company: data.company_name
              }
            }
          });
          
          if (authError) {
            console.error("Error creating client user account:", authError);
            toast({
              title: "Aviso",
              description: "Cliente criado, mas não foi possível criar uma conta de acesso.",
              variant: "destructive",
            });
          } else {
            // Update client with user_id
            if (authData?.user_id) {
              await supabase
                .from('clients')
                .update({ user_id: authData.user_id })
                .eq('id', newClient.id);
            }
            
            toast.success("Cliente criado com sucesso e conta de acesso criada");
          }
        } else {
          toast.success("Cliente criado com sucesso");
        }

        // Create Drive folders
        if (newClient) {
          await createDriveFolders(newClient.id, {
            company_name: data.company_name,
            email: data.email
          });
        }
        
        onComplete();
      }
    } catch (error: any) {
      console.error("Error saving client:", error);
      toast.error(error.message || "Erro ao salvar cliente");
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
              name="company_name"
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
              name="contact_name"
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
              name="tax_id"
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
              name="contract_value"
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
              name="contract_start"
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
              name="contract_end"
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
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border p-4 rounded-md">
            <FormField
              control={form.control}
              name="social_media"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Social Media</FormLabel>
                    <FormDescription>
                      Cliente contratou serviços de Social Media
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="paid_traffic"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Tráfego Pago</FormLabel>
                    <FormDescription>
                      Cliente contratou serviços de Tráfego Pago
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="website_development"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Desenvolvimento Web</FormLabel>
                    <FormDescription>
                      Cliente contratou serviços de Desenvolvimento Web
                    </FormDescription>
                  </div>
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
          
          {!isEditing && (
            <FormField
              control={form.control}
              name="create_access"
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
          )}
        </div>
        
        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={onComplete}>Cancelar</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Salvando..." : isEditing ? "Atualizar Cliente" : "Salvar Cliente"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
