
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

// Helper function to handle CORS preflight requests
function handleCorsPreflightRequest(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }
  return null;
}

// Helper function to validate request data
function validateRequestData(client: ClientData | undefined) {
  if (!client || !client.id) {
    console.error("Missing client data or ID");
    return { 
      valid: false, 
      error: 'ID do cliente é obrigatório', 
      status: 400 
    };
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
    return { 
      valid: false, 
      error: 'Nome para pasta não fornecido', 
      status: 400 
    };
  }
  
  return { valid: true, folderName };
}

// Helper function to initialize Supabase client
function initializeSupabase() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
  return createClient(supabaseUrl, supabaseKey);
}

// Helper function to validate Google Drive credentials
function validateGoogleDriveCredentials() {
  const googleClientEmail = Deno.env.get('GOOGLE_CLIENT_EMAIL');
  const googlePrivateKey = Deno.env.get('GOOGLE_PRIVATE_KEY')?.replace(/\\n/g, '\n');
  const rootFolderId = Deno.env.get('GOOGLE_DRIVE_ROOT_FOLDER_ID');
  
  // Log credential availability and details for debugging
  console.log("Google Drive credentials:", { 
    clientEmail: googleClientEmail ? `${googleClientEmail.substring(0, 5)}...` : "Missing",
    hasPrivateKey: !!googlePrivateKey,
    privateKeyLength: googlePrivateKey ? googlePrivateKey.length : 0,
    rootFolderId: rootFolderId || "Not set"
  });
  
  if (!googleClientEmail || !googlePrivateKey) {
    console.error("Google Drive credentials missing");
    return { 
      valid: false, 
      error: 'Credenciais do Google Drive não configuradas corretamente' 
    };
  }
  
  return {
    valid: true,
    googleClientEmail,
    googlePrivateKey,
    rootFolderId
  };
}

// Helper function to initialize Google Drive API
async function initializeGoogleDrive(googleClientEmail: string, googlePrivateKey: string) {
  try {
    const jwtClient = new google.auth.JWT(
      googleClientEmail,
      undefined,
      googlePrivateKey,
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
    
    return google.drive({ version: 'v3', auth: jwtClient });
  } catch (driveError) {
    console.error("Drive API initialization error:", driveError);
    throw new Error(`Erro ao inicializar API do Google Drive: ${driveError.message}`);
  }
}

// Helper function to verify root folder
async function verifyRootFolder(drive: any, rootFolderId: string | undefined) {
  if (rootFolderId) {
    try {
      const rootFolder = await drive.files.get({
        fileId: rootFolderId,
        fields: 'id,name'
      });
      console.log(`Root folder verified: ${rootFolder.data.name} (${rootFolder.data.id})`);
      return true;
    } catch (rootFolderError) {
      console.error("Error accessing root folder:", rootFolderError);
      throw new Error(`Cannot access root folder with ID ${rootFolderId}. Check permissions or if folder exists.`);
    }
  }
  
  console.log("Root folder ID not set in environment, using default behavior (creating at Drive root)");
  return true;
}

// Helper function to create main folder
async function createMainFolder(drive: any, folderName: string, rootFolderId?: string) {
  const folderMetadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  
  // If rootFolderId is provided, create the folder inside it
  if (rootFolderId) {
    folderMetadata.parents = [rootFolderId];
    console.log(`Using root folder ID: ${rootFolderId}`);
  }
  
  try {
    const mainFolder = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id,name,webViewLink'
    });
    console.log(`Main folder created:`, mainFolder.data);
    
    if (!mainFolder?.data?.id) {
      console.error("No folder ID returned after creation");
      throw new Error('Failed to create main folder - no ID returned');
    }
    
    return mainFolder.data;
  } catch (folderError) {
    console.error("Error creating main folder:", folderError);
    console.error("Folder error details:", JSON.stringify(folderError, null, 2));
    throw new Error(`Failed to create main folder: ${folderError.message || 'Unknown error'}`);
  }
}

