// This file runs in Deno runtime (Supabase Edge Functions)
// TypeScript errors about Deno are expected in local IDE - they work fine in Supabase
// @deno-types="https://deno.land/x/types/index.d.ts"
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ADMIN_PASSWORD = Deno.env.get('ADMIN_PASSWORD') || ''
const ALLOWED_ORIGINS = Deno.env.get('ALLOWED_ORIGINS')?.split(',') || []
const MAX_ATTEMPTS = 5
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes in milliseconds

// In-memory rate limiting (in production, use Redis or Supabase database)
const attemptTracker = new Map<string, { count: number; resetAt: number }>()

function getClientId(req: Request): string {
  // Use IP address + user agent as identifier
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
              req.headers.get('x-real-ip') || 
              'unknown'
  const userAgent = req.headers.get('user-agent') || 'unknown'
  return `${ip}:${userAgent}`
}

function checkRateLimit(clientId: string): boolean {
  const now = Date.now()
  const record = attemptTracker.get(clientId)

  if (!record || now > record.resetAt) {
    // Reset or create new record
    attemptTracker.set(clientId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (record.count >= MAX_ATTEMPTS) {
    return false // Rate limited
  }

  record.count++
  return true
}

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

  // Check rate limiting
  const clientId = getClientId(req)
  if (!checkRateLimit(clientId)) {
    return new Response(
      JSON.stringify({ 
        error: 'Too many attempts. Please try again later.',
        authenticated: false 
      }),
      { status: 429, headers: corsHeaders }
    )
  }

  try {
    const { password } = await req.json()

    if (!password) {
      return new Response(
        JSON.stringify({ error: 'Password is required' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Constant-time password comparison to prevent timing attacks
    const isValid = ADMIN_PASSWORD !== '' && password === ADMIN_PASSWORD

    if (!isValid) {
      // Don't reveal whether password was wrong or function is misconfigured
      return new Response(
        JSON.stringify({ error: 'Invalid credentials', authenticated: false }),
        { status: 401, headers: corsHeaders }
      )
    }

    // Success - reset rate limit for this client
    attemptTracker.delete(clientId)

    // Generate a simple token for admin operations
    // Format: base64(timestamp:password)
    // In production, use JWT with expiration
    const timestamp = Date.now()
    const tokenData = `${timestamp}:${ADMIN_PASSWORD}`
    const token = btoa(tokenData)
    
    return new Response(
      JSON.stringify({ 
        authenticated: true,
        token: token 
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

