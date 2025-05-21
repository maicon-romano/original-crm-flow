
// Follow this setup guide to integrate the Deno runtime into your project:
// https://docs.supabase.com/guides/functions/deno-runtime#using-typescript

import { corsHeaders } from '../_shared/cors.ts'
import { google } from "https://deno.land/x/googleapis@v110.0.0/googleapis.ts";

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get request body
    const { folderId } = await req.json();
    
    if (!folderId) {
      return new Response(
        JSON.stringify({ error: 'ID da pasta é obrigatório' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
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
    
    console.log(`Listing folders for folder ID: ${folderId}`);
    
    // Get folder contents
    const folderContents = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType, webViewLink)',
      orderBy: 'name',
    });
    
    const folders = folderContents.data.files || [];
    
    return new Response(
      JSON.stringify({ 
        folders,
        count: folders.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error("Error listing Drive folders:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao listar pastas do Google Drive' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
