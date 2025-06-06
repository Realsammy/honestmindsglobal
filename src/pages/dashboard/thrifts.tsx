import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Thrift } from '../../types';
import { formatCurrency } from '../../utils/format';
import ThriftCard from '../../components/ThriftCard';

export default function Thrifts() {
  const { user } = useAuth();
  const [thrifts, setThrifts] = useState<Thrift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<Thrift['status'] | 'ALL'>('ALL');

  useEffect(() => {
    const fetchThrifts = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('thrifts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setThrifts(data || []);
      } catch (err) {
        console.error('Error fetching thrifts:', err);
        setError('Failed to load thrifts');
      } finally {
        setLoading(false);
      }
    };

    fetchThrifts();
  }, [user]);

  const filteredThrifts = statusFilter === 'ALL' 
    ? thrifts 
    : thrifts.filter(t => t.status === statusFilter);

  const stats = {
    total: thrifts.length,
    active: thrifts.filter(t => t.status === 'active').length,
    completed: thrifts.filter(t => t.status === 'completed').length,
    defaulted: thrifts.filter(t => t.status === 'defaulted').length,
    cancelled: thrifts.filter(t => t.status === 'cancelled').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">My Thrifts</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and manage your thrift accounts
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Total Thrifts</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Active</div>
          <div className="mt-1 text-2xl font-semibold text-green-600">{stats.active}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Completed</div>
          <div className="mt-1 text-2xl font-semibold text-blue-600">{stats.completed}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Defaulted</div>
          <div className="mt-1 text-2xl font-semibold text-red-600">{stats.defaulted}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Cancelled</div>
          <div className="mt-1 text-2xl font-semibold text-gray-600">{stats.cancelled}</div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="mb-6 flex space-x-2">
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            statusFilter === 'ALL'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => setStatusFilter('ALL')}
        >
          All
        </button>
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            statusFilter === 'active'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => setStatusFilter('active')}
        >
          Active
        </button>
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            statusFilter === 'completed'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => setStatusFilter('completed')}
        >
          Completed
        </button>
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            statusFilter === 'defaulted'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => setStatusFilter('defaulted')}
        >
          Defaulted
        </button>
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            statusFilter === 'cancelled'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => setStatusFilter('cancelled')}
        >
          Cancelled
        </button>
      </div>

      {/* Thrift List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredThrifts.map((thrift) => (
          <ThriftCard key={thrift.id} thrift={thrift} />
        ))}
      </div>

      {filteredThrifts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No thrifts found.</p>
        </div>
      )}
    </div>
  );
}
