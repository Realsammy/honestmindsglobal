import { useState } from 'react';
import { X } from 'lucide-react';
import { useThrift } from '../../hooks/useThrift';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';

interface NewThriftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const NewThriftModal = ({ isOpen, onClose, onSuccess }: NewThriftModalProps) => {
  const { createThrift, makeContribution } = useThrift();
  const [weeklyContribution, setWeeklyContribution] = useState('');
  const [referralId, setReferralId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weeklyContribution || isNaN(Number(weeklyContribution)) || Number(weeklyContribution) <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid amount',
        type: 'error'
      });
      return;
    }

    try {
      setIsLoading(true);
      // First create the thrift
      const { id: thriftId } = await createThrift({
        referral_id: referralId || undefined,
      });

      // Then make the initial contribution
      await makeContribution(thriftId, Number(weeklyContribution));

      toast({
        title: 'Success',
        description: 'Thrift created successfully',
        type: 'success'
      });
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Error creating thrift:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to create thrift',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          <div className="absolute right-0 top-0 pr-4 pt-4">
            <button
              type="button"
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <X size={20} />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
              <h3 className="text-lg font-semibold leading-6 text-gray-900">
                Create New Thrift
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Set up a new thrift contribution plan. You'll be able to make weekly contributions.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div className="bg-error-50 border border-error-200 text-error-800 p-4 rounded-lg text-sm">
                <div className="flex items-center">
                  <span>{error}</span>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="weeklyContribution" className="block text-sm font-medium text-gray-700 mb-1">
                Weekly Contribution Amount
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">₦</span>
                </div>
                <input
                  type="number"
                  id="weeklyContribution"
                  value={weeklyContribution}
                  onChange={(e) => setWeeklyContribution(e.target.value)}
                  className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter amount"
                  required
                  min="1000"
                  step="100"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Minimum contribution: ₦1,000</p>
            </div>

            <div>
              <label htmlFor="referralId" className="block text-sm font-medium text-gray-700 mb-1">
                Referral Code (Optional)
              </label>
              <input
                type="text"
                id="referralId"
                value={referralId}
                onChange={(e) => setReferralId(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter referral code"
              />
            </div>

            <div className="mt-6 sm:mt-8 sm:flex sm:flex-row-reverse">
              <Button
                type="submit"
                variant="primary"
                className="w-full sm:w-auto sm:ml-3"
                isLoading={isLoading}
                disabled={isLoading}
              >
                Create Thrift
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="mt-3 w-full sm:mt-0 sm:w-auto"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewThriftModal; 
