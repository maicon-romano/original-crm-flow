
// Follow this setup guide to integrate the Deno runtime into your project:
// https://docs.supabase.com/guides/functions/deno-runtime#using-typescript

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { google } from "npm:googleapis@126.0.1";
import { corsHeaders } from '../_shared/cors.ts'

interface ClientData {
  id: string;
  company_name: string;
  email: string;
  contact_name: string; // Adicionado para usar como nome da pasta quando for pessoa física
  person_type: "juridica" | "fisica"; // Adicionado para verificar o tipo de pessoa
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests - this is critical for browser requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204 // Return 204 No Content for OPTIONS requests
    });
  }

  try {
    // Get request body
    const { client } = await req.json() as { client: ClientData };
    
    if (!client || !client.id) {
      return new Response(
        JSON.stringify({ error: 'ID do cliente é obrigatório' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    // Determinar o nome da pasta com base no tipo de pessoa
    let folderName = "";
    if (client.person_type === "fisica") {
      folderName = client.contact_name || "Cliente sem nome";
    } else {
      folderName = client.company_name || "Empresa sem nome";
    }
    
    // Verificar se temos um nome de pasta válido
    if (!folderName || folderName.trim() === "") {
      return new Response(
        JSON.stringify({ error: 'Nome para pasta não fornecido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Verificar se as variáveis de ambiente estão disponíveis
    const googleClientEmail = Deno.env.get('GOOGLE_CLIENT_EMAIL');
    const googlePrivateKey = Deno.env.get('GOOGLE_PRIVATE_KEY');
    
    if (!googleClientEmail || !googlePrivateKey) {
      console.error("Google Drive credentials missing:", { 
        hasEmail: !!googleClientEmail,
        hasKey: !!googlePrivateKey
      });
      throw new Error('Credenciais do Google Drive não configuradas');
    }
    
    console.log(`Iniciando criação de pastas no Google Drive para cliente ${folderName}`);
    
    // Initialize Google Drive API
    const jwtClient = new google.auth.JWT(
      googleClientEmail,
      undefined,
      googlePrivateKey.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/drive'],
      undefined
    );
    
    // Authenticate
    console.log("Autenticando com Google Drive...");
    try {
      await jwtClient.authorize();
      console.log("Autenticação com Google Drive bem-sucedida");
    } catch (authError) {
      console.error("Erro na autenticação com Google Drive:", authError);
      throw new Error('Falha na autenticação com o Google Drive');
    }
    
    const drive = google.drive({ version: 'v3', auth: jwtClient });
    
    // Create main client folder
    console.log(`Criando pasta principal para ${folderName}`);
    let mainFolder;
    try {
      mainFolder = await drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
        },
      });
    } catch (folderError) {
      console.error("Erro ao criar pasta principal:", folderError);
      throw new Error('Falha ao criar pasta principal no Google Drive');
    }
    
    if (!mainFolder?.data?.id) {
      throw new Error('Falha ao criar pasta principal no Google Drive - ID não retornado');
    }
    
    const mainFolderId = mainFolder.data.id;
    console.log(`Pasta principal criada com ID: ${mainFolderId}`);
    
    // Define subfolders to create
    const subfolders = [
      'Briefing',
      'Materiais do Cliente',
      'Estratégias Social Media',
      'Estratégias Tráfego Pago',
      'Site',
      'Criativos',
      'Documentos e Contratos',
      'Relatórios'
    ];
    
    // Create subfolders
    const createdFolders = [];
    for (const folderName of subfolders) {
      console.log(`Criando subpasta: ${folderName}`);
      try {
        const folder = await drive.files.create({
          requestBody: {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [mainFolderId],
          },
        });
        
        createdFolders.push({
          name: folderName,
          id: folder.data.id
        });
        
        // If it's the "Criativos" folder, create subfolders
        if (folderName === 'Criativos' && folder.data.id) {
          const creativeFolderId = folder.data.id;
          
          // Create "Fotos" subfolder
          await drive.files.create({
            requestBody: {
              name: 'Fotos',
              mimeType: 'application/vnd.google-apps.folder',
              parents: [creativeFolderId],
            },
          });
          
          // Create "Vídeos" subfolder
          await drive.files.create({
            requestBody: {
              name: 'Vídeos',
              mimeType: 'application/vnd.google-apps.folder',
              parents: [creativeFolderId],
            },
          });
        }
      } catch (subfoldError) {
        console.error(`Erro ao criar subpasta ${folderName}:`, subfoldError);
        // Continue creating other folders even if one fails
      }
    }
    
    // If client has an email, add them as a viewer to the main folder
    if (client.email) {
      try {
        await drive.permissions.create({
          fileId: mainFolderId,
          requestBody: {
            role: 'reader',
            type: 'user',
            emailAddress: client.email,
          },
        });
        
        console.log(`Added ${client.email} as a viewer to the folder`);
      } catch (error) {
        console.error(`Error adding permission for ${client.email}:`, error);
        // Continue execution even if permission sharing fails
      }
    }
    
    // Update client record with the main folder ID
    const { error: updateError } = await supabase
      .from('clients')
      .update({ drive_folder_id: mainFolderId })
      .eq('id', client.id);
      
    if (updateError) {
      console.error("Error updating client with Drive folder ID:", updateError);
      throw new Error('Falha ao atualizar cliente com ID da pasta do Google Drive');
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        folder_id: mainFolderId,
        message: `Pastas criadas com sucesso para ${folderName}` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error("Error creating Drive folders:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao criar pastas no Google Drive' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
