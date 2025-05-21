
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "npm:resend@2.0.0";

// Obter variáveis de ambiente
const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Inicializar clientes
const resend = new Resend(resendApiKey);
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configurar cabeçalhos CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface InviteRequest {
  email: string;
  name: string;
  role: string;
  position?: string;
  invitedBy: {
    name: string;
    email: string;
  };
}

serve(async (req: Request) => {
  console.log("Received request:", req.method);
  console.log("RESEND API Key available:", !!resendApiKey);
  
  // Tratar requisições de preflight CORS
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS/preflight request");
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { email, name, role, position, invitedBy }: InviteRequest = await req.json();
    console.log(`Processing invitation for ${email}`);

    // Gerar senha temporária
    const tempPassword = Array(10)
      .fill("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz")
      .map(x => x[Math.floor(Math.random() * x.length)])
      .join("");

    // Criar o usuário no Supabase Auth
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { 
        name, 
        role,
        position,
        invited_by: invitedBy.email
      },
    });

    if (userError) {
      console.error("Error creating user:", userError);
      return new Response(
        JSON.stringify({ success: false, error: userError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Atualizar informações adicionais na tabela public.users
    const { error: updateError } = await supabase
      .from("users")
      .update({
        phone: null,
        position: position || null,
        last_temp_password: tempPassword
      })
      .eq("id", userData.user.id);

    if (updateError) {
      console.error("Error updating user data:", updateError);
    }

    // Enviar email de convite usando Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Original Digital <contato@originaldigital.com.br>",
      to: email,
      subject: "Convite para o CRM da Original Digital",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
            <h1>Original Digital CRM</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
            <p>Olá ${name},</p>
            <p>Você foi convidado por <strong>${invitedBy.name}</strong> para participar do CRM da Original Digital.</p>
            <p>Seus dados de acesso são:</p>
            <p>
              <strong>Email:</strong> ${email}<br>
              <strong>Senha temporária:</strong> ${tempPassword}<br>
              <strong>Função:</strong> ${role === 'admin' ? 'Administrador' : role === 'user' ? 'Funcionário' : 'Cliente'}
            </p>
            <div style="margin: 30px 0; text-align: center;">
              <a href="https://crm.originaldigital.com.br/login" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
                Acessar o CRM
              </a>
            </div>
            <p>Você deverá alterar sua senha no primeiro acesso.</p>
            <p>Atenciosamente,<br>Equipe Original Digital</p>
          </div>
        </div>
      `,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      return new Response(
        JSON.stringify({
          success: true,
          user: userData.user,
          emailSent: false,
          error: "Email could not be sent",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Invitation sent successfully for:", email);
    return new Response(
      JSON.stringify({
        success: true,
        user: userData.user,
        emailSent: true,
        email: emailData,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error processing invitation:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
