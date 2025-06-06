import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { backupId } = await req.json()

    // Get backup details
    const { data: backup, error: backupError } = await supabaseClient
      .from('system_backups')
      .select('*')
      .eq('id', backupId)
      .single()

    if (backupError) throw backupError

    if (backup.status !== 'completed') {
      throw new Error('Backup is not completed')
    }

    // Download backup file
    const { data: file, error: downloadError } = await supabaseClient.storage
      .from('backups')
      .download(backup.filename)

    if (downloadError) throw downloadError

    // Save file locally
    const fileArray = new Uint8Array(await file.arrayBuffer())
    await Deno.writeFile(backup.filename, fileArray)

    // Restore database
    const restoreProcess = new Deno.Command('pg_restore', {
      args: [
        '-h', Deno.env.get('POSTGRES_HOST') ?? '',
        '-p', Deno.env.get('POSTGRES_PORT') ?? '5432',
        '-U', Deno.env.get('POSTGRES_USER') ?? '',
        '-d', Deno.env.get('POSTGRES_DB') ?? '',
        '-c', // Clean (drop) database objects before recreating
        '-v', // Verbose mode
        backup.filename,
      ],
      env: {
        PGPASSWORD: Deno.env.get('POSTGRES_PASSWORD') ?? '',
      },
    })

    const { success, stderr } = await restoreProcess.output()

    if (!success) {
      throw new Error(new TextDecoder().decode(stderr))
    }

    // Clean up local file
    await Deno.remove(backup.filename)

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
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