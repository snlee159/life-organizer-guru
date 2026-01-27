/**
 * Newsletter Unsubscribe Edge Function
 * Handles newsletter unsubscription via email parameter
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ===========================
// CORS & ORIGIN CHECKING
// ===========================

function getCorsHeaders(origin: string | null): HeadersInit {
  const allowedOrigins = Deno.env.get("ALLOWED_ORIGINS")?.split(",") || [];
  const allowOrigin =
    allowedOrigins.length === 0
      ? origin || "*"
      : origin && allowedOrigins.some((o) => origin.includes(o.trim()))
        ? origin
        : "null";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json",
  };
}

// ===========================
// RATE LIMITING
// ===========================

const rateLimits = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): boolean {
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
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return ip;
}

// ===========================
// EMAIL VALIDATION
// ===========================

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

// ===========================
// MAIN HANDLER
// ===========================

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  // Rate limiting: 5 unsubscribe requests per 10 minutes per IP
  const clientId = getClientId(req);
  if (!checkRateLimit(clientId, 5, 10 * 60 * 1000)) {
    return new Response(
      JSON.stringify({
        error: "Too many requests. Please try again later.",
        success: false,
      }),
      { status: 429, headers: corsHeaders },
    );
  }

  try {
    const { email } = await req.json();

    // Validate email
    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "Email is required", success: false }),
        { status: 400, headers: corsHeaders },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!validateEmail(normalizedEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address", success: false }),
        { status: 400, headers: corsHeaders },
      );
    }

    // Get Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase configuration");
      return new Response(
        JSON.stringify({ error: "Server configuration error", success: false }),
        { status: 500, headers: corsHeaders },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if email exists
    const { data: existing, error: checkError } = await supabase
      .from("newsletter_subscribers")
      .select("id, subscribed")
      .eq("email", normalizedEmail)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Database error:", checkError);
      return new Response(
        JSON.stringify({ error: "Database error", success: false }),
        { status: 500, headers: corsHeaders },
      );
    }

    if (!existing) {
      // Email not found - still return success (don't reveal if email is in system)
      return new Response(
        JSON.stringify({
          success: true,
          message: "You have been unsubscribed from our newsletter.",
        }),
        { status: 200, headers: corsHeaders },
      );
    }

    if (!existing.subscribed) {
      // Already unsubscribed
      return new Response(
        JSON.stringify({
          success: true,
          message: "You are already unsubscribed from our newsletter.",
          alreadyUnsubscribed: true,
        }),
        { status: 200, headers: corsHeaders },
      );
    }

    // Unsubscribe from database
    const { error: updateError } = await supabase
      .from("newsletter_subscribers")
      .update({
        subscribed: false,
        updated_at: new Date().toISOString(),
      })
      .eq("email", normalizedEmail);

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to unsubscribe", success: false }),
        { status: 500, headers: corsHeaders },
      );
    }

    // Remove contact from Resend (optional - silent fail)
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      try {
        const resendResponse = await fetch(
          "https://api.resend.com/audiences/882471fc-dc46-4497-8eb0-a71b74fcc5c4/contacts",
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: normalizedEmail,
            }),
          },
        );

        if (!resendResponse.ok) {
          const errorText = await resendResponse.text();
          console.error("Resend contact deletion failed:", errorText);
          // Don't fail the request - database update succeeded
        } else {
          console.log("Contact removed from Resend successfully");
        }
      } catch (resendError) {
        console.error("Resend API error:", resendError);
        // Silent fail - database update succeeded
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "You have been successfully unsubscribed from our newsletter.",
      }),
      { status: 200, headers: corsHeaders },
    );
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", success: false }),
      { status: 500, headers: corsHeaders },
    );
  }
});
