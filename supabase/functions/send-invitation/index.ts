
// Follow this setup guide to integrate the Deno runtime into your project:
// https://docs.supabase.com/guides/functions/deno-runtime#using-typescript

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'
import { SmtpClient } from "https://deno.land/x/denomailer/mod.ts";

// Configuration and environment variables
const getEnvVar = (name: string): string => {
  const value = Deno.env.get(name);
  if (!value) {
    console.error(`Missing environment variable: ${name}`);
    throw new Error(`${name} não configurada`);
  }
  return value;
};

// Initialize Supabase client
const initSupabaseClient = () => {
  const supabaseUrl = getEnvVar('SUPABASE_URL');
  const supabaseKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');
  return createClient(supabaseUrl, supabaseKey);
};

// Handle CORS preflight requests
const handleCorsPreflightRequest = (req: Request): Response | null => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      },
      status: 204 
    });
  }
  return null;
};

// Validate request data
const validateRequestData = (data: any): string | null => {
  if (!data.email) {
    console.error("Missing required field: email");
    return 'Email é obrigatório';
  }
  
  if (!data.name) {
    console.warn("Missing name for invitation, proceeding with email address as name");
  }
  
  return null;
};

// Check if user already exists
const checkExistingUser = async (supabase: any, email: string) => {
  console.log(`Checking if user with email ${email} already exists`);
  const { data: existingUsers, error: existingError } = await supabase.auth.admin.listUsers({
    filters: {
      email: email
    }
  });
  
  if (existingError) {
    console.error("Error checking existing users:", existingError);
  }
  
  return existingUsers;
};

// Create new auth user
const createAuthUser = async (supabase: any, email: string, password: string, name: string, company: string) => {
  console.log(`User ${email} does not exist, creating new user`);
  const temporaryPassword = password || Math.random().toString(36).slice(-10);
  
  const { data: userData, error: createError } = await supabase.auth.admin.createUser({
    email: email,
    password: temporaryPassword,
    email_confirm: true, // Auto-confirm email
    user_metadata: {
      name: name,
      company: company,
    }
  });
  
  if (createError) {
    console.error("Error creating auth user:", createError);
    throw createError;
  }
  
  return { userData, temporaryPassword };
};

// Create user profile
const createUserProfile = async (supabase: any, userId: string, email: string, name: string, role: string, position: string, phone: string) => {
  try {
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: email,
        name: name || email.split('@')[0],
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
    
    console.log(`User profile created for ${email}`);
  } catch (err) {
    console.error("Error inserting user profile:", err);
    throw err;
  }
};

// Generate email content
const generateEmailContent = (name: string, email: string, temporaryPassword: string, resetLink: string) => {
  return `
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
            <p>Olá ${name || 'Usuário'},</p>
            <p>Sua conta no CRM da Original Digital foi criada com sucesso!</p>
            
            <p>Você pode acessar o sistema com as seguintes credenciais:</p>
            
            <div class="credentials">
              <p><strong>Email:</strong> ${email}</p>
              ${temporaryPassword ? `<p><strong>Senha temporária:</strong> ${temporaryPassword}</p>` : ''}
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
};

// Send email
const sendInvitationEmail = async (email: string, name: string, temporaryPassword: string, resetLink: string) => {
  const emailApiKey = getEnvVar('RESEND_API_KEY');
  console.log("Email API key found with length:", emailApiKey ? emailApiKey.length : 0);
  
  const client = new SmtpClient();

  try {
    await client.connect({
      hostname: "smtp.resend.com",
      port: 465,
      username: "resend",
      password: emailApiKey,
    });
    
    console.log("SMTP connection established");

    const messageContent = generateEmailContent(name, email, temporaryPassword, resetLink);

    const info = await client.send({
      from: "CRM Original Digital <crm@originaldigital.com.br>",
      to: email,
      subject: "Bem-vindo ao CRM da Original Digital",
      content: messageContent,
      html: messageContent,
    });

    await client.close();
    
    console.log("Email sent successfully:", info);
    return info;
  } catch (emailError: any) {
    console.error("Error sending email:", emailError);
    console.error("Email error details:", JSON.stringify(emailError, null, 2));
    throw new Error(`Erro ao enviar email: ${emailError.message}`);
  }
};

// Send WhatsApp message (optional)
const sendWhatsAppMessage = async (phone: string, name: string) => {
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
};

// Main handler
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

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
    
    // Get request body and log it
    const requestBody = await req.json();
    console.log("Received invitation request with data:", {
      email: requestBody.email,
      name: requestBody.name,
      role: requestBody.role,
      company: requestBody.company,
      password: requestBody.password ? "***PROVIDED***" : "NOT_PROVIDED"
    });
    
    const { 
      email, 
      name, 
      company, 
      password, 
      role, 
      position, 
      phone,
      send_whatsapp = false  
    } = requestBody;
    
    // Validate required fields
    const validationError = validateRequestData(requestBody);
    if (validationError) {
      return new Response(
        JSON.stringify({ error: validationError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Initialize Supabase client
    const supabase = initSupabaseClient();
    
    // Check if user already exists
    const existingUsers = await checkExistingUser(supabase, email);
    
    let userId;
    let temporaryPassword = '';
    
    // If user doesn't exist, create them
    if (!existingUsers?.users.length) {
      const { userData, temporaryPassword: tempPwd } = await createAuthUser(supabase, email, password, name, company);
      userId = userData.user.id;
      temporaryPassword = tempPwd;
      console.log(`Auth user created with ID ${userId}`);
      
      // Create user profile
      await createUserProfile(supabase, userId, email, name, role, position, phone);
    } else {
      // User already exists
      userId = existingUsers.users[0].id;
      console.log(`User already exists with ID: ${userId}`);
      
      // Generate new temporary password if requested
      if (password) {
        temporaryPassword = password;
      } else {
        console.log("No reset password requested for existing user");
      }
    }
    
    // Create reset link
    const resetLink = `${applicationUrl}/reset-password`;
    console.log("Generated reset link:", resetLink);
    
    // Send email
    console.log(`Sending invitation email to ${email}`);
    await sendInvitationEmail(email, name, temporaryPassword, resetLink);
    
    // If WhatsApp message is requested, send it
    if (send_whatsapp && phone) {
      await sendWhatsAppMessage(phone, name);
    }

    return new Response(
      JSON.stringify({ success: true, userId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error("Error sending invitation:", error);
    console.error("Stack trace:", error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro ao enviar convite',
        stack: error.stack || 'No stack trace available'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
