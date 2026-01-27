/**
 * Admin Write Edge Function
 * Handles admin write operations (update, delete) with authentication
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

  // Rate limiting: 30 requests per minute
  const clientId = getClientId(req);
  if (!checkRateLimit(clientId, 30, 60 * 1000)) {
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
    const { operation, table, id, data: updateData } = await req.json();

    // Validate table whitelist
    const allowedTables = ['contact_submissions'];
    if (!table || !allowedTables.includes(table)) {
      return new Response(
        JSON.stringify({ error: 'Invalid or unauthorized table' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate operation
    const allowedOperations = ['update', 'delete'];
    if (!operation || !allowedOperations.includes(operation)) {
      return new Response(
        JSON.stringify({ error: 'Invalid operation' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate ID
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'ID is required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    let result;

    if (operation === 'update') {
      // Field whitelist for contact_submissions
      const allowedFields = ['status', 'notes'];
      const filteredData: any = {};
      
      for (const field of allowedFields) {
        if (updateData && updateData[field] !== undefined) {
          filteredData[field] = updateData[field];
        }
      }

      if (Object.keys(filteredData).length === 0) {
        return new Response(
          JSON.stringify({ error: 'No valid fields to update' }),
          { status: 400, headers: corsHeaders }
        );
      }

      // Add updated_at timestamp
      filteredData.updated_at = new Date().toISOString();

      result = await supabase
        .from(table)
        .update(filteredData)
        .eq('id', id)
        .select();

    } else if (operation === 'delete') {
      result = await supabase
        .from(table)
        .delete()
        .eq('id', id);
    }

    if (result.error) {
      console.error('Database error:', result.error);
      return new Response(
        JSON.stringify({ error: 'Operation failed' }),
        { status: 500, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: result.data,
        message: `${operation} completed successfully`
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('Admin write error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
