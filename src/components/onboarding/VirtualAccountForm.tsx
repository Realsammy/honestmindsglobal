import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/ui/Toast';
import Button from '../ui/Button';
import { createVirtualAccount } from '../../utils/flutterwave';

interface VirtualAccountFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function VirtualAccountForm({ onSuccess, onCancel }: VirtualAccountFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    bvn: '',
    accountType: 'individual',
    dateOfBirth: '',
    address: '',
    city: '',
    state: '',
    country: 'Nigeria',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bvn || formData.bvn.length !== 11) {
      toast({
        title: 'Error',
        description: 'Please enter a valid 11-digit BVN',
        type: 'error'
      });
      return;
    }

    try {
      setIsLoading(true);
      if (!user) throw new Error('User not authenticated');

      // Get user's full name from metadata or profile
      const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
      const [firstName, ...lastNameParts] = fullName.split(' ');
      const lastName = lastNameParts.join(' ') || firstName; // Use firstName as lastName if no last name

      const response = await createVirtualAccount({
        email: user.email || '',
        bvn: formData.bvn,
        phonenumber: user.phone || '',
        tx_ref: `VA-${user.id}-${Date.now()}`,
        is_permanent: true,
        narration: `Virtual Account for ${fullName}`,
        currency: 'NGN',
        amount: 2000
      });

      toast({
        title: 'Success',
        description: 'Virtual account created successfully',
        type: 'success'
      });
      onSuccess();
    } catch (err: any) {
      console.error('Error creating virtual account:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to create virtual account',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Create Virtual Account</h3>
      <p className="text-gray-600 mb-6">
        Please provide your details to create your virtual account for easy contributions.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="bvn" className="block text-sm font-medium text-gray-700 mb-1">
            Bank Verification Number (BVN)
          </label>
          <input
            id="bvn"
            name="bvn"
            type="text"
            value={formData.bvn}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            pattern="[0-9]{11}"
            maxLength={11}
            placeholder="Enter your 11-digit BVN"
            required
          />
        </div>

        <div>
          <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
            Date of Birth
          </label>
          <input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            required
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isLoading}
          >
            Create Virtual Account
          </Button>
        </div>
      </form>
    </div>
  );
}
