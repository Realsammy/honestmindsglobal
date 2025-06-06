import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OptimizationRule {
  table: string
  field: string
  type: 'trim' | 'lowercase' | 'uppercase' | 'remove_duplicates' | 'normalize'
  message: string
}

const optimizationRules: OptimizationRule[] = [
  {
    table: 'profiles',
    field: 'email',
    type: 'lowercase',
    message: 'Converting email to lowercase',
  },
  {
    table: 'profiles',
    field: 'first_name',
    type: 'trim',
    message: 'Trimming whitespace from first name',
  },
  {
    table: 'profiles',
    field: 'last_name',
    type: 'trim',
    message: 'Trimming whitespace from last name',
  },
  {
    table: 'posts',
    field: 'title',
    type: 'trim',
    message: 'Trimming whitespace from title',
  },
  {
    table: 'posts',
    field: 'content',
    type: 'normalize',
    message: 'Normalizing content',
  },
  {
    table: 'comments',
    field: 'content',
    type: 'normalize',
    message: 'Normalizing content',
  },
]

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

    // Optimize each table
    for (const rule of optimizationRules) {
      const { data: records, error } = await supabaseClient
        .from(rule.table)
        .select('*')

      if (error) throw error

      const totalRecords = records.length
      let optimizedRecords = 0
      const updates = []

      // Optimize each record
      for (const record of records) {
        let value = record[rule.field]
        let isOptimized = false

        switch (rule.type) {
          case 'trim':
            if (typeof value === 'string' && value.trim() !== value) {
              value = value.trim()
              isOptimized = true
            }
            break
          case 'lowercase':
            if (typeof value === 'string' && value.toLowerCase() !== value) {
              value = value.toLowerCase()
              isOptimized = true
            }
            break
          case 'uppercase':
            if (typeof value === 'string' && value.toUpperCase() !== value) {
              value = value.toUpperCase()
              isOptimized = true
            }
            break
          case 'normalize':
            if (typeof value === 'string') {
              const normalized = value
                .replace(/\s+/g, ' ')
                .replace(/[^\w\s-]/g, '')
                .trim()
              if (normalized !== value) {
                value = normalized
                isOptimized = true
              }
            }
            break
        }

        if (isOptimized) {
          optimizedRecords++
          updates.push({
            id: record.id,
            [rule.field]: value,
          })
        }
      }

      // Batch update optimized records
      if (updates.length > 0) {
        const { error: updateError } = await supabaseClient
          .from(rule.table)
          .upsert(updates)

        if (updateError) throw updateError
      }

      results.push({
        table: rule.table,
        total_records: totalRecords,
        optimized_records: optimizedRecords,
        message: rule.message,
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