/**
 * Auth Verify Edge Function
 * Verifies admin password using PBKDF2-HMAC-SHA256
 * Returns authentication status and session token
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ===========================
// PBKDF2 PASSWORD VERIFICATION
// ===========================

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const parts = storedHash.split("$");
    if (parts.length !== 3) {
      console.error("Invalid hash format");
      return false;
    }
    
    const [iterationsStr, saltBase64, hashBase64] = parts;
    const iterations = parseInt(iterationsStr, 10);
    
    if (isNaN(iterations) || iterations < 1000) {
      console.error("Invalid iterations");
      return false;
    }
    
    // Decode salt and stored hash from base64
    const salt = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0));
    const storedHashBytes = Uint8Array.from(atob(hashBase64), c => c.charCodeAt(0));
    
    // Derive key from password using PBKDF2
    const passwordBuffer = new TextEncoder().encode(password);
    const key = await crypto.subtle.importKey(
      "raw",
      passwordBuffer,
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );
    
    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: iterations,
        hash: "SHA-256"
      },
      key,
      storedHashBytes.length * 8
    );
    
    const hashBytes = new Uint8Array(hashBuffer);
    
    // Constant-time comparison to prevent timing attacks
    if (hashBytes.length !== storedHashBytes.length) {
      return false;
    }
    
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
  const userAgent = req.headers.get('user-agent') || 'unknown';
  return `${ip}:${userAgent.substring(0, 50)}`;
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

  // Rate limiting: 10 attempts per 5 minutes
  const clientId = getClientId(req);
  if (!checkRateLimit(clientId, 10, 5 * 60 * 1000)) {
    return new Response(
      JSON.stringify({ error: 'Too many attempts. Please try again later.', valid: false }),
      { status: 429, headers: corsHeaders }
    );
  }

  try {
    const { password } = await req.json();

    // Validate input
    if (!password || typeof password !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Password is required', valid: false }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (password.length > 1000) {
      return new Response(
        JSON.stringify({ error: 'Invalid password', valid: false }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Get Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      return new Response(
        JSON.stringify({ error: 'Server configuration error', valid: false }),
        { status: 500, headers: corsHeaders }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch stored password hash from database
    const { data, error } = await supabase
      .from('admin_password')
      .select('password_hash')
      .eq('id', 1)
      .single();

    if (error || !data) {
      console.error('Failed to fetch password hash:', error);
      return new Response(
        JSON.stringify({ error: 'Authentication failed', valid: false }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Verify password using PBKDF2
    const isValid = await verifyPassword(password, data.password_hash);

    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid password', valid: false }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Success - generate simple session token
    // In production, consider using JWT with expiration
    const token = btoa(`${Date.now()}:${password.substring(0, 8)}`);

    return new Response(
      JSON.stringify({ 
        valid: true, 
        authenticated: true,
        message: 'Authentication successful',
        token
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('Auth error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', valid: false }),
      { status: 500, headers: corsHeaders }
    );
  }
});
