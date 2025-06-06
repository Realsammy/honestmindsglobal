import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SystemMetric {
  name: string
  query: string
  description: string
}

const systemMetrics: SystemMetric[] = [
  {
    name: 'total_users',
    query: 'SELECT COUNT(*) as count FROM profiles',
    description: 'Total number of users',
  },
  {
    name: 'active_users',
    query: 'SELECT COUNT(*) as count FROM profiles WHERE last_sign_in_at > NOW() - INTERVAL \'30 days\'',
    description: 'Users active in the last 30 days',
  },
  {
    name: 'total_posts',
    query: 'SELECT COUNT(*) as count FROM posts',
    description: 'Total number of posts',
  },
  {
    name: 'total_comments',
    query: 'SELECT COUNT(*) as count FROM comments',
    description: 'Total number of comments',
  },
  {
    name: 'storage_usage',
    query: 'SELECT pg_size_pretty(pg_database_size(current_database())) as size',
    description: 'Total database size',
  },
  {
    name: 'table_sizes',
    query: `
      SELECT
        relname as table_name,
        pg_size_pretty(pg_total_relation_size(relid)) as total_size,
        pg_size_pretty(pg_relation_size(relid)) as table_size,
        pg_size_pretty(pg_total_relation_size(relid) - pg_relation_size(relid)) as index_size
      FROM pg_catalog.pg_statio_user_tables
      ORDER BY pg_total_relation_size(relid) DESC
    `,
    description: 'Size of each table and its indexes',
  },
  {
    name: 'index_usage',
    query: `
      SELECT
        schemaname,
        relname as table_name,
        indexrelname as index_name,
        pg_size_pretty(pg_relation_size(schemaname || \'.\' || indexrelname::regclass)) as index_size,
        idx_scan as number_of_scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched
      FROM pg_stat_user_indexes
      ORDER BY pg_relation_size(schemaname || \'.\' || indexrelname::regclass) DESC
    `,
    description: 'Index usage statistics',
  },
  {
    name: 'table_stats',
    query: `
      SELECT
        relname as table_name,
        n_live_tup as row_count,
        n_dead_tup as dead_rows,
        last_vacuum,
        last_autovacuum,
        last_analyze,
        last_autoanalyze
      FROM pg_stat_user_tables
      ORDER BY n_live_tup DESC
    `,
    description: 'Table statistics and maintenance information',
  },
  {
    name: 'query_stats',
    query: `
      SELECT
        query,
        calls,
        total_time,
        mean_time,
        rows
      FROM pg_stat_statements
      ORDER BY total_time DESC
      LIMIT 10
    `,
    description: 'Top 10 slowest queries',
  },
  {
    name: 'connection_stats',
    query: `
      SELECT
        datname as database,
        numbackends as active_connections,
        xact_commit as transactions_committed,
        xact_rollback as transactions_rolled_back,
        blks_read as blocks_read,
        blks_hit as blocks_hit,
        tup_returned as rows_returned,
        tup_fetched as rows_fetched,
        tup_inserted as rows_inserted,
        tup_updated as rows_updated,
        tup_deleted as rows_deleted
      FROM pg_stat_database
      WHERE datname = current_database()
    `,
    description: 'Database connection and transaction statistics',
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

    // Collect each metric
    for (const metric of systemMetrics) {
      const { data, error } = await supabaseClient.rpc('exec_sql', {
        query: metric.query,
      })

      if (error) throw error

      results.push({
        name: metric.name,
        description: metric.description,
        data,
      })
    }

    // Store metrics in system_metrics table
    const { error: storeError } = await supabaseClient
      .from('system_metrics')
      .insert([
        {
          cpu_usage: 0, // This would need to be collected from the system
          memory_usage: 0, // This would need to be collected from the system
          disk_usage: 0, // This would need to be collected from the system
          network_in: 0, // This would need to be collected from the system
          network_out: 0, // This would need to be collected from the system
          active_users: results.find(r => r.name === 'active_users')?.data[0]?.count || 0,
          requests_per_minute: 0, // This would need to be collected from the system
          error_rate: 0, // This would need to be collected from the system
        },
      ])

    if (storeError) throw storeError

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