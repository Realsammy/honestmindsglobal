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

    const { type } = await req.json()

    // Generate backup filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `backup-${type}-${timestamp}.sql`

    // Create backup record
    const { data: backup, error: backupError } = await supabaseClient
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

    if (backupError) throw backupError

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
      throw new Error(new TextDecoder().decode(stderr))
    }

    // Upload backup file to storage
    const file = await Deno.readFile(filename)
    const { error: uploadError } = await supabaseClient.storage
      .from('backups')
      .upload(filename, file)

    if (uploadError) throw uploadError

    // Update backup record
    const { error: updateError } = await supabaseClient
      .from('system_backups')
      .update({
        size: file.length,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', backup.id)

    if (updateError) throw updateError

    // Clean up local file
    await Deno.remove(filename)

    return new Response(
      JSON.stringify({ success: true, backup }),
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