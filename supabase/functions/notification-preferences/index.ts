import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationPreferences {
  email_notifications: boolean
  push_notifications: boolean
  sms_notifications: boolean
  notification_frequency: string
  quiet_hours_start?: string
  quiet_hours_end?: string
  notification_channels: string[]
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

    const { action, preferences, user_id } = await req.json()

    if (!user_id) {
      throw new Error('User ID is required')
    }

    if (action === 'get') {
      // Get user's notification preferences
      const { data, error } = await supabaseClient
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, preferences: data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else if (action === 'update') {
      if (!preferences) {
        throw new Error('Preferences object is required')
      }

      // Validate preferences object
      const requiredFields = ['email_notifications', 'push_notifications', 'sms_notifications']
      const missingFields = requiredFields.filter(field => !(field in preferences))
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
      }

      // Validate notification frequency
      const validFrequencies = ['immediate', 'daily', 'weekly']
      if (preferences.notification_frequency && !validFrequencies.includes(preferences.notification_frequency)) {
        throw new Error('Invalid notification frequency')
      }

      // Validate quiet hours
      if (preferences.quiet_hours_start && preferences.quiet_hours_end) {
        const start = new Date(`2000-01-01T${preferences.quiet_hours_start}`)
        const end = new Date(`2000-01-01T${preferences.quiet_hours_end}`)
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          throw new Error('Invalid quiet hours format')
        }
      }

      // Validate notification channels
      const validChannels = ['email', 'push', 'sms']
      if (preferences.notification_channels) {
        const invalidChannels = preferences.notification_channels.filter(
          channel => !validChannels.includes(channel)
        )
        if (invalidChannels.length > 0) {
          throw new Error(`Invalid notification channels: ${invalidChannels.join(', ')}`)
        }
      }

      // Update notification preferences
      const { data, error } = await supabaseClient
        .from('notification_preferences')
        .insert([
          {
            user_id,
            email_notifications: preferences.email_notifications,
            push_notifications: preferences.push_notifications,
            sms_notifications: preferences.sms_notifications,
            notification_frequency: preferences.notification_frequency || 'immediate',
            quiet_hours_start: preferences.quiet_hours_start,
            quiet_hours_end: preferences.quiet_hours_end,
            notification_channels: preferences.notification_channels || ['email'],
          },
        ])
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, preferences: data }),
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