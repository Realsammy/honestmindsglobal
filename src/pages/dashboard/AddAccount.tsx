import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { useFlutterwave } from 'flutterwave-react-v3';
import { motion } from 'framer-motion';
import { PlusCircle, ArrowLeft } from 'lucide-react';
import Button from '../../components/ui/Button';
import { useNotification } from '../../hooks/useNotification.tsx';
import { supabase } from '../../lib/supabase';

const AddAccount = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [newAccountData, setNewAccountData] = useState<{
    accountId: string;
    referralId: string;
  } | null>(null);

  const generateUniqueId = useCallback((prefix: string) => {
    // Get last 4 digits of timestamp
    const timestamp = Date.now().toString().slice(-4);
    // Get 3 random alphanumeric characters
    const randomStr = Math.random().toString(36).substring(2, 5);
    // Calculate remaining length needed
    const remainingLength = 20 - prefix.length - timestamp.length - randomStr.length;
    // Generate padding if needed
    const padding = '0'.repeat(Math.max(0, remainingLength));
    // Combine to create a 20-character ID
    return `${prefix}${timestamp}${randomStr}${padding}`.slice(0, 20);
  }, []);

  const handlePaymentSuccess = useCallback(async (response: any) => {
    try {
      setIsLoading(true);
      
      if (!newAccountData) {
        console.error('Account data not found:', newAccountData);
        throw new Error('Account data not found');
      }

      // Get current wallet balance
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user?.id)
        .single();

      if (walletError) {
        console.error('Error fetching wallet:', walletError);
        throw walletError;
      }

      // Update wallet balance
      const { error: updateWalletError } = await supabase
        .from('wallets')
        .update({ balance: (walletData?.balance || 0) + 3000 })
        .eq('user_id', user?.id);

      if (updateWalletError) {
        console.error('Error updating wallet:', updateWalletError);
        throw updateWalletError;
      }

      // Create new account in the database
      const { data: newAccount, error: accountError } = await supabase
        .from('user_accounts')
        .insert({
          user_id: user?.id,
          account_id: newAccountData.accountId,
          referral_id: newAccountData.referralId,
          account_type: 'thrift',
          wallet_balance: 0,
          total_referrals: 0,
          referrals_within_40days: 0,
          active_referrals: 0,
          is_active: true
        })
        .select()
        .single();

      if (accountError) {
        console.error('Error creating account:', accountError);
        throw accountError;
      }

      // Create transaction record for registration fee
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          account_id: newAccountData.accountId,
          amount: 3000,
          type: 'REGISTRATION',
          status: 'COMPLETED',
          reference: response.transaction_id,
          description: 'New thrift account registration fee'
        });

      if (transactionError) {
        console.error('Error creating transaction:', transactionError);
        throw transactionError;
      }

      // Show success message
      showToast('New account created successfully!', 'success');
      
      // Use query parameters instead of state
      router.push({
        pathname: '/dashboard/profile',
        query: {
          refreshAccounts: 'true',
          accountNumber: newAccount.account_number,
          bankName: newAccount.bank_name
        }
      });
    } catch (err) {
      console.error('Error creating new account:', err);
      showToast('Failed to create new account. Please try again.', 'error');
      // Navigate back to profile on error
      router.push('/dashboard/profile');
    } finally {
      setIsLoading(false);
    }
  }, [newAccountData, user?.id, showToast, router]);

  const handlePaymentError = useCallback(() => {
    showToast('Payment failed. Please try again.', 'error');
    setNewAccountData(null);
  }, [showToast]);

  const handlePaymentClose = useCallback(() => {
    setNewAccountData(null);
    showToast('Payment cancelled', 'info');
  }, [showToast]);

  const config = {
    public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || '',
    tx_ref: Date.now().toString(),
    amount: 3000,
    currency: "NGN",
    payment_options: "card,mobilemoney,ussd",
    customer: {
      email: user?.email || '',
      phone_number: user?.phone || '',
      name: user?.full_name || '',
    },
    customizations: {
      title: "Honest Minds Global Ventures",
      description: "New Thrift Account Registration",
      logo: "https://honestminds.com/assets/logo.png",
    },
    onClose: handlePaymentClose,
    onError: handlePaymentError,
    meta: {
      user_id: user?.id,
      account_type: 'thrift'
    },
    integrity_hash: process.env.NEXT_PUBLIC_FLUTTERWAVE_INTEGRITY_HASH,
    subaccounts: [],
    payment_plan: undefined,
    disable_fingerprint: true
  };

  const handleFlutterPayment = useFlutterwave(config);

  const handleCreateAccount = useCallback(() => {
    try {
      const publicKey = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;
      if (!publicKey) {
        showToast('Payment system is not configured. Please contact support.', 'error');
        return;
      }

      // Generate unique IDs that fit within the 20-character limit
      const accountId = generateUniqueId('ACC');
      const referralId = generateUniqueId('REF');

      const accountData = { accountId, referralId };
      setNewAccountData(accountData);
      
      // Only access window on the client
      const clientConfig = {
        ...config,
        redirect_url: typeof window !== 'undefined' ? window.location.origin + '/dashboard/profile' : '',
        hostname: typeof window !== 'undefined' ? window.location.hostname : '',
      };

      // Initialize payment with callbacks
      useFlutterwave(clientConfig)({
        callback: (response) => handlePaymentSuccess(response),
        onClose: handlePaymentClose
      });
    } catch (err) {
      console.error('Error initializing payment:', err);
      showToast('Failed to initialize payment. Please try again.', 'error');
    }
  }, [handlePaymentSuccess, handlePaymentClose, showToast, generateUniqueId]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <div className="flex items-center mb-6">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<ArrowLeft size={16} />}
            onClick={() => router.push('/dashboard/profile')}
            className="mr-4"
          >
            Back
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900">Create New Thrift Account</h1>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-primary-50 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-primary-900 mb-4">Account Registration Fee</h2>
            <p className="text-primary-700 mb-4">
              A one-time registration fee of ₦3,000 is required to create a new thrift account.
            </p>
            <ul className="list-disc list-inside text-primary-700 space-y-2 mb-6">
              <li>Unique Account ID will be generated</li>
              <li>Unique Referral ID will be provided</li>
              <li>Access to all thrift features</li>
              <li>Eligible for referral bonuses</li>
            </ul>
            <Button
              variant="primary"
              size="lg"
              leftIcon={<PlusCircle size={20} />}
              onClick={handleCreateAccount}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Processing...' : 'Create New Account - ₦3,000'}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AddAccount;
