import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './ui/Toast';
import Button from './ui/Button';
import { supabase } from '../lib/supabase';
import { useThrift } from '../hooks/useThrift.ts';

interface TestWalletProps {
  onSuccess?: () => void;
}

export default function TestWallet({ onSuccess }: TestWalletProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { createThrift } = useThrift();
  const [isLoading, setIsLoading] = useState(false);
  const [testAmount, setTestAmount] = useState('2000');

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
      throw err;
    }
  };

  const handleTestWalletFunding = async () => {
    setIsLoading(true);
    try {
      // Ensure wallet exists first
      await ensureWalletExists();

      // Get current wallet balance
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user?.id)
        .single();

      if (walletError) throw walletError;

      // Update wallet balance
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ balance: (walletData?.balance || 0) + Number(testAmount) })
        .eq('user_id', user?.id);

      if (updateError) throw updateError;

      // Create transaction record
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          amount: Number(testAmount),
          type: 'wallet_funding',
          status: 'completed',
          reference: `TEST-${Date.now()}`,
          description: 'Test wallet funding',
          created_at: new Date().toISOString()
        });

      if (txError) throw txError;

      toast({
        title: 'Success',
        description: 'Test wallet funding successful!',
        type: 'success'
      });
      onSuccess?.(); // Notify parent to refresh data
    } catch (error) {
      console.error('Test failed:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to test wallet funding',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestThriftCreation = async () => {
    setIsLoading(true);
    try {
      // Ensure wallet exists first
      await ensureWalletExists();

      // Get current wallet balance
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user?.id)
        .single();

      if (walletError) {
        console.error('Wallet error:', walletError);
        throw new Error(`Failed to get wallet balance: ${walletError.message}`);
      }

      if ((walletData?.balance || 0) < 3000) {
        throw new Error('Insufficient wallet balance. Need ₦3,000 for registration.');
      }

      // Create new thrift account using ThriftContext
      await createThrift({});

      toast({
        title: 'Success',
        description: 'Test thrift account created successfully!',
        type: 'success'
      });
      onSuccess?.(); // Notify parent to refresh data
    } catch (error) {
      console.error('Test failed:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create test thrift account',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestWeeklyContribution = async () => {
    setIsLoading(true);
    try {
      // Ensure wallet exists first
      await ensureWalletExists();

      // Get all user's active thrifts
      const { data: thrifts, error: thriftError } = await supabase
        .from('thrifts')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'active');

      if (thriftError) {
        console.error('Error fetching thrifts:', thriftError);
        throw new Error('Failed to fetch thrift accounts');
      }

      if (!thrifts || thrifts.length === 0) {
        console.error('No active thrifts found for user:', user?.id);
        throw new Error('No active thrift account found');
      }

      // Get current wallet balance
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user?.id)
        .single();

      if (walletError) throw walletError;

      const totalRequired = thrifts.length * 2000; // ₦2,000 per thrift account
      if ((walletData?.balance || 0) < totalRequired) {
        throw new Error(`Insufficient wallet balance. Need ₦${totalRequired.toLocaleString()} for ${thrifts.length} thrift account(s).`);
      }

      // Deduct total amount from wallet once
      const { error: walletUpdateError } = await supabase
        .from('wallets')
        .update({ balance: (walletData?.balance || 0) - totalRequired })
        .eq('user_id', user?.id);

      if (walletUpdateError) throw walletUpdateError;

      // Process each thrift account
      for (const thrift of thrifts) {
        // Create transaction record
        const { error: txError } = await supabase
          .from('transactions')
          .insert({
            user_id: user?.id,
            thrift_id: thrift.thrift_id,
            amount: 2000,
            type: 'weekly_contribution',
            status: 'completed',
            reference: `CONT-${Date.now()}-${thrift.thrift_id}`,
            description: `Weekly contribution for ${thrift.name || 'Thrift Account'}`,
            created_at: new Date().toISOString()
          });

        if (txError) {
          console.error('Transaction error:', txError);
          throw new Error(`Failed to create transaction: ${txError.message}`);
        }

        // Update thrift balance
        const { error: thriftUpdateError } = await supabase
          .from('thrifts')
          .update({ 
            total_contributed: (thrift.total_contributed || 0) + 2000,
            balance: (thrift.balance || 0) + 2000,
            last_contribution_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('thrift_id', thrift.thrift_id);

        if (thriftUpdateError) {
          console.error('Thrift update error:', thriftUpdateError);
          throw new Error(`Failed to update thrift: ${thriftUpdateError.message}`);
        }
      }

      toast({
        title: 'Success',
        description: `Successfully contributed ₦2,000 to ${thrifts.length} thrift account(s)!`,
        type: 'success'
      });
      onSuccess?.(); // Notify parent to refresh data
    } catch (error) {
      console.error('Test failed:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process test weekly contribution',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Test Wallet & Payments</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Test Amount (₦)
          </label>
          <input
            type="number"
            value={testAmount}
            onChange={(e) => setTestAmount(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            min="0"
            step="100"
          />
        </div>

        <div className="space-y-2">
          <Button
            onClick={handleTestWalletFunding}
            isLoading={isLoading}
            className="w-full"
          >
            Test Wallet Funding
          </Button>

          <Button
            onClick={handleTestThriftCreation}
            isLoading={isLoading}
            className="w-full"
          >
            Test Thrift Account Creation
          </Button>

          <Button
            onClick={handleTestWeeklyContribution}
            isLoading={isLoading}
            className="w-full"
          >
            Test Weekly Contribution
          </Button>
        </div>
      </div>
    </div>
  );
}
