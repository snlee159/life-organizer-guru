#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read

/**
 * Send HTML Email Template to Multiple Recipients
 * 
 * Usage:
 *   1. Set RESEND_API_KEY environment variable
 *   2. Create email list file (one email per line)
 *   3. Run: deno run --allow-env --allow-net --allow-read send-html-template.ts emails.txt
 */

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "re_3McmgkHb_4svDwcooCCm49guE9YfRh44G";
const FROM_EMAIL = "Life Organizer Guru <newsletter@lifeorganizerguru.com>";
const SUBJECT = "🎉 Your Template Just Got Better - Download the Latest Updates!";

// Path to your HTML email template (relative to script location)
const TEMPLATE_PATH = "../email-templates/template-update-announcement.html";

// Rate limiting: delay between emails (in ms)
// Resend rate limit: 2 requests per second
const DELAY_BETWEEN_EMAILS = 600; // 600ms = ~1.6 emails per second

// Helper function to delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

// Parse email file
async function parseEmailFile(filepath: string): Promise<string[]> {
  try {
    const content = await Deno.readTextFile(filepath);
    
    const emails = content
      .split("\n")
      .map(line => line.trim())
      .filter(line => {
        if (!line || line.startsWith("#")) return false;
        return line.includes("@") && line.includes(".");
      });

    return [...new Set(emails)]; // Remove duplicates
  } catch (error) {
    console.error(`❌ Error reading file: ${error.message}`);
    Deno.exit(1);
  }
}

// Send email function
async function sendEmail(
  email: string,
  subject: string,
  html: string
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
        subject: subject,
        html: html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
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
    console.error("❌ ERROR: No file specified!");
    console.error("\nUsage: deno run --allow-env --allow-net --allow-read send-html-template.ts <email-file>");
    console.error("\nExample: deno run --allow-env --allow-net --allow-read send-html-template.ts emails.txt");
    Deno.exit(1);
  }

  // Validation
  if (!RESEND_API_KEY) {
    console.error("❌ ERROR: RESEND_API_KEY environment variable is not set!");
    console.error("Set it with: export RESEND_API_KEY=your_api_key");
    Deno.exit(1);
  }

  // Check if template file exists
  try {
    const scriptDir = new URL(".", import.meta.url).pathname;
    const templatePath = scriptDir + TEMPLATE_PATH;
    await Deno.stat(templatePath);
    console.log(`✅ Template found: ${TEMPLATE_PATH}`);
  } catch {
    console.error(`❌ ERROR: Template file not found at ${TEMPLATE_PATH}`);
    console.error("Make sure the HTML template exists in email-templates/");
    Deno.exit(1);
  }

  // Parse email file
  console.log(`📁 Reading emails from: ${filepath}`);
  const emails = await parseEmailFile(filepath);

  if (emails.length === 0) {
    console.error("❌ ERROR: No valid emails found in file!");
    Deno.exit(1);
  }

  console.log(`✅ Found ${emails.length} valid email(s)\n`);
  console.log(`📧 Subject: ${SUBJECT}`);
  console.log(`👥 Recipients: ${emails.length}`);
  console.log(`📤 From: ${FROM_EMAIL}\n`);

  // Show first few emails as preview
  console.log("📋 Preview of recipients:");
  emails.slice(0, 5).forEach(email => console.log(`  - ${email}`));
  if (emails.length > 5) {
    console.log(`  ... and ${emails.length - 5} more`);
  }
  console.log();

  // Confirm before sending
  console.log("⚠️  About to send emails. Continue? (y/n)");
  const buf = new Uint8Array(1024);
  const n = await Deno.stdin.read(buf);
  const answer = new TextDecoder().decode(buf.subarray(0, n || 0)).trim().toLowerCase();

  if (answer !== "y" && answer !== "yes") {
    console.log("❌ Cancelled.");
    Deno.exit(0);
  }

  console.log("\n📨 Sending emails...\n");

  // Track results
  const results = {
    total: emails.length,
    sent: 0,
    failed: 0,
    errors: [] as { email: string; error: string }[],
  };

  // Send emails with rate limiting
  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];
    console.log(`[${i + 1}/${emails.length}] Sending to ${email}...`);
    
    // Get HTML with personalized content
    const html = await getEmailHtml(email);
    const result = await sendEmail(email, SUBJECT, html);

    if (result.success) {
      results.sent++;
    } else {
      results.failed++;
      if (result.error) {
        results.errors.push({ email, error: result.error });
      }
    }

    // Rate limiting delay (except for last email)
    if (i < emails.length - 1) {
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
