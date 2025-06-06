import { User as SupabaseUser } from '@supabase/supabase-js';

export interface User extends SupabaseUser {
  is_admin?: boolean;
  full_name?: string;
  phone_number?: string;
  referral_code?: string;
  referral_link?: string;
  isEligibleForFoodstuff?: boolean;
  total_referrals?: number;
  active_referrals?: number;
  referrals_within_40_days?: number;
}

export type ThriftStatus = 'active' | 'completed' | 'cancelled' | 'defaulted';
export type TransactionType = 'contribution' | 'withdrawal';
export type TransactionStatus = 'pending' | 'completed' | 'failed';
export type ComplaintStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface Thrift {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  amount: number;
  weekly_contribution: number;
  total_contributed: number;
  current_week: number;
  has_defaulted: boolean;
  default_amount: number;
  default_weeks: number[];
  frequency: 'daily' | 'weekly' | 'monthly';
  start_date: string;
  end_date: string;
  status: ThriftStatus;
  balance: number;
  created_at: string;
  updated_at: string;
  is_paid?: boolean;
  is_eligible_for_foodstuff?: boolean;
  account_id?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  thrift_id: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  reference: string;
  created_at: string;
  updated_at: string;
}

export interface Complaint {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: ComplaintStatus;
  priority: 'low' | 'medium' | 'high';
  category: 'technical' | 'financial' | 'general';
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  resolution?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
  updated_at: string;
} 