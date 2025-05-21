
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  
  try {
    // Get the request body and extract origin URL
    const { email, name, role, position, phone, invitedBy } = await req.json();
    
    // Get the origin URL from the request to use for redirects
    const origin = new URL(req.url).origin;
    // Set the application URL - use the request origin or fallback to localhost for development
    const applicationUrl = origin.includes('localhost') ? origin : 'http://localhost:3000';
    
    console.log("Request origin:", origin);
    console.log("Using application URL for redirects:", applicationUrl);
    
    // Check if required fields are provided
    if (!email || !name || !role) {
      return new Response(
        JSON.stringify({ error: 'Required fields missing' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }
    
    // Initialize Supabase client with service role privileges
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Generate a random password for the new user
    const tempPassword = Math.random().toString(36).slice(-10);
    
    // Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name },
    });
    
    if (authError) {
      throw authError;
    }
    
    if (!authData.user) {
      throw new Error("Failed to create user");
    }
    
    // Create user profile in the public.users table
    try {
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            name,
            email,
            phone,
            position,
            role,
            active: true,
            needs_password_reset: true,
          }
        ]);
      
      if (profileError) {
        console.error("Error inserting user profile:", profileError);
      }
    } catch (profileErr) {
      console.error("Exception inserting user profile:", profileErr);
    }
    
    // Send invitation email with Resend
    let emailStatus = { success: true, id: "email-not-sent" };
    
    try {
      if (RESEND_API_KEY) {
        // Generate reset password link using the right token and redirect URL
        // Make sure to use the confirmation_token from authData for the password reset link
        const resetToken = authData.user.confirmation_token;
        
        if (!resetToken) {
          console.error("No confirmation token found in user data");
        }
        
        // Construct the reset link with the proper token and redirect URL
        const resetLink = `${SUPABASE_URL}/auth/v1/verify?token=${resetToken}&type=invite&redirect_to=${encodeURIComponent(`${applicationUrl}/reset-password`)}`;
        
        console.log("Generated reset link:", resetLink);
        
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`
          },
          body: JSON.stringify({
            from: 'Original Digital <notificacoes@originaldigital.com.br>',
            to: email,
            subject: 'Convite para o CRM Original Digital',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Olá ${name},</h2>
                <p>Você foi convidado por ${invitedBy?.name || 'um administrador'} para acessar o CRM da Original Digital.</p>
                
                <p>Para completar seu cadastro e definir sua senha, clique no botão abaixo:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetLink}" style="background-color: #111827; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                    Completar Cadastro
                  </a>
                </div>
                
                <p>Se o botão não funcionar, você pode copiar e colar o link abaixo no seu navegador:</p>
                <p style="word-break: break-all; font-size: 12px; color: #666;">${resetLink}</p>
                
                <p>Esse link é válido por 24 horas. Caso expire, solicite um novo convite.</p>
                
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
                  <p>Original Digital 2025 - Todos os direitos reservados.</p>
                </div>
              </div>
            `
          })
        });
        
        emailStatus = await res.json();
        console.log("Email sent successfully:", emailStatus);
      }
    } catch (emailErr) {
      console.error("Error sending email:", emailErr);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User invited successfully',
        email: emailStatus
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error sending invitation:', error);
    
    let errorMessage = 'Failed to send invitation';
    if (error.message?.includes('already been registered')) {
      errorMessage = 'Email already taken';
    }
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
