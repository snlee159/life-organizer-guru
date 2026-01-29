import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = Deno.env.get("ALLOWED_ORIGINS")?.split(",") || [];

function getWelcomeEmailHtml(
  logoUrl: string,
  heroImageUrl: string,
  baseUrl: string,
  unsubscribeUrl: string,
): string {
  const notionUrl = "https://www.notion.com/@lifeorganizerguru";
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Life Organizer Guru</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:wght@500;600;700&display=swap');
        body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 400; background-color: #fafafa; color: #1f1d1a; line-height: 1.65; }
        .email-wrapper { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { position: relative; width: 100%; height: 320px; background-size: cover; background-position: center; background-repeat: no-repeat; }
        .header-overlay { width: 100%; height: 100%; background: rgba(61, 57, 51, 0.65); display: table; }
        .header-content { display: table-cell; vertical-align: middle; text-align: center; padding: 40px 20px; }
        .logo { width: 72px; height: 72px; margin: 0 auto 20px auto; display: block; background: white; border-radius: 50%; padding: 4px; }
        .header-title { font-family: 'Playfair Display', Georgia, serif; font-size: 42px; font-weight: 700; color: #ffffff; margin: 0; letter-spacing: -0.02em; text-shadow: 0 2px 12px rgba(0, 0, 0, 0.4); }
        .header-subtitle { font-size: 17px; color: rgba(255, 255, 255, 0.95); margin-top: 10px; font-weight: 400; letter-spacing: 0.01em; text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3); }
        .content { padding: 48px 36px; }
        .welcome-text { font-size: 17px; color: #3d3933; margin-bottom: 20px; line-height: 1.7; font-weight: 400; }
        .section { margin: 40px 0; }
        .section-title { font-family: 'Playfair Display', Georgia, serif; font-size: 26px; font-weight: 600; color: #1f1d1a; margin: 0 0 20px 0; letter-spacing: -0.01em; }
        .glass-box { background: #f7f6f5; padding: 28px; border-radius: 10px; margin: 24px 0; border: 1px solid rgba(61, 57, 51, 0.06); }
        .glass-box-light { background: #fafafa; padding: 28px; border-radius: 10px; margin: 24px 0; border: 1px solid rgba(61, 57, 51, 0.05); }
        .tips-list { list-style: none; padding: 0; margin: 0; }
        .tips-list li { padding: 18px 0; border-bottom: 1px solid rgba(61, 57, 51, 0.06); color: #3d3933; line-height: 1.65; font-size: 16px; }
        .tips-list li:first-child { padding-top: 0; }
        .tips-list li:last-child { border-bottom: none; padding-bottom: 0; }
        .tips-list li strong { font-weight: 600; color: #1f1d1a; font-size: 17px; }
        .coupon-container { display: flex; gap: 16px; margin: 24px 0; }
        .coupon-box { flex: 1; background: linear-gradient(135deg, #fef9f0 0%, #fef6e8 100%); padding: 24px 20px; border-radius: 10px; text-align: center; border: 1px solid rgba(232, 168, 85, 0.15); }
        .coupon-label { font-size: 12px; color: #7a7265; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }
        .coupon-code { font-family: 'Inter', sans-serif; font-size: 22px; font-weight: 700; color: #1f1d1a; letter-spacing: 0.08em; margin: 6px 0; }
        .coupon-description { font-size: 13px; color: #5c564d; font-weight: 400; margin-top: 8px; line-height: 1.4; }
        .cta-button { display: inline-block; padding: 14px 28px; background: rgba(61, 57, 51, 0.95); backdrop-filter: blur(10px); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 16px 8px 0 8px; }
        .about-text { font-size: 16px; color: #5c564d; line-height: 1.75; margin-bottom: 16px; }
        .about-box { background: #f9f8f7; padding: 28px; border-radius: 10px; margin: 24px 0; border: 1px solid rgba(61, 57, 51, 0.05); }
        .footer { background: rgba(61, 57, 51, 0.97); padding: 40px 36px; text-align: center; color: #f5f3f0; }
        .footer-title { font-family: 'Playfair Display', Georgia, serif; font-size: 20px; font-weight: 600; margin-bottom: 8px; }
        .footer-tagline { font-size: 14px; color: rgba(245, 243, 240, 0.8); margin-bottom: 24px; font-weight: 300; }
        .social-links { display: flex; justify-content: center; gap: 24px; margin: 24px 0; flex-wrap: wrap; }
        .social-links a { color: rgba(245, 243, 240, 0.9); text-decoration: none; font-size: 14px; font-weight: 500; }
        .footer-links { display: flex; justify-content: center; gap: 20px; margin: 20px 0; flex-wrap: wrap; }
        .footer-links a { color: #f1c178; text-decoration: none; font-size: 14px; }
        .unsubscribe { margin-top: 28px; padding-top: 28px; border-top: 1px solid rgba(255, 255, 255, 0.1); font-size: 12px; color: rgba(245, 243, 240, 0.6); line-height: 1.6; }
        .unsubscribe a { color: rgba(245, 243, 240, 0.7); text-decoration: underline; }
        @media only screen and (max-width: 600px) {
            .header { height: 280px; }
            .header-content { padding: 32px 20px; }
            .logo { width: 60px; height: 60px; margin-bottom: 16px; }
            .header-title { font-size: 34px; }
            .header-subtitle { font-size: 15px; }
            .content { padding: 36px 24px; }
            .section-title { font-size: 24px; }
            .glass-box, .glass-box-light, .about-box { padding: 20px; }
            .coupon-container { flex-direction: column; }
            .footer { padding: 32px 24px; }
            .social-links { gap: 16px; }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="header" style="background-image: url('${heroImageUrl}');">
            <div class="header-overlay">
                <div class="header-content">
                    <img src="${logoUrl}" alt="Life Organizer Guru" class="logo" width="72" height="72" style="filter: brightness(0) invert(1);">
                    <h1 class="header-title">Life Organizer Guru</h1>
                    <p class="header-subtitle">Welcome to Your Organized Life</p>
                </div>
            </div>
        </div>
        <div class="content">
            <p class="welcome-text">
                <strong>Welcome to the Life Organizer Guru family!</strong>
            </p>
            <p class="welcome-text">
                I'm thrilled to have you here. You've just taken the first step toward transforming your life through intentional organization. Get ready to master productivity, reduce stress, and create harmony across every aspect of your life.
            </p>
            <div class="section">
                <h2 class="section-title">What to Expect from This Newsletter</h2>
                <div class="glass-box-light">
                    <p style="color: #3d3933; line-height: 1.7; margin: 0 0 16px 0; font-size: 16px;">
                        Every week, I'll send you curated insights, actionable tips, and exclusive resources to help you:
                    </p>
                    <ul style="color: #3d3933; line-height: 1.8; margin: 0; padding-left: 24px; font-size: 16px;">
                        <li style="margin-bottom: 8px;">Master productivity systems that actually work</li>
                        <li style="margin-bottom: 8px;">Declutter your mind, space, and schedule</li>
                        <li style="margin-bottom: 8px;">Build sustainable organizational habits</li>
                        <li style="margin-bottom: 8px;">Access new templates and tools first</li>
                        <li>Get exclusive discounts on products and services</li>
                    </ul>
                </div>
            </div>
            <div class="section">
                <h2 class="section-title">My Top 3 Organization Tips</h2>
                <div class="glass-box">
                    <ul class="tips-list">
                        <li>
                            <strong>1. Start with the "One Touch" Rule</strong><br>
                            Handle each item, task, or email only once. Instead of reading an email and marking it for later, respond immediately, delegate it, or delete it. This simple rule prevents overwhelming backlogs and keeps you moving forward with clarity.
                        </li>
                        <li>
                            <strong>2. Create a "Brain Dump" Ritual</strong><br>
                            Set aside 10 minutes each evening to write down everything on your mind—tasks, worries, ideas. This clears mental clutter, reduces anxiety, and helps you wake up with a focused mindset.
                        </li>
                        <li>
                            <strong>3. Design Your Environment for Success</strong><br>
                            Your physical space shapes your mental state. Remove visual clutter, create designated zones for different activities, and make your most important tools easily accessible. An organized environment naturally leads to organized thinking.
                        </li>
                    </ul>
                </div>
            </div>
            <div class="section">
                <h2 class="section-title">Your Exclusive Welcome Gifts</h2>
                <div class="coupon-container">
                    <div class="coupon-box">
                        <div class="coupon-label">Notion Templates</div>
                        <div class="coupon-code">WELCOME50</div>
                        <div class="coupon-description">50% off any template</div>
                    </div>
                    <div class="coupon-box">
                        <div class="coupon-label">Consulting</div>
                        <div class="coupon-code">CONSULT20</div>
                        <div class="coupon-description">20% off first session</div>
                    </div>
                </div>
                <p style="text-align: center; margin: 24px 0 8px 0;">
                    <a href="${notionUrl}" class="cta-button">Browse Templates</a>
                    <a href="${baseUrl}/services" class="cta-button">Book Consultation</a>
                </p>
            </div>
            <div class="section">
                <h2 class="section-title">About Life Organizer Guru</h2>
                <div class="about-box">
                    <p class="about-text" style="margin-bottom: 16px;">
                        Life Organizer Guru is dedicated to helping individuals transform chaos into clarity. Through curated Notion templates, comprehensive guides, and personalized consulting services, I provide practical, actionable solutions for organizing every aspect of your life—from personal productivity and business operations to relationships and home management.
                    </p>
                    <p class="about-text" style="margin-bottom: 0;">
                        My approach is holistic: true organization isn't just about tidy desks and color-coded calendars. It's about creating systems that reduce stress, amplify focus, and help you live with intention. Whether you're a busy professional, entrepreneur, parent, or anyone seeking more harmony, I'm here to guide you on your journey to a more organized life.
                    </p>
                </div>
            </div>
            <p class="welcome-text" style="margin-top: 40px;">
                Thank you for trusting me to be part of your organizational journey. I can't wait to see the transformation ahead!
            </p>
            <p class="welcome-text">
                To your organized success,<br>
                <strong>Life Organizer Guru</strong>
            </p>
        </div>
        <div class="footer">
            <div class="footer-title">Life Organizer Guru</div>
            <div class="footer-tagline">Transform your life through intentional organization</div>
            <div class="social-links">
                <a href="https://linkedin.com">LinkedIn</a>
                <a href="https://twitter.com">Twitter</a>
                <a href="https://threads.net">Threads</a>
                <a href="https://instagram.com">Instagram</a>
                <a href="https://medium.com">Medium</a>
            </div>
            <div class="footer-links">
                <a href="${baseUrl}">Visit Website</a>
                <a href="${notionUrl}">Notion Templates</a>
                <a href="${baseUrl}/services">Services</a>
                <a href="${baseUrl}/contact">Contact</a>
            </div>
            <div class="unsubscribe">
                You're receiving this email because you subscribed to Life Organizer Guru's newsletter.<br>
                <a href="${unsubscribeUrl}">Unsubscribe</a>
            </div>
        </div>
    </div>
</body>
</html>`;
}

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

        // Update contact in Resend and send welcome email
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        const baseUrl = Deno.env.get("BASE_URL") || "https://lifeorganizerguru.com";
        const logoUrl = `${baseUrl}/favicon.svg`;
        const heroImageUrl = `${baseUrl}/hero-background.png`;
        
        if (resendApiKey) {
          try {
            // Update contact in audience
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

            // Send welcome email
            const unsubscribeUrl = `${baseUrl}/unsubscribe?email=${encodeURIComponent(normalizedEmail)}`;
            const welcomeEmailHtml = getWelcomeEmailHtml(
              logoUrl,
              heroImageUrl,
              baseUrl,
              unsubscribeUrl,
            );

            const emailResponse = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${resendApiKey}`,
              },
              body: JSON.stringify({
                from: "Life Organizer Guru <newsletter@lifeorganizerguru.com>",
                to: normalizedEmail,
                subject: "Welcome Back to Life Organizer Guru - Your Exclusive Gifts Inside! 🎁",
                html: welcomeEmailHtml,
              }),
            });

            if (!emailResponse.ok) {
              const errorText = await emailResponse.text();
              console.error("Failed to send welcome email:", errorText);
            } else {
              console.log("Welcome email sent successfully");
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

    // Add contact to Resend and send welcome email
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const baseUrl = Deno.env.get("BASE_URL") || "https://lifeorganizerguru.com";
    const logoUrl = `${baseUrl}/favicon.svg`;
    const heroImageUrl = `${baseUrl}/hero-background.png`;
    
    if (resendApiKey) {
      try {
        // Add to audience
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
        } else {
          console.log("Contact added to Resend successfully");
        }

        // Send welcome email
        const unsubscribeUrl = `${baseUrl}/unsubscribe?email=${encodeURIComponent(normalizedEmail)}`;
        const welcomeEmailHtml = getWelcomeEmailHtml(
          logoUrl,
          heroImageUrl,
          baseUrl,
          unsubscribeUrl,
        );

        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "Life Organizer Guru <newsletter@lifeorganizerguru.com>",
            to: normalizedEmail,
            subject: "Welcome to Life Organizer Guru - Your Exclusive Gifts Inside! 🎁",
            html: welcomeEmailHtml,
          }),
        });

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          console.error("Failed to send welcome email:", errorText);
        } else {
          console.log("Welcome email sent successfully");
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
