
// Follow this setup guide to integrate the Deno runtime into your project:
// https://docs.supabase.com/guides/functions/deno-runtime#using-typescript

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'

interface ClientData {
  id: string;
  email: string;
  name: string;
  company: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get request body
    const { client } = await req.json() as { client: ClientData };
    
    if (!client || !client.id || !client.email || !client.name) {
      return new Response(
        JSON.stringify({ error: 'ID do cliente, email e nome são obrigatórios' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    console.log(`Creating user account for client ${client.name} (${client.email})`);
    
    // Generate a random password
    const tempPassword = generatePassword(12);
    
    // Check if user with this email already exists
    const { data: existingUser } = await supabase.auth.admin.listUsers({
      filter: {
        email: client.email
      }
    });
    
    let userId;
    
    if (existingUser && existingUser.users && existingUser.users.length > 0) {
      userId = existingUser.users[0].id;
      console.log(`User with email ${client.email} already exists, using existing account`);
    } else {
      // Create user in auth system
      const { data: userData, error: createError } = await supabase.auth.admin.createUser({
        email: client.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          name: client.name,
          company: client.company
        }
      });
      
      if (createError) {
        throw createError;
      }
      
      userId = userData.user.id;
    }
    
    // Update user role to client in public.users table
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        role: 'client',
        needs_password_reset: true
      })
      .eq('id', userId);
      
    if (updateError) {
      throw updateError;
    }
    
    // Send invitation email with temp password
    await supabase.functions.invoke('send-invitation', {
      body: {
        email: client.email,
        name: client.name,
        company: client.company,
        password: tempPassword
      }
    });
    
    return new Response(
      JSON.stringify({ 
        success: true,
        user_id: userId,
        message: `Conta criada para ${client.email}` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error("Error creating client user:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao criar usuário cliente' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// Function to generate a random password
function generatePassword(length: number): string {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+";
  let password = "";
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  
  return password;
}
