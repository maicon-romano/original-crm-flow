
// Follow this setup guide to integrate the Deno runtime into your project:
// https://docs.supabase.com/guides/functions/deno-runtime#using-typescript

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { google } from "npm:googleapis@126.0.1";
import { corsHeaders } from '../_shared/cors.ts'

interface ClientData {
  id: string;
  company_name: string;
  email: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get request body
    const { client } = await req.json() as { client: ClientData };
    
    if (!client || !client.company_name || !client.id) {
      return new Response(
        JSON.stringify({ error: 'ID do cliente e nome da empresa são obrigatórios' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Initialize Google Drive API
    const jwtClient = new google.auth.JWT(
      Deno.env.get('GOOGLE_CLIENT_EMAIL'),
      undefined,
      Deno.env.get('GOOGLE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/drive'],
      undefined
    );
    
    // Authenticate
    await jwtClient.authorize();
    const drive = google.drive({ version: 'v3', auth: jwtClient });
    
    console.log(`Creating Google Drive folders for client ${client.company_name}`);
    
    // Create main client folder
    const mainFolder = await drive.files.create({
      requestBody: {
        name: `${client.company_name}`,
        mimeType: 'application/vnd.google-apps.folder',
      },
    });
    
    if (!mainFolder.data.id) {
      throw new Error('Falha ao criar pasta principal no Google Drive');
    }
    
    const mainFolderId = mainFolder.data.id;
    
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
        message: `Pastas criadas com sucesso para ${client.company_name}` 
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
