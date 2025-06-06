import { useState } from 'react';
import Link from 'next/link';
import { KeyRound, ArrowLeft, Mail } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { supabase } from '../../lib/supabase';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Check your email for the password reset link',
        type: 'success'
      });
    } catch (err) {
      const error = err as Error;
      toast({
        title: 'Error',
        description: error.message || 'Failed to send reset email',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
      setSuccess(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-2xl animate-fade-in">
        <div className="text-center mb-8">
          <KeyRound className="mx-auto h-12 w-12 text-indigo-600 mb-2" />
          <h2 className="text-2xl font-bold text-gray-900">Reset your password</h2>
          <p className="mt-2 text-gray-600">
            Enter your email and we'll send you instructions to reset your password
          </p>
        </div>
        {success ? (
          <div className="bg-green-50 text-green-800 p-4 rounded-md text-center">
            <p className="font-medium">Password reset email sent!</p>
            <p className="mt-1 text-sm">Check your inbox for instructions on how to reset your password.</p>
            <div className="mt-6">
              <Link href="/auth/login" className="inline-flex items-center text-indigo-600 hover:text-indigo-500 font-medium">
                <ArrowLeft size={16} className="mr-2" />
                Back to Sign in
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm w-full focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                  placeholder="Enter your email"
                />
              </div>
            </div>
            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Reset Password'}
              </button>
            </div>
            <div className="text-center">
              <Link href="/auth/login" className="inline-flex items-center text-indigo-600 hover:text-indigo-500 text-sm font-medium">
                <ArrowLeft size={16} className="mr-1" />
                Back to Sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
