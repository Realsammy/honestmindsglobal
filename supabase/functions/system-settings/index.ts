import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SystemSetting {
  key: string
  value: any
  description?: string
  updated_at: string
  updated_by?: string
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

    const { action, setting, filters } = await req.json()

    if (action === 'get') {
      // Build query
      let query = supabaseClient
        .from('system_settings')
        .select('*')
        .order('key', { ascending: true })

      // Apply filters
      if (filters) {
        if (filters.key) {
          query = query.eq('key', filters.key)
        }
      }

      // Execute query
      const { data, error } = await query

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, settings: data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else if (action === 'create') {
      if (!setting) {
        throw new Error('Setting object is required')
      }

      // Validate setting object
      const requiredFields = ['key', 'value']
      const missingFields = requiredFields.filter(field => !(field in setting))
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
      }

      // Check if setting already exists
      const { data: existingSetting, error: checkError } = await supabaseClient
        .from('system_settings')
        .select('*')
        .eq('key', setting.key)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      if (existingSetting) {
        throw new Error('Setting already exists')
      }

      // Create system setting
      const { data, error } = await supabaseClient
        .from('system_settings')
        .insert([
          {
            key: setting.key,
            value: setting.value,
            description: setting.description,
            updated_at: new Date().toISOString(),
            updated_by: setting.updated_by,
          },
        ])
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, setting: data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else if (action === 'update') {
      if (!setting || !setting.key) {
        throw new Error('Setting object with key is required')
      }

      // Validate setting object
      const requiredFields = ['value']
      const missingFields = requiredFields.filter(field => !(field in setting))
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
      }

      // Update system setting
      const { data, error } = await supabaseClient
        .from('system_settings')
        .update({
          value: setting.value,
          description: setting.description,
          updated_at: new Date().toISOString(),
          updated_by: setting.updated_by,
        })
        .eq('key', setting.key)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, setting: data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else if (action === 'delete') {
      const { key } = await req.json()

      if (!key) {
        throw new Error('Setting key is required')
      }

      // Delete system setting
      const { error } = await supabaseClient
        .from('system_settings')
        .delete()
        .eq('key', key)

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else if (action === 'bulk_update') {
      const { settings } = await req.json()

      if (!settings || !Array.isArray(settings)) {
        throw new Error('Settings array is required')
      }

      // Validate settings
      for (const setting of settings) {
        if (!setting.key || !('value' in setting)) {
          throw new Error('Each setting must have a key and value')
        }
      }

      // Update settings
      const updates = settings.map(setting => ({
        key: setting.key,
        value: setting.value,
        description: setting.description,
        updated_at: new Date().toISOString(),
        updated_by: setting.updated_by,
      }))

      const { data, error } = await supabaseClient
        .from('system_settings')
        .upsert(updates)
        .select()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, settings: data }),
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