import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.ts';
import { supabase } from '../../lib/supabase.ts';
import { motion } from 'framer-motion';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  CreditCard, 
  Banknote,
  Calendar,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Download
} from 'lucide-react';
import Button from '../../components/ui/Button.tsx';
import { useNotification } from '../../hooks/useNotification.tsx';

interface WalletTransaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  reference: string;
}

const WalletTransactions = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      
      // Fetch wallet balance
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user?.id)
        .single();

      if (walletError) throw walletError;
      setWalletBalance(walletData?.balance || 0);

      // Fetch all transactions from the transactions table
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the transactions to match our interface
      const transformedTransactions = (data || []).map(tx => {
        console.log('Transaction:', tx); // Debug log
        const type = getTransactionType(tx);
        console.log('Determined type:', type); // Debug log
        return {
          id: tx.id,
          amount: tx.amount,
          type,
          description: tx.description || getTransactionDescription(tx),
          status: tx.status || 'completed',
          created_at: tx.created_at,
          reference: tx.reference || tx.id
        };
      });

      setTransactions(transformedTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      showToast('Failed to load transactions', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to determine transaction type
  const getTransactionType = (tx: any): 'credit' | 'debit' => {
    // Debug log
    console.log('Getting type for transaction:', tx.type);
    
    // Check if it's a wallet funding transaction
    if (tx.type === 'WALLET_FUNDING' || tx.description?.toLowerCase().includes('wallet funding')) {
      return 'credit';
    }

    switch (tx.type) {
      case 'WALLET_FUNDING':
      case 'REFUND':
      case 'REFERRAL_BONUS':
      case 'THRIFT_PAYOUT':
      case 'TEST_WALLET_FUNDING': // Add test wallet funding
        return 'credit';
      case 'WITHDRAWAL':
      case 'CONTRIBUTION':
      case 'REGISTRATION_FEE':
      case 'DEFAULT_PAYMENT':
      case 'SERVICE_FEE':
        return 'debit';
      default:
        // If we can't determine the type, check the description
        if (tx.description?.toLowerCase().includes('wallet funding')) {
          return 'credit';
        }
        return 'debit';
    }
  };

  // Helper function to generate transaction descriptions
  const getTransactionDescription = (tx: any) => {
    // Debug log
    console.log('Getting description for transaction:', tx.type);
    
    switch (tx.type) {
      case 'CONTRIBUTION':
        return `Weekly contribution for ${tx.thrift_name || 'thrift'}`;
      case 'WALLET_FUNDING':
      case 'TEST_WALLET_FUNDING':
        return 'Wallet funding';
      case 'WITHDRAWAL':
        return 'Withdrawal from wallet';
      case 'REGISTRATION_FEE':
        return 'Thrift registration fee';
      case 'DEFAULT_PAYMENT':
        return 'Default payment';
      case 'REFUND':
        return 'Refund';
      case 'REFERRAL_BONUS':
        return 'Referral bonus';
      case 'THRIFT_PAYOUT':
        return 'Thrift payout';
      case 'SERVICE_FEE':
        return 'Service fee';
      default:
        // If the type is not recognized, use the description if available
        return tx.description || tx.type.replace(/_/g, ' ').toLowerCase();
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchTransactions();

      // Subscribe to real-time updates for the transactions table
      const subscription = supabase
        .channel('transactions_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'transactions',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchTransactions();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user?.id]);

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.reference.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDate = dateFilter === 'all' ? true :
      dateFilter === 'today' ? new Date(transaction.created_at).toDateString() === new Date().toDateString() :
      dateFilter === 'week' ? new Date(transaction.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) :
      new Date(transaction.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const matchesType = typeFilter === 'all' ? true : transaction.type === typeFilter;
    const matchesStatus = statusFilter === 'all' ? true : transaction.status === statusFilter;

    return matchesSearch && matchesDate && matchesType && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success-100 text-success-600';
      case 'pending':
        return 'bg-warning-100 text-warning-600';
      case 'failed':
        return 'bg-error-100 text-error-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const exportTransactions = () => {
    const csvContent = [
      ['Date', 'Description', 'Type', 'Amount', 'Status', 'Reference'],
      ...filteredTransactions.map(tx => [
        formatDate(tx.created_at),
        tx.description,
        tx.type,
        formatCurrency(tx.amount),
        tx.status,
        tx.reference
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `wallet-transactions-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Wallet Transactions</h1>
            <p className="mt-1 text-gray-500">View and manage your wallet transactions</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-4">
            <Button
              variant="secondary"
              leftIcon={<Download size={16} />}
              onClick={exportTransactions}
            >
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Wallet Balance Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-6 mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Wallet Balance</h2>
            <p className="text-3xl font-bold text-primary-600 mt-1">{formatCurrency(walletBalance)}</p>
          </div>
          <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
            <Wallet size={24} className="text-primary-600" />
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm p-6 mb-8"
      >
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            <Button
              variant="outline"
              leftIcon={showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="credit">Credits</option>
                <option value="debit">Debits</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          )}
        </div>
      </motion.div>

      {/* Transactions List */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <motion.tr
                    key={transaction.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(transaction.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.type === 'credit' 
                          ? 'bg-success-100 text-success-800'
                          : 'bg-error-100 text-error-800'
                      }`}>
                        {transaction.type === 'credit' ? (
                          <ArrowUpRight size={12} className="mr-1" />
                        ) : (
                          <ArrowDownRight size={12} className="mr-1" />
                        )}
                        {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={transaction.type === 'credit' ? 'text-success-600' : 'text-error-600'}>
                        {transaction.type === 'credit' ? '+' : '-'} {formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.reference}
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default WalletTransactions;
