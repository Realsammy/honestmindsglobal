import { useState } from 'react';
import { testVirtualAccountCreation } from '../utils/flutterwave';
import Button from './ui/Button';
import { useToast } from './ui/Toast';

export default function TestVirtualAccount() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const { toast } = useToast();

  const handleTest = async () => {
    setIsLoading(true);
    try {
      const result = await testVirtualAccountCreation();
      setTestResult(result);
      toast({
        title: 'Success',
        description: 'Virtual account created successfully!',
        type: 'success'
      });
    } catch (error) {
      console.error('Test failed:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create virtual account',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Test Virtual Account Creation</h3>
      
      <Button
        onClick={handleTest}
        isLoading={isLoading}
        className="mb-4"
      >
        Create Test Virtual Account
      </Button>

      {testResult && (
        <div className="mt-4 space-y-2">
          <h4 className="font-medium">Test Results:</h4>
          <div className="bg-gray-50 p-4 rounded-md">
            <p><strong>Account Number:</strong> {testResult.account_number}</p>
            <p><strong>Bank Name:</strong> {testResult.bank_name}</p>
            <p><strong>Flutterwave Ref:</strong> {testResult.flw_ref}</p>
            <p><strong>Order Ref:</strong> {testResult.order_ref}</p>
            <p><strong>Created At:</strong> {new Date(testResult.created_at).toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
} 
