import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SystemBackup {
  filename: string
  size: number
  status: string
  created_at: string
  completed_at?: string
  error_message?: string
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

    const { action, backup, filters } = await req.json()

    if (action === 'get') {
      // Build query
      let query = supabaseClient
        .from('system_backups')
        .select('*')
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters) {
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
        JSON.stringify({ success: true, backups: data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else if (action === 'create') {
      // Generate backup filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `backup-${timestamp}.sql`

      // Create backup record
      const { data, error } = await supabaseClient
        .from('system_backups')
        .insert([
          {
            filename,
            size: 0,
            status: 'pending',
          },
        ])
        .select()
        .single()

      if (error) throw error

      // Start backup process
      const backupProcess = new Deno.Command('pg_dump', {
        args: [
          '-h', Deno.env.get('POSTGRES_HOST') ?? '',
          '-p', Deno.env.get('POSTGRES_PORT') ?? '5432',
          '-U', Deno.env.get('POSTGRES_USER') ?? '',
          '-d', Deno.env.get('POSTGRES_DB') ?? '',
          '-F', 'c',
          '-f', filename,
        ],
        env: {
          PGPASSWORD: Deno.env.get('POSTGRES_PASSWORD') ?? '',
        },
      })

      const { success, stderr } = await backupProcess.output()

      if (!success) {
        // Update backup record with error
        await supabaseClient
          .from('system_backups')
          .update({
            status: 'failed',
            error_message: new TextDecoder().decode(stderr),
          })
          .eq('id', data.id)

        throw new Error(new TextDecoder().decode(stderr))
      }

      // Upload backup file to storage
      const file = await Deno.readFile(filename)
      const { error: uploadError } = await supabaseClient.storage
        .from('backups')
        .upload(filename, file)

      if (uploadError) {
        // Update backup record with error
        await supabaseClient
          .from('system_backups')
          .update({
            status: 'failed',
            error_message: uploadError.message,
          })
          .eq('id', data.id)

        throw uploadError
      }

      // Update backup record
      await supabaseClient
        .from('system_backups')
        .update({
          size: file.length,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', data.id)

      // Clean up local file
      await Deno.remove(filename)

      return new Response(
        JSON.stringify({ success: true, backup: data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else if (action === 'delete') {
      const { id } = await req.json()

      if (!id) {
        throw new Error('Backup ID is required')
      }

      // Get backup details
      const { data: backup, error: backupError } = await supabaseClient
        .from('system_backups')
        .select('*')
        .eq('id', id)
        .single()

      if (backupError) throw backupError

      // Delete backup file from storage
      const { error: deleteError } = await supabaseClient.storage
        .from('backups')
        .remove([backup.filename])

      if (deleteError) throw deleteError

      // Delete backup record
      const { error } = await supabaseClient
        .from('system_backups')
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

      // Get old backups
      const { data: oldBackups, error: oldBackupsError } = await supabaseClient
        .from('system_backups')
        .select('*')
        .lt('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())

      if (oldBackupsError) throw oldBackupsError

      // Delete old backup files
      for (const backup of oldBackups) {
        const { error: deleteError } = await supabaseClient.storage
          .from('backups')
          .remove([backup.filename])

        if (deleteError) throw deleteError
      }

      // Delete old backup records
      const { error } = await supabaseClient
        .from('system_backups')
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