import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SystemConfig {
  site_name: string
  site_url: string
  maintenance_mode: boolean
  registration_enabled: boolean
  default_currency: string
  timezone: string
  date_format: string
  max_file_size: number
  allowed_file_types: string[]
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

    const { action, config } = await req.json()

    if (action === 'get') {
      // Get current system configuration
      const { data, error } = await supabaseClient
        .from('system_config')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, config: data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else if (action === 'update') {
      if (!config) {
        throw new Error('Config object is required')
      }

      // Validate config object
      const requiredFields = ['site_name', 'site_url']
      const missingFields = requiredFields.filter(field => !(field in config))
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
      }

      // Validate file size
      if (config.max_file_size && config.max_file_size > 10485760) { // 10MB
        throw new Error('Maximum file size cannot exceed 10MB')
      }

      // Validate file types
      if (config.allowed_file_types) {
        const validTypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'application/pdf',
          'text/plain',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ]
        const invalidTypes = config.allowed_file_types.filter(
          type => !validTypes.includes(type)
        )
        if (invalidTypes.length > 0) {
          throw new Error(`Invalid file types: ${invalidTypes.join(', ')}`)
        }
      }

      // Update system configuration
      const { data, error } = await supabaseClient
        .from('system_config')
        .insert([
          {
            site_name: config.site_name,
            site_url: config.site_url,
            maintenance_mode: config.maintenance_mode || false,
            registration_enabled: config.registration_enabled ?? true,
            default_currency: config.default_currency || 'USD',
            timezone: config.timezone || 'UTC',
            date_format: config.date_format || 'YYYY-MM-DD',
            max_file_size: config.max_file_size || 5242880, // 5MB
            allowed_file_types: config.allowed_file_types || ['image/jpeg', 'image/png', 'image/gif'],
          },
        ])
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, config: data }),
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