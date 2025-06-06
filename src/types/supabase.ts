import { User as SupabaseUser } from '@supabase/supabase-js'

export interface User extends SupabaseUser {
  isAdmin?: boolean
  isEligibleForFoodstuff?: boolean
  referral_code?: string
  referred_by?: string
  total_referrals?: number
  active_referrals?: number
  referrals_within_40_days?: number
  created_at: string // Make required to match SupabaseUser
  updated_at?: string
}