import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SystemStatus {
  maintenance_mode: boolean
  maintenance_message?: string
  scheduled_maintenance: boolean
  maintenance_start?: string
  maintenance_end?: string
  last_backup?: string
  last_optimization?: string
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

    const { action, status } = await req.json()

    if (action === 'get') {
      // Get current system status
      const { data, error } = await supabaseClient
        .from('system_status')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, status: data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else if (action === 'update') {
      if (!status) {
        throw new Error('Status object is required')
      }

      // Validate status object
      const requiredFields = ['maintenance_mode']
      const missingFields = requiredFields.filter(field => !(field in status))
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
      }

      // Update system status
      const { data, error } = await supabaseClient
        .from('system_status')
        .insert([
          {
            maintenance_mode: status.maintenance_mode,
            maintenance_message: status.maintenance_message,
            scheduled_maintenance: status.scheduled_maintenance || false,
            maintenance_start: status.maintenance_start,
            maintenance_end: status.maintenance_end,
            last_backup: status.last_backup,
            last_optimization: status.last_optimization,
          },
        ])
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, status: data }),
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