import { ReactNode } from 'react';
import Link from 'next/link';
import { LifeBuoy } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center">
              <LifeBuoy size={28} className="text-primary-600" />
              <h1 className="ml-2 text-xl font-bold text-primary-600">Honest Minds</h1>
            </Link>
            <div className="hidden md:flex space-x-8 items-center">
              <Link href="/about" className="text-gray-600 hover:text-gray-900">About Us</Link>
              <Link href="/#features" className="text-gray-600 hover:text-gray-900">Features</Link>
              <Link href="/#how-it-works" className="text-gray-600 hover:text-gray-900">How It Works</Link>
              <Link href="/#contact" className="text-gray-600 hover:text-gray-900">Contact</Link>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <Link
                  href="/dashboard"
                  className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/auth/register"
                    className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-base text-gray-500">
              &copy; {new Date().getFullYear()} Honest Minds. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 
