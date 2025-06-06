export interface User {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  referral_code: string;
  referral_link: string;
  created_at: string;
  updated_at: string;
  virtual_accounts?: {
    account_number: string;
    account_name: string;
    bank_name: string;
    is_active: boolean;
  }[];
  bankDetails?: BankDetails;
  isAdmin: boolean;
  isEligibleForFoodstuff: boolean;
  referred_by?: string;
  total_referrals: number;
  active_referrals: number;
  referrals_within_40_days: number;
}

export interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
}

export type ThriftStatus = 'active' | 'completed' | 'defaulted' | 'cancelled';

export interface Thrift {
  id: string;
  user_id: string;
  balance: number;
  total_contributed: number;
  weekly_contribution: number;
  start_date: string;
  end_date: string;
  status: ThriftStatus;
  current_week: number;
  referral_id?: string;
  has_defaulted: boolean;
  default_weeks: number[];
  default_amount: number;
  is_paid: boolean;
  is_eligible_for_foodstuff: boolean;
  created_at: string;
  account_id: string;
}

export type TransactionType = 'contribution' | 'withdrawal' | 'refund' | 'penalty';

export type TransactionStatus = 'pending' | 'successful' | 'failed';

export interface Transaction {
  id: string;
  user_id: string;
  thrift_id: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  created_at: string;
  updated_at: string;
}

export type ComplaintStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type ComplaintPriority = 'low' | 'medium' | 'high';
export type ComplaintCategory = 'technical' | 'billing' | 'account' | 'other';

export interface Complaint {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  category: ComplaintCategory;
  resolution?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  admin_id?: string;
  // Joined data
  users?: {
    full_name: string;
    email: string;
    is_admin: boolean;
  };
  admin?: {
    full_name: string;
  };
}

export interface DashboardStats {
  totalBalance: number;
  driftsCount: number;
  referralsCount: number;
  totalContributions: number;
  withdrawalsCount: number;
  ledgerBalance: number;
  totalDebts: number;
  paidAccountsCount: number;
}

export interface FoodieSettlement {
  id: string;
  userId: string;
  thriftIds: string[];
  status: SettlementStatus;
  scheduledDate?: string;
  deliveryDate?: string;
  items: FoodItem[];
  createdAt: string;
  updatedAt: string;
}

export interface FoodItem {
  name: string;
  quantity: number;
  unit: string;
}

export enum SettlementStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  DELIVERED = 'delivered'
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  created_at: string;
}

export interface AdminStats {
  totalUsers: number;
  activeThrifts: number;
  totalContributions: number;
  pendingWithdrawals: number;
  pendingComplaints: number;
  activeUsers: number;
  defaultedThrifts: number;
  defaultedAmount: number;
}

export interface VirtualAccount {
  id: string;
  userId: string;
  accountNumber: string;
  bankName: string;
  txRef: string;
  flwRef?: string;
  createdAt: string;
  orderRef?: string;
  frequency: string;
  isActive: boolean;
}

export interface FlutterwaveConfig {
  publicKey: string;
  secretKey: string;
  encryptionKey: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  is_active?: boolean;
  is_admin?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  created_at: string;
  updated_at: string;
}