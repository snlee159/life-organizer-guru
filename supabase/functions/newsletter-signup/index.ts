import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = Deno.env.get("ALLOWED_ORIGINS")?.split(",") || [];

function normalizeOrigin(origin: string): string {
  // Remove trailing slash and normalize
  return origin.replace(/\/$/, "").toLowerCase();
}

function checkCORS(req: Request): { allowed: boolean; origin: string | null } {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  // If no allowed origins configured, allow all (for development)
  if (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS[0] === "") {
    console.log("CORS: No origins configured, allowing all");
    return { allowed: true, origin: origin || "*" };
  }

  // Debug logging
  console.log("CORS Check:", {
    origin,
    referer,
    allowedOrigins: ALLOWED_ORIGINS,
    normalizedAllowed: ALLOWED_ORIGINS.map(normalizeOrigin),
  });

  if (!origin) {
    // No origin header - check referer as fallback
    if (referer) {
      try {
        const refererOrigin = normalizeOrigin(new URL(referer).origin);
        const normalizedAllowed = ALLOWED_ORIGINS.map(normalizeOrigin);
        console.log(
          "Checking referer:",
          refererOrigin,
          "against",
          normalizedAllowed,
        );
        if (normalizedAllowed.includes(refererOrigin)) {
          return { allowed: true, origin: new URL(referer).origin };
        }
      } catch (e) {
        console.error("Invalid referer URL:", e);
      }
    }
    console.log("CORS: No origin or referer match");
    return { allowed: false, origin: null };
  }

  // Normalize and check origin
  const normalizedOrigin = normalizeOrigin(origin);
  const normalizedAllowed = ALLOWED_ORIGINS.map(normalizeOrigin);

  console.log("Comparing:", normalizedOrigin, "against", normalizedAllowed);

  if (normalizedAllowed.includes(normalizedOrigin)) {
    console.log("CORS: Origin allowed");
    return { allowed: true, origin };
  }

  // Also check if origin contains any of the allowed origins (more permissive)
  for (const allowed of normalizedAllowed) {
    if (
      normalizedOrigin.includes(allowed) ||
      allowed.includes(normalizedOrigin)
    ) {
      console.log("CORS: Origin matched via contains:", allowed);
      return { allowed: true, origin };
    }
  }

  console.log("CORS: Origin not allowed");
  return { allowed: false, origin };
}

function getCORSHeaders(
  allowedOrigin: string | null,
  allowAll: boolean = false,
): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // Always set CORS headers to allow browser to read the response
  if (allowAll || ALLOWED_ORIGINS.length === 0) {
    headers["Access-Control-Allow-Origin"] = "*";
  } else if (allowedOrigin) {
    headers["Access-Control-Allow-Origin"] = allowedOrigin;
  }

  headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
  headers["Access-Control-Allow-Headers"] =
    "Content-Type, Authorization, x-client-info, apikey";
  headers["Access-Control-Allow-Credentials"] = "false";

  return headers;
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsCheck = checkCORS(req);
  const corsHeaders = getCORSHeaders(
    corsCheck.origin,
    ALLOWED_ORIGINS.length === 0,
  );

  // Handle CORS preflight - always allow OPTIONS
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  // Check CORS - but still return CORS headers so browser can read error
  if (!corsCheck.allowed) {
    return new Response(
      JSON.stringify({ error: "Forbidden: Origin not allowed" }),
      { status: 403, headers: corsHeaders },
    );
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      return new Response(JSON.stringify({ error: "Invalid email address" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Get Supabase client with service role key for server-side operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: corsHeaders },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if email already exists
    const { data: existing, error: checkError } = await supabase
      .from("newsletter_subscribers")
      .select("id, subscribed")
      .eq("email", normalizedEmail)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "no rows returned" - that's fine
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    if (existing) {
      // Email exists - check if already subscribed
      if (existing.subscribed) {
        return new Response(
          JSON.stringify({
            error: "You are already subscribed",
            alreadySubscribed: true,
          }),
          { status: 200, headers: corsHeaders },
        );
      } else {
        // Resubscribe in database
        const { error: updateError } = await supabase
          .from("newsletter_subscribers")
          .update({
            subscribed: true,
            updated_at: new Date().toISOString(),
          })
          .eq("email", normalizedEmail);

        if (updateError) {
          return new Response(
            JSON.stringify({ error: "Failed to resubscribe" }),
            { status: 500, headers: corsHeaders },
          );
        }

        // Update contact in Resend (optional - silent fail)
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (resendApiKey) {
          try {
            // Note: Resend API doesn't have a direct "resubscribe" endpoint
            // We need to create the contact again (it will update if exists)
            const resendResponse = await fetch(
              "https://api.resend.com/audiences/882471fc-dc46-4497-8eb0-a71b74fcc5c4/contacts",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${resendApiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  email: normalizedEmail,
                  unsubscribed: false,
                }),
              },
            );

            if (!resendResponse.ok) {
              const errorText = await resendResponse.text();
              console.error("Resend contact update failed:", errorText);
            } else {
              console.log("Contact updated in Resend successfully");
            }
          } catch (resendError) {
            console.error("Resend API error:", resendError);
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: "Welcome back! You have been resubscribed.",
            resubscribed: true,
          }),
          { status: 200, headers: corsHeaders },
        );
      }
    }

    // New subscriber - insert into database
    const { data, error: insertError } = await supabase
      .from("newsletter_subscribers")
      .insert([
        {
          email: normalizedEmail,
          subscribed: true,
        },
      ])
      .select()
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        // Duplicate key (race condition)
        return new Response(
          JSON.stringify({
            error: "You are already subscribed",
            alreadySubscribed: true,
          }),
          { status: 200, headers: corsHeaders },
        );
      }

      return new Response(JSON.stringify({ error: "Failed to subscribe" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    // Add contact to Resend (optional - silent fail)
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      try {
        const resendResponse = await fetch(
          "https://api.resend.com/audiences/882471fc-dc46-4497-8eb0-a71b74fcc5c4/contacts",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: normalizedEmail,
              unsubscribed: false,
            }),
          },
        );

        if (!resendResponse.ok) {
          const errorText = await resendResponse.text();
          console.error("Resend contact creation failed:", errorText);
          // Don't fail the request - database save succeeded
        } else {
          console.log("Contact added to Resend successfully");
        }
      } catch (resendError) {
        console.error("Resend API error:", resendError);
        // Silent fail - database save succeeded
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Thank you for subscribing!",
        data,
      }),
      { status: 200, headers: corsHeaders },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
