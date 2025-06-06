import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { X } from 'lucide-react';
import { useNotification } from '../hooks/useNotification.tsx';

interface ContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  thriftId: string;
  thriftName: string;
  onSuccess?: () => void;
}

export default function ContributionModal({
  isOpen,
  onClose,
  thriftId,
  thriftName,
  onSuccess,
}: ContributionModalProps) {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Create transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          thrift_id: thriftId,
          amount: parseFloat(amount),
          type: 'contribution',
          status: 'pending',
        });

      if (transactionError) throw transactionError;

      // Update thrift balance
      const { error: thriftError } = await supabase.rpc('update_thrift_balance', {
        p_thrift_id: thriftId,
        p_amount: parseFloat(amount),
      });

      if (thriftError) throw thriftError;

      showToast('Contribution successful', 'success');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error making contribution:', error);
      showToast('Failed to make contribution', 'error');
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
              Make Contribution
            </h2>
            <p className="text-sm text-gray-500">
              {thriftName}
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
              htmlFor="amount"
              className="block text-sm font-medium text-gray-700"
            >
              Amount (₦)
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              required
              min="1000"
              step="100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
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
              Make Contribution
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
