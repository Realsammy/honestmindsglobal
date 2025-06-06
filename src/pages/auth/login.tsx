import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../hooks/useNotification.tsx';
import { LogIn, Mail, Lock } from 'lucide-react';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signIn } = useAuth();
  const { showToast } = useNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(identifier, password);
      showToast('Successfully signed in!', 'success');
      router.push('/dashboard');
    } catch (error: any) {
      showToast(error.message || 'An error occurred during sign in', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-2xl animate-fade-in">
        <div className="text-center">
          <LogIn className="mx-auto h-12 w-12 text-indigo-600 mb-2" />
          <h2 className="text-3xl font-extrabold text-gray-900">Welcome back</h2>
          <p className="mt-2 text-sm text-gray-600">Sign in to your account to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">Email or Phone Number</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm w-full focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
                placeholder="e.g. john@example.com or +2348012345678"
                disabled={loading}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <Link href="/auth/forgot-password" className="text-xs text-indigo-600 hover:text-indigo-500 font-medium">Forgot password?</Link>
            </div>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm w-full focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
                placeholder="Enter your password"
                disabled={loading}
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/auth/register" className="font-medium text-indigo-600 hover:text-indigo-500">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
