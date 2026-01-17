import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGINS = Deno.env.get('ALLOWED_ORIGINS')?.split(',') || []
const ADMIN_PASSWORD = Deno.env.get('ADMIN_PASSWORD') || ''

function checkCORS(req: Request): boolean {
  const origin = req.headers.get('origin')
  
  // If no allowed origins configured, allow all (for development)
  if (ALLOWED_ORIGINS.length === 0) {
    return true
  }

  // Check if origin is allowed
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return true
  }

  // Also check referer header as fallback
  const referer = req.headers.get('referer')
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin
      if (ALLOWED_ORIGINS.includes(refererOrigin)) {
        return true
      }
    } catch {
      // Invalid referer URL, ignore
    }
  }

  return false
}

function getCORSHeaders(origin: string | null): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (origin && (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin))) {
    headers['Access-Control-Allow-Origin'] = origin
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
    headers['Access-Control-Allow-Headers'] = 'Content-Type'
  }

  return headers
}

serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCORSHeaders(origin)

  // Handle CORS preflight
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

  // Check CORS
  if (!checkCORS(req)) {
    return new Response(
      JSON.stringify({ error: 'Forbidden: Origin not allowed' }),
      { status: 403, headers: corsHeaders }
    )
  }

  try {
    const { email, adminToken } = await req.json()

    // Verify admin authentication token before allowing database writes
    if (!adminToken) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin authentication required' }),
        { status: 401, headers: corsHeaders }
      )
    }

    // Verify token format and extract timestamp
    try {
      const decoded = atob(adminToken)
      const [timestamp, password] = decoded.split(':')
      
      // Verify password matches and token is not too old (24 hours)
      const tokenAge = Date.now() - parseInt(timestamp)
      const maxAge = 24 * 60 * 60 * 1000 // 24 hours
      
      if (!password || password !== ADMIN_PASSWORD || tokenAge > maxAge || tokenAge < 0) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Invalid or expired admin token' }),
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

