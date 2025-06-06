import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { useNotification } from '../../hooks/useNotification.tsx';
import Button from '../../components/ui/Button';
import { Plus, MessageSquare, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import NewComplaintModal from '../../components/complaints/NewComplaintModal';
import ComplaintDetails from '../../components/complaints/ComplaintDetails';

interface Complaint {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  response_count: number;
}

export default function Complaints() {
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useNotification();
  const [loading, setLoading] = useState(false);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isNewComplaintModalOpen, setIsNewComplaintModalOpen] = useState(false);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchComplaints();
    }
  }, [user]);

  const fetchComplaints = async () => {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComplaints(data || []);
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const createComplaint = async (complaint: Complaint) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('complaints')
        .insert([{ ...complaint, user_id: user?.id }]);

      if (error) throw error;
      showToast('Complaint submitted successfully', 'success');
      fetchComplaints();
    } catch (error: any) {
      showToast('Failed to submit complaint', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Complaint['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: Complaint['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Complaint['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'in_progress':
        return <AlertCircle className="w-4 h-4" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4" />;
      case 'closed':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getPageTitle = () => {
    switch (router.pathname) {
      case '/dashboard/complaints/new':
        return 'Log A New Complaint';
      case '/dashboard/complaints/pending':
        return 'Pending Complaints';
      case '/dashboard/complaints/ongoing':
        return 'Ongoing Complaints';
      case '/dashboard/complaints/completed':
        return 'Completed Complaints';
      default:
        return 'My Complaints';
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h2>
        {router.pathname !== '/dashboard/complaints/new' && (
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={() => router.push('/dashboard/complaints/new')}
          >
            New Complaint
          </Button>
        )}
      </div>
      {router.pathname === '/dashboard/complaints/new' ? (
        <NewComplaintModal
          isOpen={true}
          onClose={() => router.push('/dashboard/complaints')}
          onSuccess={() => {
            router.push('/dashboard/complaints');
            fetchComplaints();
          }}
        />
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responses</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {complaints.map((complaint) => (
                <tr key={complaint.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{complaint.title}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">{complaint.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize">{complaint.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(complaint.status)}`}>
                      <span className="mr-1">{getStatusIcon(complaint.status)}</span>
                      {complaint.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(complaint.priority)}`}>
                      {complaint.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {format(new Date(complaint.created_at), 'MMM d, yyyy')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(complaint.created_at), 'h:mm a')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      {complaint.response_count}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedComplaintId(complaint.id)}
                    >
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selectedComplaintId && (
        <ComplaintDetails
          complaintId={selectedComplaintId}
          isOpen={!!selectedComplaintId}
          onClose={() => setSelectedComplaintId(null)}
          onUpdate={fetchComplaints}
        />
      )}
    </div>
  );
}
