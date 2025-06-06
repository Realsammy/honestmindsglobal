import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth.ts';
import { supabase } from '../../lib/supabase.ts';
import ReferralShare from '../../components/ReferralShare.tsx';
import { useNotification } from '../../hooks/useNotification.tsx';

interface Referral {
  id: string;
  referred_id: string;
  referral_code: string;
  status: string;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  }[];
}

const Referrals = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        const { data, error } = await supabase
          .from('referrals')
          .select(`
            id,
            referred_id,
            referral_code,
            status,
            created_at,
            profiles!referred_id (
              full_name,
              email
            )
          `)
          .eq('referrer_id', user?.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setReferrals(data || []);
      } catch (error) {
        console.error('Error fetching referrals:', error);
        showToast('Failed to load referrals', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      fetchReferrals();
    }
  }, [user?.id]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900">Referrals</h1>
        <p className="mt-2 text-gray-600">
          Share your referral link and earn bonuses when your friends join!
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Referral Share Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1"
        >
          <ReferralShare
            referralId={user?.referral_code || ''}
            referralCount={referrals.length}
          />
        </motion.div>

        {/* Referral List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Referrals</h2>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading referrals...</p>
              </div>
            ) : referrals.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">You haven't referred anyone yet.</p>
                <p className="text-gray-500 mt-2">Share your referral link to start earning bonuses!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {referrals.map((referral) => (
                      <tr key={referral.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {referral.profiles && referral.profiles.length > 0 ? referral.profiles[0].full_name : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {referral.profiles && referral.profiles.length > 0 ? referral.profiles[0].email : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            referral.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {referral.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(referral.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Referrals;
