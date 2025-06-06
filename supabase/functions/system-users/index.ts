import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SystemUser {
  id: string
  email: string
  role: string
  status: string
  last_login?: string
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

    const { action, user, filters } = await req.json()

    if (action === 'get') {
      // Build query
      let query = supabaseClient
        .from('system_users')
        .select('*')
        .order('email', { ascending: true })

      // Apply filters
      if (filters) {
        if (filters.email) {
          query = query.eq('email', filters.email)
        }
        if (filters.role) {
          query = query.eq('role', filters.role)
        }
        if (filters.status) {
          query = query.eq('status', filters.status)
        }
      }

      // Execute query
      const { data, error } = await query

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, users: data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else if (action === 'create') {
      if (!user) {
        throw new Error('User object is required')
      }

      // Validate user object
      const requiredFields = ['email', 'role']
      const missingFields = requiredFields.filter(field => !(field in user))
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(user.email)) {
        throw new Error('Invalid email format')
      }

      // Validate role
      const validRoles = ['admin', 'user']
      if (!validRoles.includes(user.role)) {
        throw new Error('Invalid role')
      }

      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabaseClient
        .from('system_users')
        .select('*')
        .eq('email', user.email)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      if (existingUser) {
        throw new Error('User already exists')
      }

      // Create system user
      const { data, error } = await supabaseClient
        .from('system_users')
        .insert([
          {
            email: user.email,
            role: user.role,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, user: data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else if (action === 'update') {
      if (!user || !user.id) {
        throw new Error('User object with ID is required')
      }

      // Validate user object
      const requiredFields = ['role']
      const missingFields = requiredFields.filter(field => !(field in user))
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
      }

      // Validate role
      const validRoles = ['admin', 'user']
      if (!validRoles.includes(user.role)) {
        throw new Error('Invalid role')
      }

      // Update system user
      const { data, error } = await supabaseClient
        .from('system_users')
        .update({
          role: user.role,
          status: user.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, user: data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else if (action === 'delete') {
      const { id } = await req.json()

      if (!id) {
        throw new Error('User ID is required')
      }

      // Delete system user
      const { error } = await supabaseClient
        .from('system_users')
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
        throw new Error('User ID and status are required')
      }

      // Validate status
      const validStatuses = ['active', 'inactive', 'suspended']
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid status')
      }

      // Update user status
      const { data, error } = await supabaseClient
        .from('system_users')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, user: data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else if (action === 'update_last_login') {
      const { id } = await req.json()

      if (!id) {
        throw new Error('User ID is required')
      }

      // Update last login
      const { data, error } = await supabaseClient
        .from('system_users')
        .update({
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, user: data }),
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