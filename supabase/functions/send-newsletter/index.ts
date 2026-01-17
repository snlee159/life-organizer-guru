import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''

serve(async (req) => {
  try {
    const { subject, content, subscribers } = await req.json()

    if (!subject || !content || !subscribers || !Array.isArray(subscribers)) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get base URL for unsubscribe links
    const baseUrl = Deno.env.get('BASE_URL') || 'http://localhost:5173'

    // Send emails using Resend API
    const emailPromises = subscribers.map(async (email: string) => {
      const unsubscribeUrl = `${baseUrl}/unsubscribe?email=${encodeURIComponent(email)}`
      
      const emailContent = `
        ${content}
        
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;">
        <p style="font-size: 12px; color: #666;">
          <a href="${unsubscribeUrl}" style="color: #666;">Unsubscribe</a> from this newsletter
        </p>
      `

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Life Organizer Guru <newsletter@lifeorganizerguru.com>',
          to: email,
          subject: subject,
          html: emailContent,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Failed to send email to ${email}`)
      }

      return { email, status: 'sent' }
    })

    const results = await Promise.allSettled(emailPromises)
    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return new Response(
      JSON.stringify({
        success: true,
        sent: successful,
        failed: failed,
        total: subscribers.length,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

