#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read

/**
 * Send HTML Email Template to Multiple Recipients from File
 *
 * Usage:
 *   1. Create a text file with one email per line (e.g., emails.txt)
 *   2. Set RESEND_API_KEY environment variable
 *   3. Run: deno run --allow-env --allow-net --allow-read send-template-email.ts emails.txt
 */

// Configuration
const RESEND_API_KEY = "re_3McmgkHb_4svDwcooCCm49guE9YfRh44G";
const FROM_EMAIL = "Life Organizer Guru <newsletter@lifeorganizerguru.com>";
const SUBJECT =
  "🎉 Your Template Just Got Better - Download the Latest Updates!";
const TEMPLATE_PATH = "../email-templates/template-update-announcement.html";

// Rate limiting: delay between emails (in ms)
// Resend rate limit: 2 requests per second
// We use 600ms (0.6s) delay to safely stay under the limit
const DELAY_BETWEEN_EMAILS = 600; // 600ms delay = ~1.6 emails per second

// Helper function to delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Convert HTML to plain text for multipart email (strip tags, normalize whitespace). */
function htmlToText(html: string): string {
  let text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
  return text;
}

// Parse email file
async function parseEmailFile(filepath: string): Promise<string[]> {
  try {
    const content = await Deno.readTextFile(filepath);

    const emails = content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => {
        // Skip empty lines and comments
        if (!line || line.startsWith("#")) return false;
        // Basic email validation
        return line.includes("@") && line.includes(".");
      });

    return [...new Set(emails)]; // Remove duplicates
  } catch (error) {
    console.error(`❌ Error reading file: ${error.message}`);
    Deno.exit(1);
  }
}

// Read and prepare HTML template
async function getEmailHtml(recipientEmail: string): Promise<string> {
  try {
    // Get the directory of the current script
    const scriptDir = new URL(".", import.meta.url).pathname;
    const templatePath = scriptDir + TEMPLATE_PATH;

    let html = await Deno.readTextFile(templatePath);

    // Replace {{EMAIL}} placeholder with actual recipient email for unsubscribe link
    html = html.replace(/\{\{EMAIL\}\}/g, recipientEmail);

    return html;
  } catch (error) {
    console.error(`❌ Error reading template: ${error.message}`);
    throw error;
  }
}

// Send email function with retry logic for rate limits
async function sendEmail(
  email: string,
  subject: string,
  html: string,
  text: string,
  retryCount = 0,
): Promise<{ success: boolean; email: string; error?: string }> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: email,
        reply_to: "Life Organizer Guru <newsletter@lifeorganizerguru.com>",
        subject: subject,
        html: html,
        text: text,
        headers: {
          "List-Unsubscribe": `<https://lifeorganizerguru.com/unsubscribe?email=${encodeURIComponent(email)}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      // Check if it's a rate limit error (429)
      if (response.status === 429 && retryCount < 3) {
        const waitTime = (retryCount + 1) * 1000; // 1s, 2s, 3s
        console.log(`⏳ Rate limited. Waiting ${waitTime}ms before retry...`);
        await delay(waitTime);
        return sendEmail(email, subject, html, text, retryCount + 1);
      }

      console.error(`❌ Failed to send to ${email}:`, errorText);
      return { success: false, email, error: errorText };
    }

    const result = await response.json();
    console.log(`✅ Sent to ${email} (ID: ${result.id})`);
    return { success: true, email };
  } catch (error) {
    console.error(`❌ Error sending to ${email}:`, error.message);
    return { success: false, email, error: error.message };
  }
}

// Main execution
async function main() {
  console.log("🚀 Starting HTML template email send...\n");

  // Check for file argument
  const filepath = Deno.args[0];
  if (!filepath) {
    console.error("❌ ERROR: No email file specified!");
    console.error(
      "\nUsage: deno run --allow-env --allow-net --allow-read send-template-email.ts <email-file>",
    );
    console.error(
      "\nExample: deno run --allow-env --allow-net --allow-read send-template-email.ts emails.txt",
    );
    Deno.exit(1);
  }

  // Validation
  if (!RESEND_API_KEY) {
    console.error("❌ ERROR: RESEND_API_KEY environment variable is not set!");
    console.error("Set it with: export RESEND_API_KEY=your_api_key");
    Deno.exit(1);
  }

  // Parse email file
  console.log(`📁 Reading emails from: ${filepath}`);
  const RECIPIENT_EMAILS = await parseEmailFile(filepath);

  if (RECIPIENT_EMAILS.length === 0) {
    console.error("❌ ERROR: No valid emails found in file!");
    Deno.exit(1);
  }

  console.log(`✅ Found ${RECIPIENT_EMAILS.length} valid email(s)\n`);

  // Check if template file exists
  try {
    const scriptDir = new URL(".", import.meta.url).pathname;
    const templatePath = scriptDir + TEMPLATE_PATH;
    await Deno.stat(templatePath);
    console.log(`✅ Template found: ${TEMPLATE_PATH}\n`);
  } catch {
    console.error(`❌ ERROR: Template file not found at ${TEMPLATE_PATH}`);
    console.error("Make sure the HTML template exists in email-templates/");
    Deno.exit(1);
  }

  console.log(`📧 Subject: ${SUBJECT}`);
  console.log(`👥 Recipients: ${RECIPIENT_EMAILS.length}`);
  console.log(`📤 From: ${FROM_EMAIL}\n`);

  // Show recipients preview
  console.log("📋 Preview of recipients:");
  RECIPIENT_EMAILS.slice(0, 5).forEach((email) => console.log(`  - ${email}`));
  if (RECIPIENT_EMAILS.length > 5) {
    console.log(`  ... and ${RECIPIENT_EMAILS.length - 5} more`);
  }
  console.log();

  // Confirm before sending
  console.log("⚠️  About to send emails. Continue? (y/n)");
  const buf = new Uint8Array(1024);
  const n = await Deno.stdin.read(buf);
  const answer = new TextDecoder()
    .decode(buf.subarray(0, n || 0))
    .trim()
    .toLowerCase();

  if (answer !== "y" && answer !== "yes") {
    console.log("❌ Cancelled.");
    Deno.exit(0);
  }

  console.log("\n📨 Sending emails...\n");

  // Track results
  const results = {
    total: RECIPIENT_EMAILS.length,
    sent: 0,
    failed: 0,
    errors: [] as { email: string; error: string }[],
  };

  // Send emails with rate limiting
  for (let i = 0; i < RECIPIENT_EMAILS.length; i++) {
    const email = RECIPIENT_EMAILS[i];
    console.log(`[${i + 1}/${RECIPIENT_EMAILS.length}] Sending to ${email}...`);

    // Get HTML with personalized content
    const html = await getEmailHtml(email);
    const text = htmlToText(html);
    const result = await sendEmail(email, SUBJECT, html, text);

    if (result.success) {
      results.sent++;
    } else {
      results.failed++;
      if (result.error) {
        results.errors.push({ email, error: result.error });
      }
    }

    // Rate limiting delay (except for last email)
    if (i < RECIPIENT_EMAILS.length - 1) {
      await delay(DELAY_BETWEEN_EMAILS);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 SUMMARY");
  console.log("=".repeat(50));
  console.log(`Total: ${results.total}`);
  console.log(`✅ Sent: ${results.sent}`);
  console.log(`❌ Failed: ${results.failed}`);

  if (results.errors.length > 0) {
    console.log("\n❌ Errors:");
    results.errors.forEach(({ email, error }) => {
      console.log(`  - ${email}: ${error}`);
    });
  }

  console.log("\n✨ Done!");
}

// Run the script
if (import.meta.main) {
  main();
}
