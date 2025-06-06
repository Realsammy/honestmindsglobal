import { useState } from 'react';
import { verifyBVN } from '../../utils/flutterwave';
import Button from '../ui/Button';

interface BVNVerificationProps {
  onVerified: (bvn: string) => void;
  onCancel: () => void;
}

export default function BVNVerification({ onVerified, onCancel }: BVNVerificationProps) {
  const [bvn, setBvn] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await verifyBVN(bvn);
      onVerified(bvn);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify BVN');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">BVN Verification</h3>
      <p className="text-gray-600 mb-6">
        Please provide your BVN for account verification. This is required to create your virtual account.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-error-50 text-error-800 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="bvn" className="block text-sm font-medium text-gray-700 mb-1">
            Bank Verification Number (BVN)
          </label>
          <input
            id="bvn"
            type="text"
            value={bvn}
            onChange={(e) => setBvn(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            pattern="[0-9]{11}"
            maxLength={11}
            placeholder="Enter your 11-digit BVN"
            required
          />
          <p className="mt-1 text-xs text-gray-500">Your BVN is securely encrypted and stored</p>
        </div>

        <div className="flex justify-end space-x-3">
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
            Verify BVN
          </Button>
        </div>
      </form>
    </div>
  );
}
