import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationTemplate {
  name: string
  subject: string
  body: string
  type: string
  variables: string[]
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

    const { action, template } = await req.json()

    if (action === 'get') {
      // Get all notification templates
      const { data, error } = await supabaseClient
        .from('notification_templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, templates: data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else if (action === 'get_by_type') {
      const { type } = await req.json()

      if (!type) {
        throw new Error('Template type is required')
      }

      // Get templates by type
      const { data, error } = await supabaseClient
        .from('notification_templates')
        .select('*')
        .eq('type', type)
        .order('created_at', { ascending: false })

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, templates: data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else if (action === 'create') {
      if (!template) {
        throw new Error('Template object is required')
      }

      // Validate template object
      const requiredFields = ['name', 'subject', 'body', 'type']
      const missingFields = requiredFields.filter(field => !(field in template))
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
      }

      // Validate template type
      const validTypes = ['email', 'push', 'sms']
      if (!validTypes.includes(template.type)) {
        throw new Error('Invalid template type')
      }

      // Extract variables from template
      const variableRegex = /{{([^}]+)}}/g
      const variables = []
      let match
      while ((match = variableRegex.exec(template.body)) !== null) {
        variables.push(match[1].trim())
      }

      // Create notification template
      const { data, error } = await supabaseClient
        .from('notification_templates')
        .insert([
          {
            name: template.name,
            subject: template.subject,
            body: template.body,
            type: template.type,
            variables,
          },
        ])
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, template: data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else if (action === 'update') {
      if (!template || !template.id) {
        throw new Error('Template object with ID is required')
      }

      // Validate template object
      const requiredFields = ['name', 'subject', 'body', 'type']
      const missingFields = requiredFields.filter(field => !(field in template))
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
      }

      // Validate template type
      const validTypes = ['email', 'push', 'sms']
      if (!validTypes.includes(template.type)) {
        throw new Error('Invalid template type')
      }

      // Extract variables from template
      const variableRegex = /{{([^}]+)}}/g
      const variables = []
      let match
      while ((match = variableRegex.exec(template.body)) !== null) {
        variables.push(match[1].trim())
      }

      // Update notification template
      const { data, error } = await supabaseClient
        .from('notification_templates')
        .update({
          name: template.name,
          subject: template.subject,
          body: template.body,
          type: template.type,
          variables,
        })
        .eq('id', template.id)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, template: data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else if (action === 'delete') {
      const { id } = await req.json()

      if (!id) {
        throw new Error('Template ID is required')
      }

      // Delete notification template
      const { error } = await supabaseClient
        .from('notification_templates')
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