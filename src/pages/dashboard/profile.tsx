import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useThrift } from '../../hooks/useThrift';
import { motion } from 'framer-motion';
import { 
  User, 
  CreditCard, 
  Users, 
  Eye, 
  History, 
  RefreshCw,
  ChevronRight,
  Edit,
  Camera,
  Wallet,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Plus
} from 'lucide-react';
import Button from '../../components/ui/Button';
import { useNotification } from '../../hooks/useNotification';
import { supabase } from '../../lib/supabase';
import { Thrift } from '../../types';
import { useRouter } from 'next/router';
import { useFlutterwave } from 'flutterwave-react-v3';
import { formatCurrency } from '../../utils/format';

interface Account {
  id: string;
  account_id: string;
  account_type: 'primary' | 'others';
  wallet_balance: number;
  referral_id: string;
  total_referrals: number;
  referrals_within_40days: number;
  active_referrals: number;
  is_active: boolean;
  created_at: string;
}

const Profile = () => {
  const router = useRouter();
  const { user, profile, updateUser, signOut } = useAuth();
  const { thrifts } = useThrift();
  const { showToast } = useNotification();
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [newAccountData, setNewAccountData] = useState<{
    accountId: string;
    referralId: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    fullName: profile?.full_name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    dob: profile?.dob || '',
    gender: profile?.gender || '',
    photo: null as File | null,
    nextOfKinName: profile?.next_of_kin_name || '',
    nextOfKinPhone: profile?.next_of_kin_phone || '',
    nextOfKinAddress: profile?.next_of_kin_address || '',
    nextOfKinOccupation: profile?.next_of_kin_occupation || '',
    nextOfKinDob: profile?.next_of_kin_dob || '',
    nextOfKinGender: profile?.next_of_kin_gender || ''
  });
  const { refreshAccounts } = router.query;

  const config = {
    public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY as string,
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
      logo: "https://honestminds.com/logo.png",
    },
  };

  const handleFlutterPayment = useFlutterwave(config);

  // Fetch user accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('user_accounts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setAccounts(data || []);
        // Set the primary account as selected by default
        const primaryAccount = data?.find(acc => acc.account_type === 'primary');
        setSelectedAccount(primaryAccount || data?.[0] || null);
      } catch (err) {
        console.error('Error fetching accounts:', err);
        showToast('Failed to load accounts', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    if (refreshAccounts) {
      fetchAccounts();
      // Clear the query to prevent unnecessary refreshes
      router.replace({ pathname: router.pathname });
    } else {
      fetchAccounts();
    }
  }, [refreshAccounts, router]);

  // Function to switch accounts
  const switchAccount = async (accountId: string) => {
    try {
      setIsLoading(true);
      
      // Update the selected account
      const account = accounts.find(acc => acc.id === accountId);
      if (!account) throw new Error('Account not found');
      
      setSelectedAccount(account);
      showToast(`Switched to account ${account.account_id}`, 'success');
    } catch (err) {
      console.error('Error switching account:', err);
      showToast('Failed to switch account', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'success');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, photo: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create the appropriate update data based on the active tab
      const updateData = activeTab === 'nextOfKin' 
        ? {
            next_of_kin_name: formData.nextOfKinName,
            next_of_kin_phone: formData.nextOfKinPhone,
            next_of_kin_address: formData.nextOfKinAddress,
            next_of_kin_occupation: formData.nextOfKinOccupation,
            next_of_kin_dob: formData.nextOfKinDob,
            next_of_kin_gender: formData.nextOfKinGender
          }
        : {
            full_name: formData.fullName,
            phone: formData.phone,
            address: formData.address,
            dob: formData.dob,
            gender: formData.gender
          };

      await updateUser(updateData);
      showToast('Profile updated successfully!', 'success');
      setIsEditing(false);
    } catch (err) {
      console.error('Profile update error:', err);
      showToast(err instanceof Error ? err.message : 'Failed to update profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusIcon = (status: Thrift['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="text-green-500" size={20} />;
      case 'completed':
        return <CheckCircle2 className="text-blue-500" size={20} />;
      case 'defaulted':
        return <AlertCircle className="text-red-500" size={20} />;
      case 'cancelled':
        return <AlertCircle className="text-gray-500" size={20} />;
      default:
        return <AlertCircle className="text-gray-500" size={20} />;
    }
  };

  const handleViewReferrals = (accountId: string) => {
    // TODO: Implement view referrals functionality
    console.log('View referrals for account:', accountId);
  };

  const handleViewHistory = (accountId: string) => {
    // TODO: Implement view history functionality
    console.log('View history for account:', accountId);
  };

  const handleAddMoreAccount = () => {
    // Generate unique IDs with more entropy
    const timestamp = Date.now().toString();
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    const accountId = `ACC${timestamp}${randomStr}`;
    const referralId = `REF${timestamp}${randomStr}`;

    // Validate the generated IDs
    if (!accountId || !referralId) {
      showToast('Failed to generate account identifiers', 'error');
      return;
    }

    setNewAccountData({ accountId, referralId });
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (response: any) => {
    try {
      setIsLoading(true);
      
      if (!newAccountData) throw new Error('Account data not found');

      // Create new account in the database
      const { data: newAccount, error } = await supabase
        .from('user_accounts')
        .insert([
          {
            user_id: user?.id,
            account_id: newAccountData.accountId,
            referral_id: newAccountData.referralId,
            account_type: 'thrift',
            wallet_balance: 0,
            total_referrals: 0,
            referrals_within_40days: 0,
            active_referrals: 0,
            is_active: true
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Create transaction record for registration fee
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert([
          {
            user_id: user?.id,
            account_id: newAccountData.accountId,
            amount: 3000,
            type: 'REGISTRATION',
            status: 'COMPLETED',
            reference: response.transaction_id,
            description: 'New thrift account registration fee'
          }
        ]);

      if (transactionError) throw transactionError;

      // Refresh accounts list
      const { data: updatedAccounts } = await supabase
        .from('user_accounts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      setAccounts(updatedAccounts || []);
      showToast('New account created successfully!', 'success');
      setShowPaymentModal(false);
      setNewAccountData(null);
    } catch (err) {
      console.error('Error creating new account:', err);
      showToast('Failed to create new account', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentError = () => {
    showToast('Payment failed. Please try again.', 'error');
    setShowPaymentModal(false);
    setNewAccountData(null);
  };

  const handlePaymentClose = () => {
    setShowPaymentModal(false);
    setNewAccountData(null);
  };

  // Update form data when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        dob: profile.dob || '',
        gender: profile.gender || '',
        photo: null,
        nextOfKinName: profile.next_of_kin_name || '',
        nextOfKinPhone: profile.next_of_kin_phone || '',
        nextOfKinAddress: profile.next_of_kin_address || '',
        nextOfKinOccupation: profile.next_of_kin_occupation || '',
        nextOfKinDob: profile.next_of_kin_dob || '',
        nextOfKinGender: profile.next_of_kin_gender || ''
      });
    }
  }, [profile]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/auth/login');
    } catch (error) {
      showToast('Failed to sign out', 'error');
    }
  };

  const getStatusColor = (status: Thrift['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'defaulted':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('personal')}
            className={`${
              activeTab === 'personal'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <User size={16} className="mr-2" />
            Personal Information
          </button>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`${
              activeTab === 'accounts'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <CreditCard size={16} className="mr-2" />
            List of Accounts
          </button>
          <button
            onClick={() => setActiveTab('nextOfKin')}
            className={`${
              activeTab === 'nextOfKin'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <Users size={16} className="mr-2" />
            Next of Kin Information
          </button>
        </nav>
      </div>

      {/* Personal Information */}
      {activeTab === 'personal' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
              {profile?.referral_code && (
                <div className="mt-2 p-3 bg-primary-50 rounded-lg border border-primary-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-primary-900">Your Referral Code</p>
                      <p className="mt-1 text-lg font-bold text-primary-600">{profile.referral_code}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(profile.referral_code)}
                      className="p-2 hover:bg-primary-100 rounded-full transition-colors"
                      title="Copy Referral Code"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-primary-700">Share this code with friends to earn rewards!</p>
                </div>
              )}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              leftIcon={<Edit size={16} />}
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled={true}
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                    +234
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Photo</label>
                <div className="mt-1 flex items-center">
                  <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                    {formData.photo ? (
                      <img
                        src={URL.createObjectURL(formData.photo)}
                        alt="Profile"
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <Camera size={24} className="text-gray-400" />
                    )}
                  </div>
                  {isEditing && (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="ml-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  className="ml-3"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save and Continue'}
                </Button>
              </div>
            )}
          </form>
        </motion.div>
      )}

      {/* List of Accounts */}
      {activeTab === 'accounts' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">List of Accounts</h2>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={16} />}
              onClick={() => handleAddMoreAccount()}
            >
              Add New Account
            </Button>
          </div>

          {isLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading accounts...</p>
            </div>
          ) : accounts.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">No accounts found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S/N</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Id</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wallet Balance</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referral ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Referral</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referral Within 40days</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Referral With Active Plan</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created On</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {accounts.map((account, index) => (
                    <tr key={account.id} className={selectedAccount?.id === account.id ? 'bg-primary-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center">
                          <span>{account.account_id}</span>
                          <button
                            onClick={() => copyToClipboard(account.account_id)}
                            className="ml-2 p-1 hover:bg-gray-100 rounded-full"
                            title="Copy Account ID"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{account.account_type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(account.wallet_balance)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <span>{account.referral_id}</span>
                          <button
                            onClick={() => copyToClipboard(account.referral_id)}
                            className="ml-2 p-1 hover:bg-gray-100 rounded-full"
                            title="Copy Referral ID"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{account.total_referrals}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{account.referrals_within_40days}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{account.active_referrals}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(account.created_at)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<Eye size={14} />}
                            className="text-xs"
                            onClick={() => handleViewReferrals(account.id)}
                          >
                            View referral
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<History size={14} />}
                            className="text-xs"
                            onClick={() => handleViewHistory(account.id)}
                          >
                            Weekly history
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<RefreshCw size={14} />}
                            className="text-xs"
                            onClick={() => switchAccount(account.id)}
                            disabled={selectedAccount?.id === account.id}
                          >
                            Switch account
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {accounts.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing 1 to {accounts.length} of {accounts.length} entries
                </div>
                <div className="flex space-x-2">
                  <Button variant="secondary" size="sm" disabled>
                    Previous
                  </Button>
                  <Button variant="secondary" size="sm" disabled>
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Next of Kin Information */}
      {activeTab === 'nextOfKin' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Next of Kin Information</h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              leftIcon={<Edit size={16} />}
            >
              {isEditing ? 'Cancel' : 'Edit Information'}
            </Button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  name="nextOfKinName"
                  value={formData.nextOfKinName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  name="nextOfKinPhone"
                  value={formData.nextOfKinPhone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  type="text"
                  name="nextOfKinAddress"
                  value={formData.nextOfKinAddress}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Occupation</label>
                <input
                  type="text"
                  name="nextOfKinOccupation"
                  value={formData.nextOfKinOccupation}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input
                  type="date"
                  name="nextOfKinDob"
                  value={formData.nextOfKinDob}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                <select
                  name="nextOfKinGender"
                  value={formData.nextOfKinGender}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  className="ml-3"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save and Continue'}
                </Button>
              </div>
            )}
          </form>
        </motion.div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Thrift Account</h3>
            <p className="text-gray-600 mb-4">
              A registration fee of ₦3,000 is required to create a new thrift account.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={handlePaymentClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  handleFlutterPayment({
                    callback: handlePaymentSuccess,
                    onClose: handlePaymentClose,
                  });
                }}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Pay ₦3,000'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
