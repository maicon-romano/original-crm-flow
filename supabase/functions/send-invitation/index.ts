
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
    const { email, name, company, password } = await req.json();
    
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
    
    // Get user data to retrieve confirmation token
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      throw usersError;
    }
    
    const user = users.find(u => u.email === email);
    
    if (!user) {
      throw new Error(`Usuário não encontrado: ${email}`);
    }
    
    // Get email API key
    const emailApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!emailApiKey) {
      throw new Error('API Key de email não configurada');
    }
    
    // Create reset link
    const resetLink = `${applicationUrl}/reset-password`;
    console.log("Generated reset link:", resetLink);
    
    // Update user data with temporary password if provided
    if (password) {
      try {
        const { error: updateError } = await supabase
          .from('users')
          .update({
            needs_password_reset: true
          })
          .eq('email', email);
          
        if (updateError) {
          console.error("Error updating user profile:", updateError);
        }
      } catch (err) {
        console.error("Error inserting user profile:", err);
      }
    }

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
