import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNotification } from '../hooks/useNotification.tsx';
import Button from './ui/Button';
import { Plus, AlertCircle, Wallet } from 'lucide-react';
import { Thrift, Transaction, ThriftStatus } from '../types';
import NewThriftModal from './thrifts/NewThriftModal';

export default function ThriftManager() {
  const { showToast } = useNotification();
  const [thrifts, setThrifts] = useState<Thrift[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewThriftModal, setShowNewThriftModal] = useState(false);
  const [isCreatingThrift, setIsCreatingThrift] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      // Fetch wallet balance
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (walletError) throw walletError;
      setWalletBalance(walletData?.balance || 0);

      // Fetch thrifts
      const { data: thriftsData, error: thriftsError } = await supabase
        .from('thrifts')
        .select(`
          id,
          user_id,
          balance,
          total_contributed,
          weekly_contribution,
          start_date,
          end_date,
          status,
          current_week,
          referral_id,
          has_defaulted,
          default_weeks,
          default_amount,
          is_paid,
          is_eligible_for_foodstuff,
          created_at,
          account_id
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (thriftsError) throw thriftsError;
      setThrifts(
        (thriftsData || []).map((t: any) => ({
          ...t,
          weekly_contribution: t.weekly_contribution ?? t.weekly_amount ?? 0,
          default_weeks: t.default_weeks ?? [],
          default_amount: t.default_amount ?? 0,
          is_paid: t.is_paid ?? false,
          account_id: t.account_id ?? t.id,
        }))
      );

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Format currency helper function
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '₦0.00';
    }
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Format date helper function
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Wallet Section */}
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Wallet Balance</h2>
            <p className="text-2xl md:text-3xl font-bold text-primary-600 mt-1">{formatCurrency(walletBalance)}</p>
            {walletBalance < 5000 && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <AlertCircle size={16} className="mr-1" />
                Minimum balance of ₦5,000 required to create a thrift account
              </p>
            )}
          </div>
          <Button
            variant="primary"
            leftIcon={<Wallet size={16} />}
            onClick={() => {/* TODO: Implement wallet funding */}}
            className="w-full md:w-auto"
          >
            Fund Wallet
          </Button>
        </div>
      </div>

      {/* Thrift Accounts Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 md:p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Thrift Accounts</h2>
              {walletBalance < 5000 && (
                <div className="mt-2 flex items-center text-sm text-red-600">
                  <AlertCircle size={16} className="mr-1" />
                  Cannot create thrift account. You must have at least ₦5,000 in your wallet (₦3,000 registration + ₦2,000 first week's contribution)
                </div>
              )}
            </div>
            <Button
              variant="primary"
              leftIcon={<Plus size={16} />}
              onClick={() => setShowNewThriftModal(true)}
              disabled={walletBalance < 5000}
              className="w-full md:w-auto"
            >
              Create New Thrift
            </Button>
          </div>
        </div>

        {/* Thrift Accounts List */}
        {thrifts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account ID
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weekly Amount
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Contributed
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {thrifts.map((thrift) => (
                  <tr key={thrift.id} className="hover:bg-gray-50">
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {thrift.id}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(thrift.weekly_contribution)}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(thrift.balance)}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(thrift.total_contributed)}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        thrift.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {thrift.status}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(thrift.start_date)}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {/* TODO: Implement view details */}}
                        className="w-full md:w-auto"
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <Wallet size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Thrift Accounts</h3>
            <p className="text-gray-500 mb-4">Create your first thrift account to start saving</p>
            <Button
              variant="primary"
              leftIcon={<Plus size={16} />}
              onClick={() => setShowNewThriftModal(true)}
              disabled={walletBalance < 5000}
            >
              Create New Thrift
            </Button>
          </div>
        )}
      </div>

      {/* New Thrift Modal */}
      <NewThriftModal
        isOpen={showNewThriftModal}
        onClose={() => {
          setShowNewThriftModal(false);
          loadData(); // Refresh data after modal closes
        }}
      />
    </div>
  );
}
