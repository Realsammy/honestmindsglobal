import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SystemWebhook {
  id: string
  name: string
  url: string
  events: string[]
  secret?: string
  status: string
  last_triggered?: string
  created_at: string
  updated_at: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, webhook, filters } = await req.json()

    if (action === 'get') {
      // Build query
      let query = supabaseClient
        .from('system_webhooks')
        .select('*')
        .order('name', { ascending: true })

      // Apply filters
      if (filters) {
        if (filters.name) {
          query = query.eq('name', filters.name)
        }
        if (filters.status) {
          query = query.eq('status', filters.status)
        }
        if (filters.event) {
          query = query.contains('events', [filters.event])
        }
      }

      // Execute query
      const { data, error } = await query

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, webhooks: data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else if (action === 'create') {
      if (!webhook) {
        throw new Error('Webhook object is required')
      }

      // Validate webhook object
      const requiredFields = ['name', 'url', 'events']
      const missingFields = requiredFields.filter(field => !(field in webhook))
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
      }

      // Validate URL format
      try {
        new URL(webhook.url)
      } catch {
        throw new Error('Invalid URL format')
      }

      // Validate events
      const validEvents = ['user.created', 'user.updated', 'user.deleted', 'system.backup', 'system.error']
      if (!Array.isArray(webhook.events) || webhook.events.length === 0) {
        throw new Error('Events must be a non-empty array')
      }
      for (const event of webhook.events) {
        if (!validEvents.includes(event)) {
          throw new Error(`Invalid event: ${event}`)
        }
      }

      // Check if webhook already exists
      const { data: existingWebhook, error: checkError } = await supabaseClient
        .from('system_webhooks')
        .select('*')
        .eq('name', webhook.name)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      if (existingWebhook) {
        throw new Error('Webhook already exists')
      }

      // Generate webhook secret
      const secret = crypto.randomUUID()

      // Create system webhook
      const { data, error } = await supabaseClient
        .from('system_webhooks')
        .insert([
          {
            name: webhook.name,
            url: webhook.url,
            events: webhook.events,
            secret,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, webhook: data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else if (action === 'update') {
      if (!webhook || !webhook.id) {
        throw new Error('Webhook object with ID is required')
      }

      // Validate webhook object
      const requiredFields = ['url', 'events']
      const missingFields = requiredFields.filter(field => !(field in webhook))
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
      }

      // Validate URL format
      try {
        new URL(webhook.url)
      } catch {
        throw new Error('Invalid URL format')
      }

      // Validate events
      const validEvents = ['user.created', 'user.updated', 'user.deleted', 'system.backup', 'system.error']
      if (!Array.isArray(webhook.events) || webhook.events.length === 0) {
        throw new Error('Events must be a non-empty array')
      }
      for (const event of webhook.events) {
        if (!validEvents.includes(event)) {
          throw new Error(`Invalid event: ${event}`)
        }
      }

      // Update system webhook
      const { data, error } = await supabaseClient
        .from('system_webhooks')
        .update({
          url: webhook.url,
          events: webhook.events,
          status: webhook.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', webhook.id)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, webhook: data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else if (action === 'delete') {
      const { id } = await req.json()

      if (!id) {
        throw new Error('Webhook ID is required')
      }

      // Delete system webhook
      const { error } = await supabaseClient
        .from('system_webhooks')
        .delete()
        .eq('id', id)

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else if (action === 'update_status') {
      const { id, status } = await req.json()

      if (!id || !status) {
        throw new Error('Webhook ID and status are required')
      }

      // Validate status
      const validStatuses = ['active', 'inactive']
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid status')
      }

      // Update webhook status
      const { data, error } = await supabaseClient
        .from('system_webhooks')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, webhook: data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else if (action === 'regenerate_secret') {
      const { id } = await req.json()

      if (!id) {
        throw new Error('Webhook ID is required')
      }

      // Generate new webhook secret
      const secret = crypto.randomUUID()

      // Update webhook secret
      const { data, error } = await supabaseClient
        .from('system_webhooks')
        .update({
          secret,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, webhook: data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else if (action === 'trigger') {
      const { id, event, payload } = await req.json()

      if (!id || !event || !payload) {
        throw new Error('Webhook ID, event, and payload are required')
      }

      // Get webhook details
      const { data: webhook, error: webhookError } = await supabaseClient
        .from('system_webhooks')
        .select('*')
        .eq('id', id)
        .single()

      if (webhookError) throw webhookError

      if (!webhook) {
        throw new Error('Webhook not found')
      }

      if (webhook.status !== 'active') {
        throw new Error('Webhook is not active')
      }

      if (!webhook.events.includes(event)) {
        throw new Error('Webhook is not subscribed to this event')
      }

      // Generate signature
      const timestamp = Date.now()
      const signature = await generateSignature(webhook.secret, timestamp, payload)

      // Send webhook
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Timestamp': timestamp.toString(),
        },
        body: JSON.stringify({
          event,
          payload,
          timestamp,
        }),
      })

      if (!response.ok) {
        throw new Error(`Webhook delivery failed: ${response.statusText}`)
      }

      // Update last triggered
      const { error: updateError } = await supabaseClient
        .from('system_webhooks')
        .update({
          last_triggered: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (updateError) throw updateError

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else {
      throw new Error('Invalid action')
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function generateSignature(secret: string, timestamp: number, payload: any): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(`${timestamp}${JSON.stringify(payload)}`)
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, data)
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
} 