import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalysisMetric {
  table: string
  metric: string
  query: string
  description: string
}

const analysisMetrics: AnalysisMetric[] = [
  {
    table: 'profiles',
    metric: 'total_users',
    query: 'SELECT COUNT(*) as count FROM profiles',
    description: 'Total number of users',
  },
  {
    table: 'profiles',
    metric: 'active_users',
    query: 'SELECT COUNT(*) as count FROM profiles WHERE last_sign_in_at > NOW() - INTERVAL \'30 days\'',
    description: 'Users active in the last 30 days',
  },
  {
    table: 'posts',
    metric: 'total_posts',
    query: 'SELECT COUNT(*) as count FROM posts',
    description: 'Total number of posts',
  },
  {
    table: 'posts',
    metric: 'posts_by_user',
    query: 'SELECT user_id, COUNT(*) as count FROM posts GROUP BY user_id ORDER BY count DESC LIMIT 10',
    description: 'Top 10 users by post count',
  },
  {
    table: 'comments',
    metric: 'total_comments',
    query: 'SELECT COUNT(*) as count FROM comments',
    description: 'Total number of comments',
  },
  {
    table: 'comments',
    metric: 'comments_by_post',
    query: 'SELECT post_id, COUNT(*) as count FROM comments GROUP BY post_id ORDER BY count DESC LIMIT 10',
    description: 'Top 10 posts by comment count',
  },
  {
    table: 'posts',
    metric: 'posts_by_date',
    query: 'SELECT DATE(created_at) as date, COUNT(*) as count FROM posts GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 30',
    description: 'Posts per day for the last 30 days',
  },
  {
    table: 'comments',
    metric: 'comments_by_date',
    query: 'SELECT DATE(created_at) as date, COUNT(*) as count FROM comments GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 30',
    description: 'Comments per day for the last 30 days',
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

    // Analyze each metric
    for (const metric of analysisMetrics) {
      const { data, error } = await supabaseClient.rpc('exec_sql', {
        query: metric.query,
      })

      if (error) throw error

      results.push({
        table: metric.table,
        metric: metric.metric,
        description: metric.description,
        data,
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