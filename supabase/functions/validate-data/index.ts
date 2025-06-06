import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ValidationRule {
  table: string
  field: string
  type: 'required' | 'email' | 'url' | 'number' | 'date' | 'boolean' | 'array' | 'object'
  message: string
}

const validationRules: ValidationRule[] = [
  {
    table: 'profiles',
    field: 'email',
    type: 'email',
    message: 'Invalid email format',
  },
  {
    table: 'profiles',
    field: 'first_name',
    type: 'required',
    message: 'First name is required',
  },
  {
    table: 'profiles',
    field: 'last_name',
    type: 'required',
    message: 'Last name is required',
  },
  {
    table: 'posts',
    field: 'title',
    type: 'required',
    message: 'Title is required',
  },
  {
    table: 'posts',
    field: 'content',
    type: 'required',
    message: 'Content is required',
  },
  {
    table: 'comments',
    field: 'content',
    type: 'required',
    message: 'Content is required',
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

    // Validate each table
    for (const rule of validationRules) {
      const { data: records, error } = await supabaseClient
        .from(rule.table)
        .select('*')

      if (error) throw error

      const totalRecords = records.length
      let validRecords = 0
      let invalidRecords = 0
      const errors = []

      // Validate each record
      for (const record of records) {
        let isValid = true
        const value = record[rule.field]

        switch (rule.type) {
          case 'required':
            if (!value) {
              isValid = false
            }
            break
          case 'email':
            if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
              isValid = false
            }
            break
          case 'url':
            if (!value || !/^https?:\/\/.+/.test(value)) {
              isValid = false
            }
            break
          case 'number':
            if (typeof value !== 'number' || isNaN(value)) {
              isValid = false
            }
            break
          case 'date':
            if (!value || isNaN(Date.parse(value))) {
              isValid = false
            }
            break
          case 'boolean':
            if (typeof value !== 'boolean') {
              isValid = false
            }
            break
          case 'array':
            if (!Array.isArray(value)) {
              isValid = false
            }
            break
          case 'object':
            if (typeof value !== 'object' || value === null) {
              isValid = false
            }
            break
        }

        if (isValid) {
          validRecords++
        } else {
          invalidRecords++
          errors.push({
            field: rule.field,
            message: rule.message,
            count: 1,
          })
        }
      }

      // Aggregate errors
      const aggregatedErrors = errors.reduce((acc, error) => {
        const existingError = acc.find(
          (e) => e.field === error.field && e.message === error.message
        )
        if (existingError) {
          existingError.count++
        } else {
          acc.push(error)
        }
        return acc
      }, [])

      results.push({
        table: rule.table,
        total_records: totalRecords,
        valid_records: validRecords,
        invalid_records: invalidRecords,
        errors: aggregatedErrors,
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