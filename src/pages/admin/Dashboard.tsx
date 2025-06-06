import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { useNotification } from '../../hooks/useNotification.tsx';
import { motion } from 'framer-motion';
import {
  Users,
  AlertCircle,
  Shield,
  UserPlus,
  UserMinus,
  UserCheck,
  UserX,
  MessageSquare
} from 'lucide-react';
import Button from '../../components/ui/Button';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'user' | 'admin' | 'super_admin';
  is_active: boolean;
  created_at: string;
}

interface Complaint {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  user: {
    full_name: string;
    email: string;
  };
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useNotification();
  const [users, setUsers] = useState<User[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // First check if user is admin
      const { data: isAdmin, error: adminCheckError } = await supabase
        .rpc('is_admin');

      if (adminCheckError || !isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }
      
      // Fetch users using the admin data function
      const { data: usersData, error: usersError } = await supabase
        .rpc('get_admin_data');

      if (usersError) {
        showToast('Failed to fetch users', 'error');
        throw usersError;
      }
      setUsers(usersData);

      // Fetch complaints
      const { data: complaintsData, error: complaintsError } = await supabase
        .from('complaints')
        .select(`
          *,
          user:profiles(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (complaintsError) throw complaintsError;
      setComplaints(complaintsData);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Failed to load data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_stats')
        .select('*')
        .single();

      if (error) throw error;
      setStats(data);
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const handleUserAction = async (userId: string, action: string, details?: any) => {
    try {
      // First check if user is admin
      const { data: isAdmin, error: adminCheckError } = await supabase
        .rpc('is_admin');

      if (adminCheckError || !isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }

      let newRole = '';
      
      switch (action) {
        case 'suspend':
          // Handle suspension through metadata
          const { error: suspendError } = await supabase.auth.admin.updateUserById(
            userId,
            { user_metadata: { is_active: false } }
          );
          if (suspendError) throw suspendError;
          break;
        case 'activate':
          // Handle activation through metadata
          const { error: activateError } = await supabase.auth.admin.updateUserById(
            userId,
            { user_metadata: { is_active: true } }
          );
          if (activateError) throw activateError;
          break;
        case 'promote':
          newRole = 'admin';
          break;
        case 'demote':
          newRole = 'user';
          break;
        default:
          throw new Error('Invalid action');
      }

      if (newRole) {
        // Update role using the secure function
        const { error: roleError } = await supabase
          .rpc('update_user_role', {
            target_user_id: userId,
            new_role: newRole
          });
        if (roleError) throw roleError;
      }

      // Log the action
      await supabase.from('user_actions').insert({
        admin_id: user?.id,
        user_id: userId,
        action_type: action,
        action_details: details
      });

      showToast(`User ${action}ed successfully`, 'success');
      loadData();
    } catch (error) {
      console.error('Error performing user action:', error);
      showToast(`Failed to ${action} user`, 'error');
    }
  };

  const handleComplaintAction = async (complaintId: string, action: string, resolution?: string) => {
    try {
      const { error } = await supabase
        .from('complaints')
        .update({
          status: action,
          resolution,
          assigned_to: user?.id
        })
        .eq('id', complaintId);

      if (error) throw error;

      showToast(`Complaint ${action}ed successfully`, 'success');
      loadData();
    } catch (error) {
      console.error('Error handling complaint:', error);
      showToast(`Failed to ${action} complaint`, 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
        
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Total Users */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stats?.total_users || 0}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Active Thrifts */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Thrifts</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stats?.active_thrifts || 0}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Total Savings */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Savings</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        ₦{stats?.total_savings?.toLocaleString() || 0}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
