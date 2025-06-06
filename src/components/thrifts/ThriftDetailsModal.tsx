import { Thrift } from '../../types';
import { formatCurrency } from '../../utils/format';
import Modal from '../ui/Modal';
import { X } from 'lucide-react';

interface ThriftDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  thrift: Thrift;
}

export default function ThriftDetailsModal({
  isOpen,
  onClose,
  thrift,
}: ThriftDetailsModalProps) {
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
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Thrift Details
            </h2>
            <p className="text-sm text-gray-500">
              Thrift #{thrift.id.slice(-6)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Status */}
          <div>
            <h3 className="text-sm font-medium text-gray-500">Status</h3>
            <span className={`mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(thrift.status)}`}>
              {thrift.status.charAt(0).toUpperCase() + thrift.status.slice(1)}
            </span>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Start Date</h3>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(thrift.start_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">End Date</h3>
              <p className="mt-1 text-sm text-gray-900">
                {thrift.end_date ? new Date(thrift.end_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          {/* Financial Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Balance</h3>
              <p className="mt-1 text-lg font-medium text-gray-900">
                {formatCurrency(thrift.balance)}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Weekly Contribution</h3>
              <p className="mt-1 text-lg font-medium text-gray-900">
                {formatCurrency(thrift.weekly_contribution)}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total Contributed</h3>
              <p className="mt-1 text-lg font-medium text-gray-900">
                {formatCurrency(thrift.total_contributed)}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Current Week</h3>
              <p className="mt-1 text-lg font-medium text-gray-900">
                Week {thrift.current_week}
              </p>
            </div>
          </div>

          {/* Default Information */}
          {thrift.has_defaulted && (
            <div className="bg-red-50 rounded-md p-4">
              <h3 className="text-sm font-medium text-red-800">Default Information</h3>
              <div className="mt-2 space-y-2">
                <p className="text-sm text-red-700">
                  Defaulted Amount: {formatCurrency(thrift.default_amount)}
                </p>
                <p className="text-sm text-red-700">
                  Defaulted Weeks: {thrift.default_weeks.join(', ')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
} 
