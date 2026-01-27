/**
 * Admin Data Edge Function
 * Handles reading admin data (subscribers, contact submissions, etc.)
 * Requires admin password authentication
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ===========================
// PBKDF2 PASSWORD VERIFICATION
// ===========================

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const parts = storedHash.split("$");
    if (parts.length !== 3) return false;
    
    const [iterationsStr, saltBase64, hashBase64] = parts;
    const iterations = parseInt(iterationsStr, 10);
    if (isNaN(iterations)) return false;
    
    const salt = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0));
    const storedHashBytes = Uint8Array.from(atob(hashBase64), c => c.charCodeAt(0));
    
    const passwordBuffer = new TextEncoder().encode(password);
    const key = await crypto.subtle.importKey("raw", passwordBuffer, { name: "PBKDF2" }, false, ["deriveBits"]);
    
    const hashBuffer = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt: salt, iterations: iterations, hash: "SHA-256" },
      key,
      storedHashBytes.length * 8
    );
    
    const hashBytes = new Uint8Array(hashBuffer);
    if (hashBytes.length !== storedHashBytes.length) return false;
    
    let diff = 0;
    for (let i = 0; i < hashBytes.length; i++) {
      diff |= hashBytes[i] ^ storedHashBytes[i];
    }
    
    return diff === 0;
  } catch (error) {
    console.error("Error verifying password:", error);
    return false;
  }
}

// ===========================
// CORS & ORIGIN CHECKING
// ===========================

function getCorsHeaders(origin: string | null): HeadersInit {
  const allowedOrigins = Deno.env.get("ALLOWED_ORIGINS")?.split(",") || [];
  const allowOrigin = allowedOrigins.length === 0 
    ? (origin || "*")
    : (origin && allowedOrigins.some(o => origin.includes(o.trim()))) 
      ? origin 
      : "null";
      
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-password",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json",
  };
}

// ===========================
// RATE LIMITING
// ===========================

const rateLimits = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimits.get(key);
  
  if (!entry || now > entry.resetTime) {
    rateLimits.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (entry.count >= maxRequests) {
    return false;
  }
  
  entry.count++;
  return true;
}

function getClientId(req: Request): string {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
             req.headers.get('x-real-ip') || 
             'unknown';
  return ip;
}

// ===========================
// ADMIN AUTHENTICATION
// ===========================

async function verifyAdminAuth(req: Request, supabase: any): Promise<boolean> {
  const adminPassword = req.headers.get('x-admin-password');
  
  if (!adminPassword) {
    return false;
  }

  // Fetch stored password hash
  const { data, error } = await supabase
    .from('admin_password')
    .select('password_hash')
    .eq('id', 1)
    .single();

  if (error || !data) {
    console.error('Failed to fetch password hash:', error);
    return false;
  }

  return await verifyPassword(adminPassword, data.password_hash);
}

// ===========================
// MAIN HANDLER
// ===========================

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: corsHeaders }
    );
  }

  // Rate limiting: 60 requests per minute
  const clientId = getClientId(req);
  if (!checkRateLimit(clientId, 60, 60 * 1000)) {
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      { status: 429, headers: corsHeaders }
    );
  }

  try {
    // Get Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: corsHeaders }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin authentication
    const isAdmin = await verifyAdminAuth(req, supabase);
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', authenticated: false }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Parse request body
    const { resource, filters } = await req.json();

    // Validate resource
    const allowedResources = ['subscribers', 'contact_submissions'];
    if (!resource || !allowedResources.includes(resource)) {
      return new Response(
        JSON.stringify({ error: 'Invalid resource' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Fetch data based on resource
    let data, error;

    if (resource === 'subscribers') {
      const query = supabase
        .from('newsletter_subscribers')
        .select('*')
        .eq('subscribed', true)
        .order('created_at', { ascending: false });

      const result = await query;
      data = result.data;
      error = result.error;

    } else if (resource === 'contact_submissions') {
      const query = supabase
        .from('contact_submissions')
        .select('*')
        .order('submitted_at', { ascending: false });

      // Apply filters if provided
      if (filters?.status) {
        query.eq('status', filters.status);
      }

      const result = await query;
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch data' }),
        { status: 500, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ data, success: true }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('Admin data error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
