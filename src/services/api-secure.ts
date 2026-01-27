/**
 * Secure API Service
 * 
 * All database operations go through Supabase Edge Functions.
 * No direct database access from the browser.
 */

const BASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Store admin password in memory (never in localStorage for security)
let adminPassword: string | null = null

// ===========================
// ADMIN PASSWORD MANAGEMENT
// ===========================

export function setAdminPassword(password: string) {
  adminPassword = password
}

export function clearAdminPassword() {
  adminPassword = null
}

export function isAdminAuthenticated(): boolean {
  return adminPassword !== null
}

// ===========================
// EDGE FUNCTION CALLER
// ===========================

interface CallOptions {
  functionName: string
  body?: any
  requiresAdmin?: boolean
  signal?: AbortSignal
}

async function callEdgeFunction<T = any>(options: CallOptions): Promise<T> {
  const { functionName, body = {}, requiresAdmin = false, signal } = options

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ANON_KEY}`,
    'apikey': ANON_KEY,
  }

  // Add admin password header if required
  if (requiresAdmin) {
    if (!adminPassword) {
      throw new Error('Admin authentication required. Please log in.')
    }
    headers['x-admin-password'] = adminPassword
  }

  const url = `${BASE_URL}/functions/v1/${functionName}`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal,
    })

    const data = await response.json()

    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401) {
        clearAdminPassword()
        throw new Error(data.error || 'Authentication failed')
      }

      // Handle other errors
      throw new Error(data.error || `Request failed: ${response.status}`)
    }

    return data
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request cancelled')
      }
      throw error
    }
    throw new Error('An unknown error occurred')
  }
}

// ===========================
// AUTHENTICATION
// ===========================

export async function verifyPassword(password: string): Promise<{ valid: boolean; authenticated: boolean }> {
  const result = await callEdgeFunction<{ valid: boolean; authenticated: boolean }>({
    functionName: 'auth-verify',
    body: { password },
  })

  if (result.valid) {
    setAdminPassword(password)
  }

  return result
}

export function logout() {
  clearAdminPassword()
}

// ===========================
// CONTACT FORM
// ===========================

export interface ContactFormData {
  name: string
  email: string
  message: string
}

export interface ContactSubmitResponse {
  success: boolean
  message: string
  id?: string
}

export async function submitContactForm(data: ContactFormData): Promise<ContactSubmitResponse> {
  return await callEdgeFunction<ContactSubmitResponse>({
    functionName: 'contact-submit',
    body: data,
  })
}

// ===========================
// NEWSLETTER
// ===========================

export interface NewsletterSignupResponse {
  success: boolean
  message: string
  alreadySubscribed?: boolean
  resubscribed?: boolean
}

export async function signupNewsletter(email: string): Promise<NewsletterSignupResponse> {
  return await callEdgeFunction<NewsletterSignupResponse>({
    functionName: 'newsletter-signup',
    body: { email },
  })
}

export interface NewsletterUnsubscribeResponse {
  success: boolean
  message: string
  alreadyUnsubscribed?: boolean
}

export async function unsubscribeNewsletter(email: string): Promise<NewsletterUnsubscribeResponse> {
  return await callEdgeFunction<NewsletterUnsubscribeResponse>({
    functionName: 'newsletter-unsubscribe',
    body: { email },
  })
}

// ===========================
// ADMIN DATA OPERATIONS
// ===========================

export interface Subscriber {
  id: string
  email: string
  subscribed: boolean
  created_at: string
  updated_at: string
}

export interface ContactSubmission {
  id: string
  name: string
  email: string
  message: string
  status: 'new' | 'read' | 'replied' | 'archived'
  notes?: string
  submitted_at: string
  updated_at: string
}

export async function getSubscribers(): Promise<Subscriber[]> {
  const result = await callEdgeFunction<{ data: Subscriber[] }>({
    functionName: 'admin-data',
    body: { resource: 'subscribers' },
    requiresAdmin: true,
  })
  return result.data || []
}

export async function getContactSubmissions(filters?: { status?: string }): Promise<ContactSubmission[]> {
  const result = await callEdgeFunction<{ data: ContactSubmission[] }>({
    functionName: 'admin-data',
    body: { resource: 'contact_submissions', filters },
    requiresAdmin: true,
  })
  return result.data || []
}

// ===========================
// ADMIN WRITE OPERATIONS
// ===========================

export interface UpdateContactSubmissionData {
  status?: 'new' | 'read' | 'replied' | 'archived'
  notes?: string
}

export async function updateContactSubmission(
  id: string, 
  data: UpdateContactSubmissionData
): Promise<{ success: boolean }> {
  return await callEdgeFunction<{ success: boolean }>({
    functionName: 'admin-write',
    body: {
      operation: 'update',
      table: 'contact_submissions',
      id,
      data,
    },
    requiresAdmin: true,
  })
}

export async function deleteContactSubmission(id: string): Promise<{ success: boolean }> {
  return await callEdgeFunction<{ success: boolean }>({
    functionName: 'admin-write',
    body: {
      operation: 'delete',
      table: 'contact_submissions',
      id,
    },
    requiresAdmin: true,
  })
}

// ===========================
// NEWSLETTER SENDING
// ===========================

export interface SendNewsletterData {
  subject: string
  content: string
  subscribers: string[]
}

export interface SendNewsletterResponse {
  success: boolean
  sent: number
  failed: number
  total: number
}

export async function sendNewsletter(data: SendNewsletterData): Promise<SendNewsletterResponse> {
  return await callEdgeFunction<SendNewsletterResponse>({
    functionName: 'send-newsletter',
    body: data,
    requiresAdmin: true,
  })
}

// ===========================
// UTILITY
// ===========================

export function isSupabaseConfigured(): boolean {
  return !!(BASE_URL && ANON_KEY && BASE_URL !== '' && ANON_KEY !== '')
}
