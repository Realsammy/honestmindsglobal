import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  Wallet, 
  CreditCard, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  AlertTriangle,
  Plus,
  Banknote,
  Clock,
  UserCheck,
  Gift,
  Bell,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Settings,
  HelpCircle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useThrift } from '../../hooks/useThrift';
import { Thrift, Transaction } from '../../types';
import StatsCard from '../../components/dashboard/StatsCard';
import VirtualAccountCard from '../../components/dashboard/VirtualAccountCard';
import Button from '../../components/ui/Button';
import { Chart, registerables } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';
import TestWallet from '../../components/TestWallet';
import NewThriftModal from '../../components/thrifts/NewThriftModal';
import DashboardLayout from '../../layouts/DashboardLayout';

// Register Chart.js components
Chart.register(...registerables);

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { thrifts, transactions, loading: thriftLoading } = useThrift();
  const { toast } = useToast();
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isFundingWallet, setIsFundingWallet] = useState(false);
  const [fundAmount, setFundAmount] = useState<string>('');
  const [virtualAccount, setVirtualAccount] = useState<{
    account_number: string;
    account_name: string;
    bank_name: string;
  } | null>(null);
  const [stats, setStats] = useState({
    totalBalance: 0,
    activeThrifts: 0,
    totalContributions: 0,
    pendingTransactions: 0,
    driftsCount: 0,
    referralsCount: 0,
    withdrawalsCount: 0,
    ledgerBalance: 0,
    totalDebts: 0,
    paidAccountsCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [activeThrifts, setActiveThrifts] = useState<Thrift[]>([]);
  const [showNewThriftModal, setShowNewThriftModal] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Debug output
  console.log('Dashboard user:', user, 'authLoading:', authLoading);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // Handle data loading
  useEffect(() => {
    if (!user?.id || authLoading) return;
    refreshData();
  }, [user?.id, authLoading]);

  const ensureWalletExists = async () => {
    try {
      // Check if wallet exists
      const { data: existingWallet, error: checkError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user?.id)
        .single();

      if (checkError && checkError.code === 'PGRST116') {
        // Wallet doesn't exist, create it
        const { error: createError } = await supabase
          .from('wallets')
          .insert({
            user_id: user?.id,
            balance: 0
          });

        if (createError) throw createError;
        return 0; // New wallet balance
      }

      if (checkError) throw checkError;
      return existingWallet?.balance || 0;
    } catch (err) {
      console.error('Error ensuring wallet exists:', err);
      return 0;
    }
  };

  const handleFundWallet = async () => {
    if (!virtualAccount) {
      toast({
        title: 'Error',
        description: 'Please create a virtual account first',
        type: 'error'
      });
      return;
    }

    const amount = parseFloat(fundAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid amount',
        type: 'error'
      });
      return;
    }

    try {
      setIsFundingWallet(true);

      // Ensure wallet exists
      await ensureWalletExists();

      // Show instructions for bank transfer
      const message = `Please make a bank transfer of ${formatCurrency(amount)} to:
      
Account Number: ${virtualAccount.account_number}
Account Name: ${virtualAccount.account_name}
Bank: ${virtualAccount.bank_name}

Your wallet will be credited automatically once the payment is confirmed.`;
      
      toast({
        title: 'Info',
        description: message,
        type: 'info'
      });
      setFundAmount(''); // Clear the input after showing instructions
    } catch (err) {
      console.error('Error funding wallet:', err);
      toast({
        title: 'Error',
        description: 'Failed to process wallet funding. Please try again.',
        type: 'error'
      });
    } finally {
      setIsFundingWallet(false);
    }
  };

  const refreshData = async () => {
    try {
      setIsLoading(true);
      setSubscriptionError(null);

      // Fetch wallet balance
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user?.id)
        .single();

      if (walletError) throw walletError;
      setWalletBalance(walletData?.balance || 0);

      // Fetch recent transactions
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (txError) throw txError;
      setRecentTransactions(transactions || []);

      // Fetch user thrifts
      const { data: thrifts, error: thriftError } = await supabase
        .from('thrifts')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (thriftError) throw thriftError;
      setActiveThrifts(thrifts || []);

      // Fetch virtual account
      const { data: vaData, error: vaError } = await supabase
        .from('virtual_accounts')
        .select('account_number, account_name, bank_name')
        .eq('user_id', user?.id)
        .single();
      if (!vaError && vaData) {
        setVirtualAccount(vaData);
      }

      // Update stats
      updateStats(transactions || [], thrifts || []);
      
      setRetryCount(0); // Reset retry count on successful refresh
    } catch (error) {
      console.error('Error refreshing data:', error);
      setSubscriptionError('Failed to load dashboard data');
      if (retryCount < 3) {
        setRetryCount(prev => prev + 1);
        setTimeout(refreshData, 2000); // Retry after 2 seconds
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    let transactionsSubscription: any;
    let thriftsSubscription: any;
    let walletSubscription: any;

    const setupSubscriptions = async () => {
      try {
        setSubscriptionError(null);
        
        // Initial data load
        await refreshData();

        // Subscribe to transactions table changes
        transactionsSubscription = supabase
          .channel('dashboard_transactions_changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'transactions',
              filter: `user_id=eq.${user.id}`,
            },
            async () => {
              try {
                const { data: transactions, error: txError } = await supabase
                  .from('transactions')
                  .select('*')
                  .eq('user_id', user.id)
                  .order('created_at', { ascending: false })
                  .limit(5);

                if (!txError && transactions) {
                  setRecentTransactions(transactions);
                  updateStats(transactions);
                }
              } catch (error) {
                console.error('Error handling transaction update:', error);
              }
            }
          )
          .subscribe();

        // Subscribe to thrifts table changes
        thriftsSubscription = supabase
          .channel('dashboard_thrifts_changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'thrifts',
              filter: `user_id=eq.${user.id}`,
            },
            async () => {
              try {
                const { data: thrifts, error: thriftError } = await supabase
                  .from('thrifts')
                  .select('*')
                  .eq('user_id', user.id)
                  .eq('status', 'active')
                  .order('created_at', { ascending: false });

                if (!thriftError && thrifts) {
                  setActiveThrifts(thrifts);
                  updateStats(null, thrifts);
                }
              } catch (error) {
                console.error('Error handling thrift update:', error);
              }
            }
          )
          .subscribe();

        // Subscribe to wallet changes
        walletSubscription = supabase
          .channel('dashboard_wallet_changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'wallets',
              filter: `user_id=eq.${user.id}`,
            },
            async () => {
              try {
                const { data: walletData, error: walletError } = await supabase
                  .from('wallets')
                  .select('balance')
                  .eq('user_id', user.id)
                  .single();

                if (!walletError && walletData) {
                  setWalletBalance(walletData.balance || 0);
                }
              } catch (error) {
                console.error('Error handling wallet update:', error);
              }
            }
          )
          .subscribe();

      } catch (error) {
        console.error('Error setting up subscriptions:', error);
        setSubscriptionError('Failed to set up real-time updates');
      }
    };

    setupSubscriptions();

    // Cleanup subscriptions
    return () => {
      if (transactionsSubscription) transactionsSubscription.unsubscribe();
      if (thriftsSubscription) thriftsSubscription.unsubscribe();
      if (walletSubscription) walletSubscription.unsubscribe();
    };
  }, [user?.id]);

  // Helper function to update stats
  const updateStats = (transactions?: Transaction[] | null, thrifts?: Thrift[] | null) => {
    const currentTransactions: Transaction[] = transactions || recentTransactions;
    const currentThrifts: Thrift[] = thrifts || activeThrifts;

    const totalBalance = currentThrifts.reduce((sum, thrift) => sum + Number(thrift.balance), 0);
    const activeThriftsCount = currentThrifts.length;
    const totalContributions = currentTransactions
      .filter(t => t.type === 'contribution' && t.status === 'completed')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const withdrawalsCount = currentTransactions
      .filter(t => t.type === 'withdrawal' && t.status === 'completed')
      .length;
    const ledgerBalance = totalBalance - withdrawalsCount * 1000; // Assuming 1000 is the withdrawal amount
    const totalDebts = currentThrifts
      .filter(t => t.has_defaulted)
      .reduce((sum, t) => sum + Number(t.default_amount), 0);
    const paidAccountsCount = currentThrifts.filter(t => t.is_paid).length;

    setStats({
      totalBalance,
      activeThrifts: activeThriftsCount,
      totalContributions,
      pendingTransactions: 0, // Assuming this is calculated elsewhere or set to 0 for now
      driftsCount: activeThriftsCount,
      referralsCount: user?.total_referrals || 0,
      withdrawalsCount,
      ledgerBalance,
      totalDebts,
      paidAccountsCount
    });
  };

  // Chart data for weekly contributions
  const contributionsByWeek = Array(12).fill(0); // 12 weeks
  
  // Fill data for weeks that have contributions
  transactions
    .filter(tx => tx.type === 'contribution')
    .forEach(tx => {
      const txDate = new Date(tx.created_at);
      const weekIndex = Math.floor((Date.now() - txDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
      if (weekIndex >= 0 && weekIndex < 12) {
        contributionsByWeek[weekIndex] += Number(tx.amount);
      }
    });

  // Reverse so most recent is on the right
  contributionsByWeek.reverse();

  const chartData = {
    labels: Array.from({ length: 12 }, (_, i) => `Week ${12 - i}`),
    datasets: [
      {
        label: 'Contributions',
        data: contributionsByWeek,
        borderColor: '#0F766E',
        backgroundColor: 'rgba(15, 118, 110, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-NG', {
                style: 'currency',
                currency: 'NGN',
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return '₦' + value.toLocaleString();
          }
        }
      }
    },
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  console.log('Rendering dashboard for user:', user.email);
  return (
    <DashboardLayout>
      <div className="w-full md:ml-64 py-6 px-4 sm:px-6 lg:px-8 transition-all duration-300">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            {/* Dashboard Navbar */}

            <p className="mt-4 text-gray-600">
              Welcome back, {user.full_name}!
            </p>
            {/* Dashboard Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 gap-x-8 mt-8">
              <StatsCard title="Wallet Balance" value={formatCurrency(walletBalance)} icon={<Wallet size={28} />} />
              <StatsCard title="Total Thrift Account" value={stats.activeThrifts} icon={<Users size={28} />} />
              <StatsCard title="Total Referrals" value={stats.referralsCount} icon={<UserCheck size={28} />} />
              <StatsCard title="Active Plan(s)" value={stats.activeThrifts} icon={<BarChart3 size={28} />} />
              <StatsCard title="Total Contributions" value={formatCurrency(stats.totalContributions)} icon={<ArrowUpRight size={28} />} />
              <StatsCard title="Total Debts (Defaults)" value={formatCurrency(stats.totalDebts)} icon={<AlertTriangle size={28} />} />
              <StatsCard title="Pending Settlements Accounts" value={stats.pendingTransactions} icon={<Clock size={28} />} />
              <StatsCard title="Total Paid Accounts" value={stats.paidAccountsCount} icon={<CheckCircle size={28} />} />
              <StatsCard title="Ledger Balance" value={formatCurrency(stats.ledgerBalance)} icon={<TrendingUp size={28} />} />
              {/* Virtual Account Card */}
              {virtualAccount && (
                <StatsCard
                  title="Virtual Account"
                  icon={<Banknote size={28} />}
                  value={
                    <div>
                      <div><strong>Account Number:</strong> {virtualAccount.account_number}</div>
                      <div><strong>Account Name:</strong> {virtualAccount.account_name}</div>
                      <div><strong>Bank:</strong> {virtualAccount.bank_name}</div>
                    </div>
                  }
                />
              )}
              {/* Placeholder for Current Thrift Weeks */}
              <StatsCard title="Current Thrift Weeks" value={"-"} icon={<Calendar size={28} />} />
              {/* Placeholder for Bonus Wallet (Affiliate) */}
              <StatsCard title="Bonus Wallet (Affiliate)" value={"-"} icon={<Gift size={28} />} />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
