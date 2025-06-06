import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { X } from 'lucide-react';
import { useNotification } from '../../hooks/useNotification.tsx';

export default function NewThriftModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    weekly_contribution: '',
    start_date: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('thrifts').insert({
        user_id: user.id,
        weekly_contribution: parseFloat(formData.weekly_contribution),
        start_date: formData.start_date,
        status: 'active',
        balance: 0,
        total_contributed: 0,
        current_week: 1,
        has_defaulted: false,
        default_amount: 0,
        default_weeks: [],
      });

      if (error) throw error;

      showToast('Thrift account created successfully', 'success');
      onClose();
    } catch (error) {
      console.error('Error creating thrift:', error);
      showToast('Failed to create thrift account', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Create New Thrift
            </h2>
            <p className="text-sm text-gray-500">
              Set up a new thrift account
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="weekly_contribution"
              className="block text-sm font-medium text-gray-700"
            >
              Weekly Contribution (₦)
            </label>
            <input
              type="number"
              id="weekly_contribution"
              name="weekly_contribution"
              required
              min="1000"
              step="100"
              value={formData.weekly_contribution}
              onChange={(e) =>
                setFormData({ ...formData, weekly_contribution: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="start_date"
              className="block text-sm font-medium text-gray-700"
            >
              Start Date
            </label>
            <input
              type="date"
              id="start_date"
              name="start_date"
              required
              value={formData.start_date}
              onChange={(e) =>
                setFormData({ ...formData, start_date: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
            >
              Create Thrift
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
