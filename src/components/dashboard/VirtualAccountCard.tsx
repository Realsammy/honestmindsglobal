import { useState } from 'react';
import { Copy, Plus } from 'lucide-react';
import Button from '../ui/Button';
import VirtualAccountForm from '../onboarding/VirtualAccountForm';
import { useToast } from '../ui/Toast';

interface VirtualAccountCardProps {
  accountNumber?: string;
  accountName?: string;
  bankName?: string;
}

export default function VirtualAccountCard({ accountNumber, accountName, bankName }: VirtualAccountCardProps) {
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Success',
      description: 'Copied to clipboard!',
      type: 'success'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const amount = formData.get('amount') as string;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid amount',
        type: 'error'
      });
      return;
    }

    try {
      // Handle payment submission
      toast({
        title: 'Success',
        description: 'Payment initiated successfully',
        type: 'success'
      });
      setShowForm(false);
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Error',
        description: 'Failed to process payment. Please try again.',
        type: 'error'
      });
    }
  };

  if (showForm) {
    return (
      <VirtualAccountForm
        onSuccess={() => setShowForm(false)}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  if (!accountNumber || !bankName) {
    return (
      <div className="bg-white rounded-lg shadow-card p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Virtual Account</h3>
          <p className="text-gray-600 mb-4">
            Create your virtual account for easy contributions
          </p>
          <Button
            onClick={() => setShowForm(true)}
            leftIcon={<Plus size={16} />}
          >
            Create Virtual Account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-card p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Virtual Account Details</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Account Number
          </label>
          <div className="flex items-center space-x-2">
            <code className="block bg-gray-50 px-3 py-2 rounded border text-primary-600 font-medium flex-1">
              {accountNumber}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(accountNumber)}
              leftIcon={<Copy size={16} />}
            >
              Copy
            </Button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Account Name
          </label>
          <div className="flex items-center space-x-2">
            <p className="text-gray-900 font-medium flex-1">{accountName}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(accountName || '')}
              leftIcon={<Copy size={16} />}
            >
              Copy
            </Button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Bank Name
          </label>
          <p className="text-gray-900 font-medium">{bankName}</p>
        </div>
      </div>
    </div>
  );
}
