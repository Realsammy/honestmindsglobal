import { User, Thrift, ThriftStatus, Transaction, TransactionType, TransactionStatus, Complaint, ComplaintStatus, Notification } from '../types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: 'user-1',
    full_name: 'John Doe',
    email: 'john@example.com',
    phone_number: '08012345678',
    referral_code: 'REF123456',
    referral_link: 'https://honesmind.com/ref/REF123456',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_admin: false,
    isEligibleForFoodstuff: false,
    total_referrals: 0,
    active_referrals: 0,
    referrals_within_40_days: 0,
    // Required Supabase User properties
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    role: 'authenticated'
  },
  {
    id: 'user-2',
    full_name: 'Jane Smith',
    email: 'jane@example.com',
    phone_number: '08087654321',
    referral_code: 'REF789012',
    referral_link: 'https://honesmind.com/ref/REF789012',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    is_admin: true,
    isEligibleForFoodstuff: true,
    total_referrals: 5,
    active_referrals: 3,
    referrals_within_40_days: 3,
    // Required Supabase User properties
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    role: 'authenticated'
  }
];

// Mock Thrifts
export const mockThrifts: Thrift[] = [
  {
    id: 'thrift-1',
    user_id: 'user-1',
    name: 'Weekly Savings',
    description: 'Weekly savings plan',
    amount: 100000,
    balance: 50000,
    total_contributed: 100000,
    weekly_contribution: 5000,
    start_date: '2024-01-01T00:00:00Z',
    end_date: '2024-12-31T00:00:00Z',
    status: 'active',
    current_week: 10,
    has_defaulted: false,
    default_weeks: [],
    default_amount: 0,
    is_paid: true,
    is_eligible_for_foodstuff: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    account_id: 'ACC123456',
    frequency: 'weekly'
  }
];

// Mock Transactions
export const mockTransactions: Transaction[] = [
  {
    id: 'tx-1',
    user_id: 'user-1',
    thrift_id: 'thrift-1',
    type: 'contribution',
    amount: 5000,
    status: 'completed',
    reference: 'REF123',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

// Mock Complaints
export const mockComplaints: Complaint[] = [
  {
    id: 'complaint-1',
    user_id: 'user-1',
    title: 'Payment Issue',
    description: 'Unable to make payment',
    status: 'open',
    priority: 'high',
    category: 'financial',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

// Mock Notifications
export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    user_id: 'user-1',
    title: 'Welcome',
    message: 'Welcome to Honesmind!',
    type: 'info',
    read: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];