
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { google } from "npm:googleapis@126.0.1";
import { corsHeaders } from '../_shared/cors.ts'

interface ClientData {
  id: string;
  company_name: string;
  email: string;
  contact_name: string;
  person_type: "juridica" | "fisica";
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
    
    // Log the full request payload for debugging
    console.log("Received request payload:", JSON.stringify(client, null, 2));
    
    if (!client || !client.id) {
      console.error("Missing client data or ID");
      return new Response(
        JSON.stringify({ error: 'ID do cliente é obrigatório' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    // Determine folder name based on person type
    let folderName = "";
    if (client.person_type === "fisica") {
      folderName = client.contact_name || "Cliente sem nome";
    } else {
      folderName = client.company_name || "Empresa sem nome";
    }
    
    // Log folder name determination
    console.log(`Creating folder for client type: ${client.person_type}, name: ${folderName}`);
    
    // Verify folder name is valid
    if (!folderName || folderName.trim() === "") {
      console.error("Empty folder name detected");
      return new Response(
        JSON.stringify({ error: 'Nome para pasta não fornecido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Verify Google Drive credentials
    const googleClientEmail = Deno.env.get('GOOGLE_CLIENT_EMAIL');
    const googlePrivateKey = Deno.env.get('GOOGLE_PRIVATE_KEY');
    const rootFolderId = Deno.env.get('GOOGLE_DRIVE_ROOT_FOLDER_ID');
    
    // Log credential availability and details for debugging
    console.log("Google Drive credentials:", { 
      clientEmail: googleClientEmail,
      hasPrivateKey: !!googlePrivateKey,
      privateKeyLength: googlePrivateKey ? googlePrivateKey.length : 0,
      rootFolderId
    });
    
    if (!googleClientEmail || !googlePrivateKey) {
      console.error("Google Drive credentials missing");
      throw new Error('Credenciais do Google Drive não configuradas corretamente');
    }
    
    if (!rootFolderId) {
      console.log("Root folder ID not set in environment, using default behavior (creating at Drive root)");
    }
    
    console.log(`Creating folders in Google Drive for client ${folderName}`);
    
    // Initialize Google Drive API with properly formatted private key
    try {
      const jwtClient = new google.auth.JWT(
        googleClientEmail,
        undefined,
        googlePrivateKey.replace(/\\n/g, '\n'),
        ['https://www.googleapis.com/auth/drive'],
        undefined
      );
      
      // Authenticate with detailed error handling
      console.log("Authenticating with Google Drive...");
      try {
        await jwtClient.authorize();
        console.log("Authentication with Google Drive successful");
      } catch (authError) {
        console.error("Error authenticating with Google Drive:", authError);
        console.error("Auth error details:", JSON.stringify(authError, null, 2));
        throw new Error(`Failed to authenticate with Google Drive: ${authError.message || 'Unknown error'}`);
      }
      
      const drive = google.drive({ version: 'v3', auth: jwtClient });
      
      // Create main client folder
      console.log(`Creating main folder for ${folderName}`);
      
      const folderMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      };
      
      // If rootFolderId is provided, create the folder inside it
      if (rootFolderId) {
        folderMetadata.parents = [rootFolderId];
        console.log(`Using root folder ID: ${rootFolderId}`);
        
        // Verify that the root folder exists and is accessible
        try {
          const rootFolder = await drive.files.get({
            fileId: rootFolderId,
            fields: 'id,name'
          });
          console.log(`Root folder verified: ${rootFolder.data.name} (${rootFolder.data.id})`);
        } catch (rootFolderError) {
          console.error("Error accessing root folder:", rootFolderError);
          throw new Error(`Cannot access root folder with ID ${rootFolderId}. Check permissions or if folder exists.`);
        }
      }
      
      let mainFolder;
      try {
        mainFolder = await drive.files.create({
          requestBody: folderMetadata,
          fields: 'id,name,webViewLink'
        });
        console.log(`Main folder created:`, mainFolder.data);
      } catch (folderError) {
        console.error("Error creating main folder:", folderError);
        console.error("Folder error details:", JSON.stringify(folderError, null, 2));
        throw new Error(`Failed to create main folder: ${folderError.message || 'Unknown error'}`);
      }
      
      if (!mainFolder?.data?.id) {
        console.error("No folder ID returned after creation");
        throw new Error('Failed to create main folder - no ID returned');
      }
      
      const mainFolderId = mainFolder.data.id;
      console.log(`Main folder created with ID: ${mainFolderId}`);
      
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
        console.log(`Creating subfolder: ${folderName}`);
        try {
          const folder = await drive.files.create({
            requestBody: {
              name: folderName,
              mimeType: 'application/vnd.google-apps.folder',
              parents: [mainFolderId],
            },
            fields: 'id,name'
          });
          
          createdFolders.push({
            name: folderName,
            id: folder.data.id
          });
          
          // If it's the "Criativos" folder, create subfolders
          if (folderName === 'Criativos' && folder.data.id) {
            const creativeFolderId = folder.data.id;
            
            try {
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
            } catch (subfolderError) {
              console.error(`Error creating Criativos subfolders:`, subfolderError);
              // Continue despite errors in creative subfolders
            }
          }
        } catch (subfoldError) {
          console.error(`Error creating subfolder ${folderName}:`, subfoldError);
          // Continue creating other folders even if one fails
        }
      }
      
      // If client has an email, add them as a viewer to the main folder
      if (client.email) {
        try {
          console.log(`Adding client email ${client.email} as viewer to folder`);
          const permission = await drive.permissions.create({
            fileId: mainFolderId,
            requestBody: {
              role: 'reader',
              type: 'user',
              emailAddress: client.email,
            },
          });
          
          console.log(`Added ${client.email} as a viewer to the folder:`, permission.data);
        } catch (error) {
          console.error(`Error adding permission for ${client.email}:`, error);
          console.error(`Permission error details:`, JSON.stringify(error, null, 2));
          // Continue execution even if permission sharing fails
        }
      } else {
        console.log("No client email provided, skipping permission assignment");
      }
      
      // Update client record with the main folder ID
      try {
        const { error: updateError } = await supabase
          .from('clients')
          .update({ drive_folder_id: mainFolderId })
          .eq('id', client.id);
          
        if (updateError) {
          console.error("Error updating client with Drive folder ID:", updateError);
          throw new Error('Failed to update client with Drive folder ID');
        }
        
        console.log(`Updated client record ${client.id} with folder ID ${mainFolderId}`);
      } catch (updateErr) {
        console.error("Exception updating client record:", updateErr);
        // Continue - we've created the folders, so this isn't critical
      }
      
      // Generate folder URL
      const folderUrl = `https://drive.google.com/drive/folders/${mainFolderId}`;
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          folder_id: mainFolderId,
          folder_url: folderUrl,
          message: `Pastas criadas com sucesso para ${folderName}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (driveError) {
      console.error("Drive API initialization error:", driveError);
      throw new Error(`Erro ao inicializar API do Google Drive: ${driveError.message}`);
    }
  } catch (error) {
    console.error("Error creating Drive folders:", error);
    console.error("Stack trace:", error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro ao criar pastas no Google Drive',
        stack: error.stack || 'No stack trace available'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
