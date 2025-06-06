import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNotification } from '../../hooks/useNotification.tsx';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import TextArea from '../ui/TextArea';
import Select from '../ui/Select';
import { format } from 'date-fns';
import { MessageSquare, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface ComplaintDetailsProps {
  complaintId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

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
  resolution_notes: string | null;
  assigned_to: string | null;
  user: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface ComplaintResponse {
  id: string;
  message: string;
  is_internal: boolean;
  created_at: string;
  user: {
    id: string;
    full_name: string;
    role: string;
  };
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' }
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
];

export default function ComplaintDetails({ complaintId, isOpen, onClose, onUpdate }: ComplaintDetailsProps) {
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [responses, setResponses] = useState<ComplaintResponse[]>([]);
  const [newResponse, setNewResponse] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isInternal, setIsInternal] = useState(false);
  const { user } = useAuth() as { user: { id: string; role?: string; full_name?: string; email?: string } };
  const { showToast } = useNotification();

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const fetchComplaintDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('complaints')
        .select(`
          *,
          user:profiles(full_name, email),
          responses:complaint_responses(
            id,
            content,
            is_internal,
            created_at,
            user:profiles(full_name, email)
          )
        `)
        .eq('id', complaintId)
        .single();

      if (error) throw error;
      setComplaint(data);
    } catch (err: any) {
      console.error('Error fetching complaint details:', err);
      showToast('Failed to fetch complaint details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && complaintId) {
      fetchComplaintDetails();
    }
  }, [isOpen, complaintId, fetchComplaintDetails]);

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResponse.trim()) return;

    try {
      setSubmitting(true);
      const { error } = await supabase
        .from('complaint_responses')
        .insert({
          complaint_id: complaintId,
          content: newResponse,
          is_internal: isInternal,
          user_id: user.id
        });

      if (error) throw error;

      showToast('Response added successfully', 'success');
      setNewResponse('');
      setIsInternal(false);
      fetchComplaintDetails();
      onUpdate();
    } catch (err: any) {
      console.error('Error adding response:', err);
      showToast('Failed to add response', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!complaint) return;

    try {
      setSubmitting(true);
      const { error } = await supabase
        .from('complaints')
        .update({ status: newStatus })
        .eq('id', complaintId);

      if (error) throw error;

      showToast('Complaint status updated successfully', 'success');
      fetchComplaintDetails();
      onUpdate();
    } catch (err: any) {
      console.error('Error updating status:', err);
      showToast('Failed to update complaint status', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    if (!complaint) return;

    try {
      setSubmitting(true);
      const { error } = await supabase
        .from('complaints')
        .update({ priority: newPriority })
        .eq('id', complaintId);

      if (error) throw error;

      showToast('Complaint priority updated successfully', 'success');
      fetchComplaintDetails();
      onUpdate();
    } catch (err: any) {
      console.error('Error updating priority:', err);
      showToast('Failed to update complaint priority', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignToMe = async () => {
    if (!complaint || !user) return;

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from('complaints')
        .update({
          assigned_to: user.id,
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', complaintId);

      if (error) throw error;

      showToast('Complaint assigned to you', 'success');
      fetchComplaintDetails();
      onUpdate();
    } catch (err: any) {
      console.error('Error assigning complaint:', err);
      showToast('Failed to assign complaint', 'error');
    } finally {
      setSubmitting(false);
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

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Complaint Details">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </Modal>
    );
  }

  if (!complaint) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Complaint Details">
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          Complaint not found
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Complaint Details"
      size="lg"
    >
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">{complaint.title}</h3>
            <div className="flex items-center space-x-4">
              {isAdmin && (
                <Select
                  value={complaint.status}
                  onChange={(e) => handleStatusChange(e.target.value as Complaint['status'])}
                  className="w-40"
                  disabled={submitting}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              )}
              {!isAdmin && (
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(complaint.status)}`}>
                  <span className="mr-1">{getStatusIcon(complaint.status)}</span>
                  {complaint.status.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">User</p>
              <p className="text-sm font-medium text-gray-900">{complaint.user.full_name}</p>
              <p className="text-sm text-gray-500">{complaint.user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Category</p>
              <p className="text-sm font-medium text-gray-900 capitalize">
                {complaint.category.replace('_', ' ')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Priority</p>
              {isAdmin ? (
                <Select
                  value={complaint.priority}
                  onChange={(e) => handlePriorityChange(e.target.value as Complaint['priority'])}
                  className="w-40"
                  disabled={submitting}
                >
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              ) : (
                <p className="text-sm font-medium text-gray-900 capitalize">
                  {complaint.priority}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p className="text-sm font-medium text-gray-900">
                {format(new Date(complaint.created_at), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-1">Description</p>
            <p className="text-sm text-gray-900 whitespace-pre-wrap">{complaint.description}</p>
          </div>

          {complaint.resolution_notes && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-1">Resolution Notes</p>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{complaint.resolution_notes}</p>
            </div>
          )}

          {isAdmin && !complaint.assigned_to && (
            <div className="mt-4">
              <Button
                variant="primary"
                onClick={handleAssignToMe}
                loading={submitting}
              >
                Assign to Me
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900">Responses</h4>
          
          <div className="space-y-4">
            {responses.map((response) => (
              <div
                key={response.id}
                className={`p-4 rounded-lg ${
                  response.is_internal ? 'bg-blue-50' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <MessageSquare className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900">
                      {response.user.full_name}
                    </span>
                    {response.is_internal && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">
                        Internal
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    {format(new Date(response.created_at), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{response.message}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmitResponse} className="space-y-4">
            {isAdmin && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isInternal"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isInternal" className="ml-2 block text-sm text-gray-900">
                  Mark as internal note
                </label>
              </div>
            )}
            <TextArea
              value={newResponse}
              onChange={(e) => setNewResponse(e.target.value)}
              placeholder="Type your response here..."
              rows={3}
              required
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                loading={submitting}
                disabled={!newResponse.trim()}
              >
                Submit Response
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
}