// Helper function to create subfolders
async function createSubfolders(drive: any, mainFolderId: string) {
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
        await createCreativesSubfolders(drive, folder.data.id);
      }
    } catch (subfoldError) {
      console.error(`Error creating subfolder ${folderName}:`, subfoldError);
      // Continue creating other folders even if one fails
    }
  }
  
  return createdFolders;
}

// Helper function to create creatives subfolders
async function createCreativesSubfolders(drive: any, creativeFolderId: string) {
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

// Helper function to add permissions
async function addPermissions(drive: any, mainFolderId: string, email?: string) {
  if (email) {
    try {
      console.log(`Adding client email ${email} as viewer to folder`);
      const permission = await drive.permissions.create({
        fileId: mainFolderId,
        requestBody: {
          role: 'reader',
          type: 'user',
          emailAddress: email,
        },
      });
      
      console.log(`Added ${email} as a viewer to the folder:`, permission.data);
    } catch (error) {
      console.error(`Error adding permission for ${email}:`, error);
      console.error(`Permission error details:`, JSON.stringify(error, null, 2));
      // Continue execution even if permission sharing fails
    }
  } else {
    console.log("No client email provided, skipping permission assignment");
  }
}

// Helper function to update client with folder ID
async function updateClientWithFolderId(supabase: any, clientId: string, mainFolderId: string) {
  try {
    const { error: updateError } = await supabase
      .from('clients')
      .update({ drive_folder_id: mainFolderId })
      .eq('id', clientId);
      
    if (updateError) {
      console.error("Error updating client with Drive folder ID:", updateError);
      throw new Error('Failed to update client with Drive folder ID');
    }
    
    console.log(`Updated client record ${clientId} with folder ID ${mainFolderId}`);
  } catch (updateErr) {
    console.error("Exception updating client record:", updateErr);
    // Continue - we've created the folders, so this isn't critical
  }
}

// Main handler function
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    // Get request body
    const { client } = await req.json() as { client: ClientData };
    
    // Log the full request payload for debugging
    console.log("Received request payload:", JSON.stringify(client, null, 2));
    
    // Validate request data
    const validationResult = validateRequestData(client);
    if (!validationResult.valid) {
      return new Response(
        JSON.stringify({ error: validationResult.error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: validationResult.status }
      );
    }
    const { folderName } = validationResult;
    
    // Initialize Supabase client
    const supabase = initializeSupabase();
    
    // Validate Google Drive credentials
    const credentialsResult = validateGoogleDriveCredentials();
    if (!credentialsResult.valid) {
      return new Response(
        JSON.stringify({ error: credentialsResult.error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    const { googleClientEmail, googlePrivateKey, rootFolderId } = credentialsResult;
    
    console.log(`Creating folders in Google Drive for client ${folderName}`);
    
    // Initialize Google Drive API
    const drive = await initializeGoogleDrive(googleClientEmail, googlePrivateKey);
    
    // Verify root folder if provided
    if (rootFolderId) {
      await verifyRootFolder(drive, rootFolderId);
    }
    
    // Create main client folder
    console.log(`Creating main folder for ${folderName}`);
    const mainFolder = await createMainFolder(drive, folderName, rootFolderId);
    const mainFolderId = mainFolder.id;
    
    console.log(`Main folder created with ID: ${mainFolderId}`);
    
    // Create subfolders
    await createSubfolders(drive, mainFolderId);
    
    // Add client as viewer if email is provided
    if (client.email) {
      await addPermissions(drive, mainFolderId, client.email);
    }
    
    // Update client record with the main folder ID
    await updateClientWithFolderId(supabase, client.id, mainFolderId);
    
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
  } catch (error) {
    console.error("Error creating Drive folders:", error);
    console.error("Stack trace:", error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro ao criar pastas no Google Drive',
        stack: error.stack || 'No stack trace available'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
