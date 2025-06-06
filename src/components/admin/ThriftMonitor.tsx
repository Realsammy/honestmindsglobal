import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNotification } from '../../hooks/useNotification.tsx';
import Button from '../ui/Button';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface FailedDeduction {
  id: string;
  user_id: string;
  thrift_id: string;
  amount: number;
  attempt_date: string;
  status: 'pending' | 'completed' | 'failed';
  retry_count: number;
  last_retry_date: string | null;
  user: {
    email: string;
    full_name: string;
  };
  thrift: {
    is_primary: boolean;
  };
}

interface UserWallet {
  user_id: string;
  balance: number;
  user: {
    email: string;
    full_name: string;
  }[];
}

export default function ThriftMonitor() {
  const { showToast } = useNotification();
  const [failedDeductions, setFailedDeductions] = useState<FailedDeduction[]>([]);
  const [userWallets, setUserWallets] = useState<UserWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load failed deductions
      const { data: deductionsData, error: deductionsError } = await supabase
        .from('failed_deductions')
        .select(`
          *,
          user:profiles(email, full_name),
          thrift:thrifts(is_primary)
        `)
        .order('attempt_date', { ascending: false });

      if (deductionsError) throw deductionsError;
      setFailedDeductions(deductionsData || []);

      // Load user wallets
      const { data: walletsData, error: walletsError } = await supabase
        .from('wallets')
        .select(`
          user_id,
          balance,
          user:profiles(email, full_name)
        `)
        .order('balance', { ascending: true });

      if (walletsError) throw walletsError;
      setUserWallets(walletsData || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryDeduction = async (deductionId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .rpc('retry_failed_deduction', {
          deduction_id: deductionId
        });

      if (error) throw error;

      showToast('Deduction retry initiated', 'success');
      loadData();
    } catch (err: any) {
      console.error('Error retrying deduction:', err);
      showToast(err.message || 'Failed to retry deduction', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Failed Deductions Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Failed Deductions</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thrift Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attempt Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Retry Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {failedDeductions.map((deduction) => (
                <tr key={deduction.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{deduction.user.full_name}</div>
                    <div className="text-sm text-gray-500">{deduction.user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      deduction.thrift.is_primary ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {deduction.thrift.is_primary ? 'Primary' : 'Secondary'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₦{deduction.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(deduction.attempt_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {deduction.retry_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      deduction.status === 'completed' ? 'bg-green-100 text-green-800' :
                      deduction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {deduction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {deduction.status === 'failed' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleRetryDeduction(deduction.id)}
                      >
                        Retry
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Wallets Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">User Wallets</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {userWallets.map((wallet) => (
                <tr key={wallet.user_id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{wallet.user[0]?.full_name}</div>
                    <div className="text-sm text-gray-500">{wallet.user[0]?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₦{wallet.balance.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      wallet.balance >= 5000 ? 'bg-green-100 text-green-800' :
                      wallet.balance >= 2000 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {wallet.balance >= 5000 ? 'Sufficient' :
                       wallet.balance >= 2000 ? 'Low' :
                       'Critical'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
