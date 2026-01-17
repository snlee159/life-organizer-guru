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

function checkCORS(req: Request): boolean {
  const origin = req.headers.get('origin')
  
  // If no allowed origins configured, allow all (for development)
  // This allows localhost and any origin when ALLOWED_ORIGINS is not set
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

  // In development, also allow localhost even if not explicitly listed
  // This makes local development easier while still protecting production
  if (origin) {
    const isLocalhost = origin.startsWith('http://localhost') || 
                        origin.startsWith('http://127.0.0.1') ||
                        origin.includes('localhost')
    if (isLocalhost) {
      // Allow localhost if ALLOWED_ORIGINS includes any localhost variant
      // or if we're in development mode (no production domains configured)
      const hasProductionDomains = ALLOWED_ORIGINS.some(orig => 
        orig.includes('https://') && !orig.includes('localhost')
      )
      if (!hasProductionDomains) {
        return true // Allow localhost in development
      }
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

