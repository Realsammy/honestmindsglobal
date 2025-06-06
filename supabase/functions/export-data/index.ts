import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExportConfig {
  table: string
  format: 'csv' | 'json'
  fields: string[]
  description: string
}

const exportConfigs: ExportConfig[] = [
  {
    table: 'profiles',
    format: 'csv',
    fields: ['id', 'email', 'first_name', 'last_name', 'created_at', 'updated_at'],
    description: 'User profiles',
  },
  {
    table: 'posts',
    format: 'csv',
    fields: ['id', 'user_id', 'title', 'content', 'created_at', 'updated_at'],
    description: 'User posts',
  },
  {
    table: 'comments',
    format: 'csv',
    fields: ['id', 'post_id', 'user_id', 'content', 'created_at', 'updated_at'],
    description: 'Post comments',
  },
]

function convertToCSV(data: any[], fields: string[]): string {
  const header = fields.join(',')
  const rows = data.map(record => {
    return fields.map(field => {
      const value = record[field]
      if (value === null || value === undefined) return ''
      if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`
      return value
    }).join(',')
  })
  return [header, ...rows].join('\n')
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

    const results = []

    // Export each table
    for (const config of exportConfigs) {
      const { data: records, error } = await supabaseClient
        .from(config.table)
        .select(config.fields.join(','))

      if (error) throw error

      let content: string
      let filename: string
      let contentType: string

      if (config.format === 'csv') {
        content = convertToCSV(records, config.fields)
        filename = `${config.table}-${new Date().toISOString()}.csv`
        contentType = 'text/csv'
      } else {
        content = JSON.stringify(records, null, 2)
        filename = `${config.table}-${new Date().toISOString()}.json`
        contentType = 'application/json'
      }

      // Upload file to storage
      const { error: uploadError } = await supabaseClient.storage
        .from('exports')
        .upload(filename, new TextEncoder().encode(content), {
          contentType,
          upsert: true,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabaseClient.storage
        .from('exports')
        .getPublicUrl(filename)

      results.push({
        table: config.table,
        format: config.format,
        description: config.description,
        filename,
        url: publicUrl,
        record_count: records.length,
      })
    }

    return new Response(
      JSON.stringify({ success: true, results }),
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