
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Client, ClientInsert } from "@/types/client";

export const useClientCreate = (
  onClientCreated?: (client: Client) => void,
  setClients?: (updater: (prevClients: Client[]) => Client[]) => void
) => {
  const [isCreating, setIsCreating] = useState(false);
  const [driveFolderError, setDriveFolderError] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const createClient = async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setIsCreating(true);
      setDriveFolderError(null);
      setInviteError(null);
      
      console.log("Creating client:", clientData);

      // Validate required fields based on person_type
      validateClientData(clientData);

      // Ensure required fields are present for database insertion
      const insertData: ClientInsert = {
        ...clientData,
        // Make sure person_type is always defined with a default value if missing
        person_type: clientData.person_type || "juridica",
        company_name: clientData.person_type === "juridica" ? clientData.company_name || clientData.fantasy_name || "" : clientData.company_name || "",
        contact_name: clientData.contact_name || "",
        email: clientData.email || "",
        status: clientData.status || "active"
      };
      
      // First, create the client in the database
      const { data, error } = await supabase
        .from('clients')
        .insert(insertData)
        .select('*')
        .single();
      
      if (error) {
        console.error("Error creating client:", error);
        toast.error(`Erro ao criar cliente: ${error.message}`);
        throw new Error(error.message);
      }
      
      // Transform the returned client data to ensure correct typing
      const typedClient = {
        ...data,
        person_type: (data.person_type === "fisica" ? "fisica" : "juridica") as "juridica" | "fisica",
        other_social_media: data.other_social_media ? data.other_social_media as Record<string, string> : undefined
      };
      
      // Add the new client to the clients array if setClients was provided
      if (setClients) {
        setClients(prevClients => [typedClient, ...prevClients]);
      }

      // Show success toast
      toast.success("Cliente criado com sucesso!");
      
      // After client is created in database, process the additional operations in parallel
      // but handle errors independently
      try {
        await createGoogleDriveFolders(typedClient);
      } catch (driveError: any) {
        setDriveFolderError(driveError.message);
        // Don't throw here, we want to continue with invitation if possible
      }
      
      try {
        if (typedClient.send_email_invite) {
          await sendInvitationIfRequested(typedClient);
        }
      } catch (inviteError: any) {
        setInviteError(inviteError.message);
        // Don't throw here, client creation is still successful
      }

      // Notify parent component that client was created
      if (onClientCreated) {
        onClientCreated(typedClient);
      }
      
      return typedClient;
    } catch (error: any) {
      console.error("Exception creating client:", error);
      toast.error(`Erro ao criar cliente: ${error.message || "Erro desconhecido"}`);
      throw new Error(error.message || "Erro ao criar cliente");
    } finally {
      setIsCreating(false);
    }
  };

  // Validate client data based on person type
  const validateClientData = (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    const { person_type, contact_name, email, phone, responsible_name, plan, tax_id, company_name, fantasy_name, legal_name, cpf } = clientData;

    const errors: string[] = [];

    // Common validations for both person types
    if (!email) errors.push("Email é obrigatório");
    if (!phone) errors.push("Telefone é obrigatório");
    if (!responsible_name) errors.push("Responsável é obrigatório");
    if (!plan) errors.push("Plano é obrigatório");

    // Specific validations based on person_type
    if (person_type === "fisica") {
      if (!contact_name) errors.push("Nome é obrigatório para pessoa física");
      if (!cpf) errors.push("CPF é obrigatório para pessoa física");
    } else if (person_type === "juridica") {
      if (!company_name && !fantasy_name && !legal_name) {
        errors.push("Razão Social ou Nome Fantasia é obrigatório para pessoa jurídica");
      }
      if (!tax_id) errors.push("CNPJ é obrigatório para pessoa jurídica");
    }

    if (errors.length > 0) {
      throw new Error(`Por favor, verifique os campos: ${errors.join(", ")}`);
    }
  };

  // Create Google Drive folders for client
  const createGoogleDriveFolders = async (client: Client) => {
    try {
      // Determine the correct folder name based on person type
      const folderName = client.person_type === "fisica" 
        ? client.contact_name 
        : client.company_name;
      
      if (folderName) {
        console.log(`Attempting to create Drive folders for client: ${folderName}`);
        
        const { data: driveData, error: driveError } = await supabase.functions.invoke('create-drive-folders', {
          body: { 
            client,
            clientName: folderName,
            clientEmail: client.email
          }
        });
        
        if (driveError) {
          console.error("Error creating Drive folders:", driveError);
          console.error("Drive error details:", driveError);
          toast.error(`Erro ao criar pastas do Google Drive: ${driveError.message || "Erro desconhecido"}`);
          throw new Error(driveError.message || "Erro desconhecido ao criar pastas");
        } else if (driveData?.folder_id) {
          console.log("Drive folders created successfully:", driveData);
          toast.success("Pastas do Google Drive criadas com sucesso!");
          
          // Update the client with the Drive folder ID
          await supabase
            .from('clients')
            .update({ drive_folder_id: driveData.folder_id })
            .eq('id', client.id);
        } else {
          console.error("No folder ID returned from create-drive-folders function", driveData);
          toast.error("API retornou dados incompletos ao criar pastas");
          throw new Error("API retornou dados incompletos");
        }
      } else {
        toast.error("Nome para criação da pasta não fornecido");
        console.error("Missing folder name for Drive folder creation");
        throw new Error("Nome para criação da pasta não fornecido");
      }
    } catch (driveErr: any) {
      console.error("Exception creating Drive folders:", driveErr);
      const errorMsg = driveErr.message || "Erro ao criar pastas no Google Drive";
      toast.error(`Erro ao criar pastas no Google Drive: ${errorMsg}`);
      throw new Error(errorMsg);
    }
  };

  // Send email invitation if requested
  const sendInvitationIfRequested = async (client: Client) => {
    if (client.send_email_invite && client.email) {
      try {
        const randomPassword = Math.random().toString(36).slice(-10);
        
        console.log("Sending invitation to:", client.email);
        const { data: inviteData, error: inviteError } = await supabase.functions.invoke('send-invitation', {
          body: {
            email: client.email,
            name: client.contact_name,
            company: client.company_name,
            password: randomPassword,
            role: 'client',
            position: client.responsible_position || '',
            phone: client.phone || '',
            send_whatsapp: client.send_whatsapp_invite || false
          }
        });
        
        if (inviteError) {
          console.error("Error sending invitation:", inviteError);
          console.error("Invite error details:", inviteError);
          toast.error(`Erro ao enviar convite: ${inviteError.message || "Erro desconhecido"}`);
          throw new Error(inviteError.message || "Erro ao enviar convite");
        } else if (inviteData?.success) {
          console.log("Invitation sent successfully:", inviteData);
          toast.success("Convite enviado com sucesso!");
        } else {
          console.error("Unknown error in send-invitation function", inviteData);
          toast.error("Erro desconhecido ao enviar convite");
          throw new Error("Erro desconhecido ao enviar convite");
        }
      } catch (inviteErr: any) {
        console.error("Exception sending invitation:", inviteErr);
        const errorMsg = inviteErr.message || "Erro desconhecido";
        toast.error(`Erro ao enviar convite por e-mail: ${errorMsg}`);
        throw new Error(`Erro ao enviar convite por e-mail: ${errorMsg}`);
      }
    }
  };

  return {
    createClient,
    isCreating,
    driveFolderError,
    inviteError
  };
};
