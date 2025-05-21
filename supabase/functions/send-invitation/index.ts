
// Follow this setup guide to integrate the Deno runtime into your project:
// https://docs.supabase.com/guides/functions/deno-runtime#using-typescript

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'
import { SmtpClient } from "https://deno.land/x/denomailer/mod.ts";

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get request origin to set proper redirect URL
    const originHeader = req.headers.get('origin') || '';
    console.log("Request origin:", originHeader);
    
    // Determine application URL for redirects
    let applicationUrl = 'http://localhost:3000';
    if (originHeader && !originHeader.includes('localhost')) {
      applicationUrl = originHeader;
    }
    
    console.log("Using application URL for redirects:", applicationUrl);
    
    // Get request body
    const { 
      email, 
      name, 
      company, 
      password, 
      role, 
      position, 
      phone,
      send_whatsapp = false  
    } = await req.json();
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email é obrigatório' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // First check if user already exists
    const { data: existingUsers, error: existingError } = await supabase.auth.admin.listUsers({
      filters: {
        email: email
      }
    });
    
    let userId;
    
    // If user doesn't exist, create them
    if (!existingUsers?.users.length) {
      // Create auth user
      const { data: userData, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        password: password || Math.random().toString(36).slice(-8),
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name: name,
          company: company,
        }
      });
      
      if (createError) {
        throw createError;
      }
      
      userId = userData.user.id;
      
      // Create user profile
      try {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: email,
            name: name,
            role: role || 'client',
            position: position,
            phone: phone,
            active: true,
            needs_password_reset: true
          });
          
        if (profileError) {
          console.error("Error creating user profile:", profileError);
          throw profileError;
        }
      } catch (err) {
        console.error("Error inserting user profile:", err);
        throw err;
      }
    } else {
      // User already exists
      userId = existingUsers.users[0].id;
      console.log("User already exists:", userId);
    }
    
    // Get email API key
    const emailApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!emailApiKey) {
      throw new Error('API Key de email não configurada');
    }
    
    // Create reset link
    const resetLink = `${applicationUrl}/reset-password`;
    console.log("Generated reset link:", resetLink);
    
    // Send email
    const client = new SmtpClient();

    await client.connect({
      hostname: "smtp.resend.com",
      port: 465,
      username: "resend",
      password: emailApiKey,
    });

    const messageContent = `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
            }
            .container {
              padding: 20px;
            }
            .header {
              background-color: #4f46e5;
              color: white;
              padding: 20px;
              text-align: center;
            }
            .content {
              padding: 20px;
              background-color: #f9fafb;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 12px;
              color: #6b7280;
            }
            .button {
              display: inline-block;
              background-color: #4f46e5;
              color: white;
              padding: 10px 20px;
              text-decoration: none;
              border-radius: 5px;
              margin-top: 15px;
            }
            .credentials {
              background-color: #f1f5f9;
              padding: 15px;
              border-left: 4px solid #4f46e5;
              margin: 15px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Bem-vindo ao CRM da Original Digital</h1>
            </div>
            <div class="content">
              <p>Olá ${name},</p>
              <p>Sua conta no CRM da Original Digital foi criada com sucesso!</p>
              
              <p>Você pode acessar o sistema com as seguintes credenciais:</p>
              
              <div class="credentials">
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Senha temporária:</strong> ${password}</p>
              </div>
              
              <p>Por motivos de segurança, você será solicitado a alterar sua senha no primeiro acesso.</p>
              
              <p>Para acessar o sistema, clique no botão abaixo:</p>
              
              <a href="${resetLink}" class="button">Acessar Sistema</a>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} Original Digital. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const info = await client.send({
      from: "CRM Original Digital <crm@originaldigital.com.br>",
      to: email,
      subject: "Bem-vindo ao CRM da Original Digital",
      content: messageContent,
      html: messageContent,
    });

    await client.close();
    
    console.log("Email sent successfully:", info);
    
    // If WhatsApp message is requested, you could integrate with API Evolution or other WhatsApp API here
    if (send_whatsapp && phone) {
      // Implement WhatsApp messaging integration here
      try {
        const apiKey = Deno.env.get('API_EVOLUTION_INSTANCE');
        if (apiKey) {
          console.log("Would send WhatsApp message to:", phone);
          // Implement actual WhatsApp message sending
        } else {
          console.log("WhatsApp API key not configured, skipping WhatsApp message");
        }
      } catch (whatsappError) {
        console.error("Error sending WhatsApp message:", whatsappError);
        // Log but don't throw, so email success is still returned
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error("Error sending invitation:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao enviar convite' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
