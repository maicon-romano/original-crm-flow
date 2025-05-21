
// Follow this setup guide to integrate the Deno runtime into your project:
// https://docs.supabase.com/guides/functions/deno-runtime#using-typescript

import { corsHeaders } from '../_shared/cors.ts'
import { google } from "npm:googleapis@126.0.1";

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204 // Return 204 No Content for OPTIONS requests
    });
  }

  try {
    // Get request body
    const { folderId } = await req.json();
    
    console.log(`Received request to list contents of folder: ${folderId}`);
    
    if (!folderId) {
      console.error("Missing required folder ID");
      return new Response(
        JSON.stringify({ error: 'ID da pasta é obrigatório' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    // Verify Google Drive credentials
    const googleClientEmail = Deno.env.get('GOOGLE_CLIENT_EMAIL');
    const googlePrivateKey = Deno.env.get('GOOGLE_PRIVATE_KEY');
    
    console.log("Checking Google Drive credentials:", { 
      hasEmail: !!googleClientEmail,
      hasKey: !!googlePrivateKey
    });
    
    if (!googleClientEmail || !googlePrivateKey) {
      console.error("Google Drive credentials missing");
      throw new Error('Credenciais do Google Drive não configuradas');
    }
    
    // Initialize Google Drive API
    const jwtClient = new google.auth.JWT(
      googleClientEmail,
      undefined,
      googlePrivateKey.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/drive'],
      undefined
    );
    
    // Authenticate
    try {
      console.log("Authenticating with Google Drive...");
      await jwtClient.authorize();
      console.log("Authentication with Google Drive successful");
    } catch (authError) {
      console.error("Error authenticating with Google Drive:", authError);
      throw new Error('Failed to authenticate with Google Drive: ' + (authError.message || 'Unknown error'));
    }
    
    const drive = google.drive({ version: 'v3', auth: jwtClient });
    
    console.log(`Listing folders for folder ID: ${folderId}`);
    
    // Get folder contents
    try {
      const folderContents = await drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id, name, mimeType, webViewLink)',
        orderBy: 'name',
      });
      
      const folders = folderContents.data.files || [];
      console.log(`Found ${folders.length} items in folder ${folderId}`);
      
      return new Response(
        JSON.stringify({ 
          folders,
          count: folders.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (listError) {
      console.error("Error listing folder contents:", listError);
      throw new Error('Failed to list folder contents: ' + (listError.message || 'Unknown error'));
    }
    
  } catch (error) {
    console.error("Error listing Drive folders:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro ao listar pastas do Google Drive',
        stack: error.stack || 'No stack trace available'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
