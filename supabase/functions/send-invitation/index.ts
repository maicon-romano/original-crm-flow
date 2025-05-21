
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handle CORS preflight requests
async function handleCors(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
}

// Generate a temporary password
function generateRandomPassword(length = 12) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let result = '';
  const charactersLength = characters.length;
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  
  return result;
}

// Send invitation email via RESEND API
async function sendInvitationEmail(to: string, name: string, temporaryPassword: string, invitedBy: any) {
  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not defined");
    }
    
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Original Digital <sistema@originaldigital.com.br>',
        to: [to],
        subject: 'Bem-vindo ao CRM da Original Digital',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #3b82f6;">Bem-vindo ao CRM da Original Digital!</h2>
            <p>Olá <strong>${name}</strong>,</p>
            <p>Você foi convidado por <strong>${invitedBy.name}</strong> para acessar o CRM da Original Digital.</p>
            <p>Por favor, utilize as credenciais abaixo para fazer login:</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Email:</strong> ${to}</p>
              <p><strong>Senha temporária:</strong> ${temporaryPassword}</p>
            </div>
            <p style="margin-bottom: 30px;">Na primeira vez que você acessar, será solicitado que você crie uma nova senha.</p>
            <a href="${SUPABASE_URL.replace('.supabase.co', '')}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Acessar CRM</a>
            <p style="margin-top: 30px; color: #6b7280; font-size: 12px;">
              Se você não esperava este email, por favor ignore-o ou entre em contato com o administrador do sistema.
            </p>
          </div>
        `,
      }),
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.message || 'Failed to send email');
    }
    
    console.log("Email sent successfully:", data);
    return data;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

Deno.serve(async (req) => {
  // Handle CORS
  const corsResponse = await handleCors(req);
  if (corsResponse) return corsResponse;
  
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get request body
    const { email, name, role, position, phone, invitedBy } = await req.json();
    
    // Validate required fields
    if (!email || !name || !role) {
      return new Response(JSON.stringify({ success: false, error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client with admin privileges
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Generate temporary password
    const temporaryPassword = generateRandomPassword(12);
    
    // Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        name,
        role,
      },
    });
    
    if (authError) {
      throw new Error(authError.message);
    }

    // Insert user data in the users table
    const { error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email: email,
          name: name,
          role: role,
          position: position || null,
          phone: phone || null,
          active: true,
          needs_password_reset: true,
        }
      ]);
      
    if (userError) {
      // Rollback - delete the auth user if we couldn't create the user profile
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new Error(userError.message);
    }
    
    // Send invitation email
    await sendInvitationEmail(email, name, temporaryPassword, invitedBy);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User invited successfully',
        user: { id: authData.user.id, email, name, role }  
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error("Error processing invitation:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'An error occurred' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
