import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGINS = Deno.env.get('ALLOWED_ORIGINS')?.split(',') || []
const ADMIN_PASSWORD = Deno.env.get('ADMIN_PASSWORD') || ''

function normalizeOrigin(origin: string): string {
  // Remove trailing slash and normalize
  return origin.replace(/\/$/, '').toLowerCase()
}

function checkCORS(req: Request): { allowed: boolean; origin: string | null } {
  const origin = req.headers.get('origin')
  
  // If no allowed origins configured, allow all (for development)
  if (ALLOWED_ORIGINS.length === 0) {
    return { allowed: true, origin }
  }

  if (!origin) {
    // No origin header - might be a same-origin request or missing header
    // Check referer as fallback
    const referer = req.headers.get('referer')
    if (referer) {
      try {
        const refererOrigin = normalizeOrigin(new URL(referer).origin)
        const normalizedAllowed = ALLOWED_ORIGINS.map(normalizeOrigin)
        if (normalizedAllowed.includes(refererOrigin)) {
          return { allowed: true, origin: new URL(referer).origin }
        }
      } catch {
        // Invalid referer URL, ignore
      }
    }
    return { allowed: false, origin: null }
  }

  // Normalize and check origin
  const normalizedOrigin = normalizeOrigin(origin)
  const normalizedAllowed = ALLOWED_ORIGINS.map(normalizeOrigin)
  
  if (normalizedAllowed.includes(normalizedOrigin)) {
    return { allowed: true, origin }
  }

  // Also check referer header as fallback
  const referer = req.headers.get('referer')
  if (referer) {
    try {
      const refererOrigin = normalizeOrigin(new URL(referer).origin)
      if (normalizedAllowed.includes(refererOrigin)) {
        return { allowed: true, origin: new URL(referer).origin }
      }
    } catch {
      // Invalid referer URL, ignore
    }
  }

  return { allowed: false, origin }
}

function getCORSHeaders(allowedOrigin: string | null, allowAll: boolean = false): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  // Always set CORS headers to allow browser to read the response
  if (allowAll || ALLOWED_ORIGINS.length === 0) {
    headers['Access-Control-Allow-Origin'] = '*'
  } else if (allowedOrigin) {
    headers['Access-Control-Allow-Origin'] = allowedOrigin
  }
  
  headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
  headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, x-client-info, apikey'
  headers['Access-Control-Allow-Credentials'] = 'false'

  return headers
}

serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsCheck = checkCORS(req)
  const corsHeaders = getCORSHeaders(corsCheck.origin, ALLOWED_ORIGINS.length === 0)

  // Handle CORS preflight - always allow OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: corsHeaders }
    )
  }

  // Check CORS - but still return CORS headers so browser can read error
  if (!corsCheck.allowed) {
    return new Response(
      JSON.stringify({ error: 'Forbidden: Origin not allowed' }),
      { status: 403, headers: corsHeaders }
    )
  }

  try {
    const { email, adminToken } = await req.json()

    // Require admin authentication token - must authenticate via admin-auth first
    if (!adminToken) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin authentication required. Please log in as admin first.' }),
        { status: 401, headers: corsHeaders }
      )
    }

    // Verify admin authentication token
    try {
      const decoded = atob(adminToken)
      const [timestamp, password] = decoded.split(':')
      
      // Verify password matches and token is not too old (24 hours)
      const tokenAge = Date.now() - parseInt(timestamp)
      const maxAge = 24 * 60 * 60 * 1000 // 24 hours
      
      if (!password || password !== ADMIN_PASSWORD || tokenAge > maxAge || tokenAge < 0) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Invalid or expired admin token. Please log in again.' }),
          { status: 401, headers: corsHeaders }
        )
      }
    } catch {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid admin token format' }),
        { status: 401, headers: corsHeaders }
      )
    }

    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Get Supabase client with service role key for server-side operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: corsHeaders }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if email already exists
    const { data: existing, error: checkError } = await supabase
      .from('newsletter_subscribers')
      .select('id, subscribed')
      .eq('email', normalizedEmail)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" - that's fine
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: corsHeaders }
      )
    }

    if (existing) {
      // Email exists - check if already subscribed
      if (existing.subscribed) {
        return new Response(
          JSON.stringify({ 
            error: 'You are already subscribed',
            alreadySubscribed: true 
          }),
          { status: 200, headers: corsHeaders }
        )
      } else {
        // Resubscribe
        const { error: updateError } = await supabase
          .from('newsletter_subscribers')
          .update({ 
            subscribed: true,
            updated_at: new Date().toISOString()
          })
          .eq('email', normalizedEmail)

        if (updateError) {
          return new Response(
            JSON.stringify({ error: 'Failed to resubscribe' }),
            { status: 500, headers: corsHeaders }
          )
        }

        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'Welcome back! You have been resubscribed.',
            resubscribed: true
          }),
          { status: 200, headers: corsHeaders }
        )
      }
    }

    // New subscriber - insert
    const { data, error: insertError } = await supabase
      .from('newsletter_subscribers')
      .insert([{ 
        email: normalizedEmail, 
        subscribed: true 
      }])
      .select()
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        // Duplicate key (race condition)
        return new Response(
          JSON.stringify({ 
            error: 'You are already subscribed',
            alreadySubscribed: true 
          }),
          { status: 200, headers: corsHeaders }
        )
      }

      return new Response(
        JSON.stringify({ error: 'Failed to subscribe' }),
        { status: 500, headers: corsHeaders }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Thank you for subscribing!',
        data
      }),
      { status: 200, headers: corsHeaders }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    )
  }
})

