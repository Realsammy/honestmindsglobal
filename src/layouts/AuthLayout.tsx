import Link from 'next/link';
import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LifeBuoy } from 'lucide-react';
import { useRouter } from 'next/router';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const { user } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if user is already logged in
  if (user) {
    router.push('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center">
          <LifeBuoy className="h-12 w-12 text-primary-600" />
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Welcome to Honesmind
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {children}
        </div>
      </div>
    </div>
  );
}
