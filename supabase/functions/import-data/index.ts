import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { parse } from 'https://deno.land/std@0.168.0/encoding/csv.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ImportConfig {
  table: string
  format: 'csv' | 'json'
  required_fields: string[]
  optional_fields: string[]
  description: string
}

const importConfigs: ImportConfig[] = [
  {
    table: 'profiles',
    format: 'csv',
    required_fields: ['email', 'first_name', 'last_name'],
    optional_fields: ['avatar_url', 'bio'],
    description: 'User profiles',
  },
  {
    table: 'posts',
    format: 'csv',
    required_fields: ['user_id', 'title', 'content'],
    optional_fields: ['image_url', 'tags'],
    description: 'User posts',
  },
  {
    table: 'comments',
    format: 'csv',
    required_fields: ['post_id', 'user_id', 'content'],
    optional_fields: [],
    description: 'Post comments',
  },
]

async function parseCSV(content: string): Promise<any[]> {
  const records = await parse(content, {
    skipFirstRow: true,
    separator: ',',
  })
  return records.map(record => {
    const obj: any = {}
    for (const [key, value] of Object.entries(record)) {
      obj[key.trim()] = value.trim()
    }
    return obj
  })
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

    const { type, file } = await req.json()

    if (!file) {
      throw new Error('No file provided')
    }

    const results = []

    // Import each table
    for (const config of importConfigs) {
      let records: any[]

      if (config.format === 'csv') {
        records = await parseCSV(file)
      } else {
        records = JSON.parse(file)
      }

      // Validate required fields
      const missingFields = config.required_fields.filter(field => {
        return !records[0] || !(field in records[0])
      })

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
      }

      // Prepare records for import
      const importRecords = records.map(record => {
        const importRecord: any = {}
        for (const field of [...config.required_fields, ...config.optional_fields]) {
          if (field in record) {
            importRecord[field] = record[field]
          }
        }
        return importRecord
      })

      // Import records
      const { data, error } = await supabaseClient
        .from(config.table)
        .upsert(importRecords, {
          onConflict: 'id',
        })

      if (error) throw error

      results.push({
        table: config.table,
        format: config.format,
        description: config.description,
        imported_records: importRecords.length,
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