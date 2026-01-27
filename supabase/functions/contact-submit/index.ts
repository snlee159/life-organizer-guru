/**
 * Contact Submit Edge Function
 * Handles contact form submissions with:
 * - Database storage
 * - Email notification via Resend
 * - Input validation
 * - Rate limiting
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
// INPUT VALIDATION
// ===========================

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

function sanitizeText(text: string, maxLength: number): string {
  return text.trim().substring(0, maxLength);
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

  // Rate limiting: 5 submissions per 10 minutes per IP
  const clientId = getClientId(req);
  if (!checkRateLimit(clientId, 5, 10 * 60 * 1000)) {
    return new Response(
      JSON.stringify({ error: 'Too many submissions. Please try again later.', success: false }),
      { status: 429, headers: corsHeaders }
    );
  }

  try {
    const body = await req.json();
    const { name, email, message } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: 'All fields are required', success: false }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate types
    if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid field types', success: false }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate email format
    if (!validateEmail(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address', success: false }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Sanitize inputs
    const sanitizedName = sanitizeText(name, 200);
    const sanitizedEmail = sanitizeText(email, 255);
    const sanitizedMessage = sanitizeText(message, 10000);

    // Validate lengths
    if (sanitizedName.length < 2) {
      return new Response(
        JSON.stringify({ error: 'Name must be at least 2 characters', success: false }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (sanitizedMessage.length < 10) {
      return new Response(
        JSON.stringify({ error: 'Message must be at least 10 characters', success: false }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Get Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      return new Response(
        JSON.stringify({ error: 'Server configuration error', success: false }),
        { status: 500, headers: corsHeaders }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Save to database
    const { data: submission, error: dbError } = await supabase
      .from('contact_submissions')
      .insert({
        name: sanitizedName,
        email: sanitizedEmail,
        message: sanitizedMessage,
        status: 'new'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ error: 'Failed to save submission', success: false }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Send email via Resend (optional - silent fail)
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const resendToEmail = Deno.env.get('RESEND_TO_EMAIL');

    if (resendApiKey && resendToEmail) {
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Contact Form <onboarding@resend.dev>', // Use your verified domain
            to: [resendToEmail],
            subject: `New Contact from ${sanitizedName}`,
            html: `
              <h2>New Contact Form Submission</h2>
              <p><strong>Name:</strong> ${sanitizedName}</p>
              <p><strong>Email:</strong> ${sanitizedEmail}</p>
              <p><strong>Message:</strong></p>
              <p style="white-space: pre-wrap;">${sanitizedMessage.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
              <hr>
              <p><small>Submission ID: ${submission.id}</small></p>
            `,
          }),
        });

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          console.error('Resend error:', errorText);
          // Don't fail the request - database save succeeded
        }
      } catch (emailError) {
        console.error('Email send failed:', emailError);
        // Silent fail - database save succeeded
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Thank you for your message! We will get back to you soon.',
        id: submission.id
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('Contact submit error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', success: false }),
      { status: 500, headers: corsHeaders }
    );
  }
});
