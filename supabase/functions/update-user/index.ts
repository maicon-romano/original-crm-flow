
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

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
    // Get the request body
    const { id, name, email, phone, position, role, active } = await req.json();
    
    // Check if required fields are provided
    if (!id || !name || !email || !role) {
      return new Response(
        JSON.stringify({ error: 'Required fields missing' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }
    
    // Initialize Supabase client with service role (admin) privileges
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Update user profile
    const { error } = await supabase
      .from('users')
      .update({
        name,
        email,
        phone,
        position,
        role,
        active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) {
      throw error;
    }
    
    return new Response(
      JSON.stringify({ success: true, message: 'User updated successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error updating user:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to update user' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
