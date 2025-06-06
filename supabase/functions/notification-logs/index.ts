import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationLog {
  user_id: string
  template_id?: string
  type: string
  subject: string
  body: string
  status: string
  error_message?: string
  created_at: string
  sent_at?: string
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

    const { action, log, filters } = await req.json()

    if (action === 'get') {
      // Build query
      let query = supabaseClient
        .from('notification_logs')
        .select('*')
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters) {
        if (filters.user_id) {
          query = query.eq('user_id', filters.user_id)
        }
        if (filters.type) {
          query = query.eq('type', filters.type)
        }
        if (filters.status) {
          query = query.eq('status', filters.status)
        }
        if (filters.start_date) {
          query = query.gte('created_at', filters.start_date)
        }
        if (filters.end_date) {
          query = query.lte('created_at', filters.end_date)
        }
      }

      // Execute query
      const { data, error } = await query

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, logs: data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else if (action === 'create') {
      if (!log) {
        throw new Error('Log object is required')
      }

      // Validate log object
      const requiredFields = ['user_id', 'type', 'subject', 'body']
      const missingFields = requiredFields.filter(field => !(field in log))
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
      }

      // Validate notification type
      const validTypes = ['email', 'push', 'sms']
      if (!validTypes.includes(log.type)) {
        throw new Error('Invalid notification type')
      }

      // Create notification log
      const { data, error } = await supabaseClient
        .from('notification_logs')
        .insert([
          {
            user_id: log.user_id,
            template_id: log.template_id,
            type: log.type,
            subject: log.subject,
            body: log.body,
            status: 'pending',
          },
        ])
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, log: data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else if (action === 'update') {
      if (!log || !log.id) {
        throw new Error('Log object with ID is required')
      }

      // Validate log object
      const requiredFields = ['status']
      const missingFields = requiredFields.filter(field => !(field in log))
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
      }

      // Validate status
      const validStatuses = ['pending', 'sent', 'failed']
      if (!validStatuses.includes(log.status)) {
        throw new Error('Invalid status')
      }

      // Update notification log
      const { data, error } = await supabaseClient
        .from('notification_logs')
        .update({
          status: log.status,
          error_message: log.error_message,
          sent_at: log.status === 'sent' ? new Date().toISOString() : null,
        })
        .eq('id', log.id)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, log: data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else if (action === 'delete') {
      const { id } = await req.json()

      if (!id) {
        throw new Error('Log ID is required')
      }

      // Delete notification log
      const { error } = await supabaseClient
        .from('notification_logs')
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