import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../hooks/useNotification.tsx';
import { MessageSquare, CheckCircle, XCircle, AlertCircle, Clock, Filter } from 'lucide-react';
import Button from '../../components/ui/Button';
import { Complaint, ComplaintStatus } from '../../types';
import { supabase } from '../../lib/supabase';
import { formatDate } from '../../utils/format';

interface ComplaintWithJoins extends Complaint {
  users: {
    full_name: string;
    email: string;
    is_admin: boolean;
  };
  admin: {
    full_name: string;
  };
}

export default function AdminComplaints() {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [complaints, setComplaints] = useState<ComplaintWithJoins[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintWithJoins | null>(null);
  const [resolution, setResolution] = useState('');
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'ALL'>('ALL');

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const { data, error } = await supabase
          .from('complaints')
          .select(`
            *,
            users:user_id (
              full_name,
              email,
              is_admin
            ),
            admin:admin_id (
              full_name
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setComplaints(data as ComplaintWithJoins[] || []);
      } catch (err) {
        console.error('Error fetching complaints:', err);
        setError('Failed to load complaints');
      } finally {
        setLoading(false);
      }
    };

    // Set up real-time subscription
    const subscription = supabase
      .channel('complaints')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'complaints'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Fetch the full complaint data with joins
            fetchComplaints();
            // Notify admin of new complaint
            showToast(`A new complaint has been submitted: ${(payload.new as Complaint).title}`, 'info');
          } else if (payload.eventType === 'UPDATE') {
            // Fetch the full complaint data with joins
            fetchComplaints();
          }
        }
      )
      .subscribe();

    fetchComplaints();

    return () => {
      subscription.unsubscribe();
    };
  }, [showToast]);

  const handleStatusChange = async (complaintId: string, newStatus: ComplaintStatus) => {
    try {
      const { error } = await supabase
        .from('complaints')
        .update({ status: newStatus })
        .eq('id', complaintId);

      if (error) throw error;

      setComplaints(prev =>
        prev.map(c => (c.id === complaintId ? { ...c, status: newStatus } : c))
      );
    } catch (err) {
      console.error('Error updating complaint status:', err);
      setError('Failed to update complaint status');
    }
  };

  const handleResolve = async () => {
    if (!selectedComplaint || !resolution.trim()) return;

    try {
      const { error } = await supabase
        .from('complaints')
        .update({
          status: 'resolved',
          resolution,
          resolved_at: new Date().toISOString()
        })
        .eq('id', selectedComplaint.id);

      if (error) throw error;

      setComplaints(prev =>
        prev.map(c =>
          c.id === selectedComplaint.id
            ? {
                ...c,
                status: 'resolved',
                resolution,
                resolved_at: new Date().toISOString()
              }
            : c
        )
      );

      setSelectedComplaint(null);
      setResolution('');
    } catch (err) {
      console.error('Error resolving complaint:', err);
      setError('Failed to resolve complaint');
    }
  };

  const getStatusColor = (status: ComplaintStatus) => {
    switch (status) {
      case 'open':
        return 'bg-warning-100 text-warning-800';
      case 'in_progress':
        return 'bg-primary-100 text-primary-800';
      case 'resolved':
        return 'bg-success-100 text-success-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: ComplaintStatus) => {
    switch (status) {
      case 'open':
        return <AlertCircle size={16} />;
      case 'in_progress':
        return <Clock size={16} />;
      case 'resolved':
        return <CheckCircle size={16} />;
      case 'closed':
        return <XCircle size={16} />;
      default:
        return null;
    }
  };

  const filteredComplaints = statusFilter === 'ALL' 
    ? complaints 
    : complaints.filter(c => c.status === statusFilter);

  const stats = {
    total: complaints.length,
    open: complaints.filter(c => c.status === 'open').length,
    in_progress: complaints.filter(c => c.status === 'in_progress').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
    closed: complaints.filter(c => c.status === 'closed').length,
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Complaints Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and respond to user complaints
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Total Complaints</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Open</div>
          <div className="mt-1 text-2xl font-semibold text-warning-600">{stats.open}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">In Progress</div>
          <div className="mt-1 text-2xl font-semibold text-primary-600">{stats.in_progress}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Resolved</div>
          <div className="mt-1 text-2xl font-semibold text-success-600">{stats.resolved}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Closed</div>
          <div className="mt-1 text-2xl font-semibold text-gray-600">{stats.closed}</div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="mb-6 flex space-x-2">
        <Button
          variant={statusFilter === 'ALL' ? 'primary' : 'outline'}
          onClick={() => setStatusFilter('ALL')}
          leftIcon={<Filter size={16} />}
        >
          All
        </Button>
        <Button
          variant={statusFilter === 'open' ? 'primary' : 'outline'}
          onClick={() => setStatusFilter('open')}
          leftIcon={<AlertCircle size={16} />}
        >
          Open
        </Button>
        <Button
          variant={statusFilter === 'in_progress' ? 'primary' : 'outline'}
          onClick={() => setStatusFilter('in_progress')}
          leftIcon={<Clock size={16} />}
        >
          In Progress
        </Button>
        <Button
          variant={statusFilter === 'resolved' ? 'primary' : 'outline'}
          onClick={() => setStatusFilter('resolved')}
          leftIcon={<CheckCircle size={16} />}
        >
          Resolved
        </Button>
        <Button
          variant={statusFilter === 'closed' ? 'primary' : 'outline'}
          onClick={() => setStatusFilter('closed')}
          leftIcon={<XCircle size={16} />}
        >
          Closed
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredComplaints.map((complaint: ComplaintWithJoins) => (
                <tr key={complaint.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                          {complaint.users?.full_name?.[0] || '?'}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {complaint.users?.full_name}
                          {complaint.users?.is_admin && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {complaint.users?.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{complaint.title}</div>
                    <div className="text-sm text-gray-500">{complaint.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                      {getStatusIcon(complaint.status)}
                      <span className="ml-1">{complaint.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {complaint.admin?.full_name || 'Unassigned'}
                    </div>
                    {complaint.resolved_at && (
                      <div className="text-sm text-gray-500">
                        Resolved: {new Date(complaint.resolved_at).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(complaint.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedComplaint(complaint)}
                      >
                        Respond
                      </Button>
                      {complaint.status !== 'resolved' && (
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<CheckCircle size={16} />}
                          onClick={() => handleStatusChange(complaint.id, 'resolved')}
                        >
                          Mark Resolved
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolution Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Respond to Complaint</h3>
            <div className="mb-4">
              <h4 className="font-medium text-gray-900">{selectedComplaint.title}</h4>
              <p className="text-sm text-gray-500 mt-1">{selectedComplaint.description}</p>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleResolve();
            }}>
              <div className="mb-4">
                <label htmlFor="resolution" className="block text-sm font-medium text-gray-700">
                  Your Resolution
                </label>
                <textarea
                  id="resolution"
                  name="resolution"
                  rows={4}
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedComplaint(null);
                    setResolution('');
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!resolution.trim()}>
                  {resolution.trim() ? 'Resolve' : 'Enter Resolution'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
