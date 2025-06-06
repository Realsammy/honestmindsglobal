import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UserActivityLog {
  user_id: string
  action: string
  details?: any
  ip_address?: string
  user_agent?: string
  created_at: string
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
        .from('user_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters) {
        if (filters.user_id) {
          query = query.eq('user_id', filters.user_id)
        }
        if (filters.action) {
          query = query.eq('action', filters.action)
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
      const requiredFields = ['user_id', 'action']
      const missingFields = requiredFields.filter(field => !(field in log))
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
      }

      // Create user activity log
      const { data, error } = await supabaseClient
        .from('user_activity_logs')
        .insert([
          {
            user_id: log.user_id,
            action: log.action,
            details: log.details,
            ip_address: log.ip_address,
            user_agent: log.user_agent,
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
    } else if (action === 'delete') {
      const { id } = await req.json()

      if (!id) {
        throw new Error('Log ID is required')
      }

      // Delete user activity log
      const { error } = await supabaseClient
        .from('user_activity_logs')
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
    } else if (action === 'cleanup') {
      const { days } = await req.json()

      if (!days || typeof days !== 'number' || days < 1) {
        throw new Error('Valid number of days is required')
      }

      // Delete old logs
      const { error } = await supabaseClient
        .from('user_activity_logs')
        .delete()
        .lt('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())

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