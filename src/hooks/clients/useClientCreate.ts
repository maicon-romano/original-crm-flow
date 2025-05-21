
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Client, ClientInsert } from "@/types/client";

export const useClientCreate = (
  onClientCreated?: (client: Client) => void,
  setClients?: (updater: (prevClients: Client[]) => Client[]) => void
) => {
  const [isCreating, setIsCreating] = useState(false);

  const createClient = async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setIsCreating(true);
      console.log("Creating client:", clientData);

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
      
      const { data, error } = await supabase
        .from('clients')
        .insert(insertData)
        .select('*')
        .single();
      
      if (error) {
        console.error("Error creating client:", error);
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

      await createGoogleDriveFolders(typedClient);
      await sendInvitationIfRequested(typedClient);

      // Notify parent component that client was created
      if (onClientCreated) {
        onClientCreated(typedClient);
      }
      
      return typedClient;
    } catch (error: any) {
      console.error("Exception creating client:", error);
      throw new Error(error.message || "Erro ao criar cliente");
    } finally {
      setIsCreating(false);
    }
  };

  // Create Google Drive folders for client
  const createGoogleDriveFolders = async (client: Client) => {
    let driveFolderCreated = false;
    let driveErrorMsg = "";
    
    try {
      // Determinar o nome correto da pasta com base no tipo de pessoa
      const folderName = client.person_type === "fisica" 
        ? client.contact_name 
        : client.company_name;
      
      if (folderName) {
        console.log(`Attempting to create Drive folders for client: ${folderName}`);
        
        const { data: driveData, error: driveError } = await supabase.functions.invoke('create-drive-folders', {
          body: { client }
        });
        
        if (driveError) {
          console.error("Error creating Drive folders:", driveError);
          driveErrorMsg = driveError.message || "Erro desconhecido ao criar pastas";
        } else if (driveData?.folder_id) {
          console.log("Drive folders created successfully:", driveData);
          driveFolderCreated = true;
          
          // Update the client with the Drive folder ID
          await supabase
            .from('clients')
            .update({ drive_folder_id: driveData.folder_id })
            .eq('id', client.id);
        }
      } else {
        driveErrorMsg = "Nome para criação da pasta não fornecido";
        console.error("Missing folder name for Drive folder creation");
      }
    } catch (driveErr: any) {
      console.error("Exception creating Drive folders:", driveErr);
      driveErrorMsg = driveErr.message || "Erro ao criar pastas no Google Drive";
    }
    
    // Show appropriate toast based on Drive folder creation result
    if (driveFolderCreated) {
      toast.success("Pastas do Google Drive criadas com sucesso!");
    } else {
      toast.error(`Erro ao criar pastas no Google Drive: ${driveErrorMsg}. O cliente foi salvo, mas sem as pastas.`);
    }
  };

  // Send email invitation if requested
  const sendInvitationIfRequested = async (client: Client) => {
    if (client.send_email_invite && client.email) {
      try {
        const randomPassword = Math.random().toString(36).slice(-10);
        
        const { error: inviteError } = await supabase.functions.invoke('send-invitation', {
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
          toast.error("Erro ao enviar convite por e-mail");
        } else {
          toast.success("Convite enviado com sucesso!");
        }
      } catch (inviteErr) {
        console.error("Exception sending invitation:", inviteErr);
        toast.error("Erro ao enviar convite por e-mail");
      }
    }
  };

  return {
    createClient,
    isCreating
  };
};
