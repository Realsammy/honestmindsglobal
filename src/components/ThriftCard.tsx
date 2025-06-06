import { Thrift } from '../types';
import { formatCurrency } from '../utils/format';
import { Eye } from 'lucide-react';
import Button from './ui/Button';

interface ThriftCardProps {
  thrift: Thrift;
  onViewDetails?: (thrift: Thrift) => void;
}

export default function ThriftCard({ thrift, onViewDetails }: ThriftCardProps) {
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-medium text-gray-900">
            Thrift #{thrift.id.slice(-6)}
          </h3>
          <p className="text-sm text-gray-500">
            Started {new Date(thrift.start_date).toLocaleDateString()}
          </p>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(thrift.status)}`}>
          {thrift.status.charAt(0).toUpperCase() + thrift.status.slice(1)}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm text-gray-500">Balance</p>
          <p className="text-lg font-medium text-gray-900">
            {formatCurrency(thrift.balance)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Weekly Contribution</p>
          <p className="text-lg font-medium text-gray-900">
            {formatCurrency(thrift.weekly_contribution)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Total Contributed</p>
          <p className="text-lg font-medium text-gray-900">
            {formatCurrency(thrift.total_contributed)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Current Week</p>
          <p className="text-lg font-medium text-gray-900">
            Week {thrift.current_week}
          </p>
        </div>
      </div>

      {thrift.has_defaulted && (
        <div className="mt-4 p-3 bg-red-50 rounded-md">
          <p className="text-sm text-red-700">
            Defaulted Amount: {formatCurrency(thrift.default_amount)}
          </p>
          <p className="text-xs text-red-600 mt-1">
            Defaulted Weeks: {thrift.default_weeks.join(', ')}
          </p>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          leftIcon={<Eye size={16} />}
          onClick={() => onViewDetails?.(thrift)}
        >
          View Details
        </Button>
      </div>
    </div>
  );
}
