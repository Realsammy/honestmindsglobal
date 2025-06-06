import { useAuth } from '../../hooks/useAuth';
import { Bell, Search, User } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-lg font-semibold text-gray-900">Admin Dashboard</span>
            </div>
          </div>

          <div className="flex items-center">
            <div className="flex-shrink-0">
              <button
                type="button"
                className="relative p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <span className="sr-only">View notifications</span>
                <Bell className="h-6 w-6" />
              </button>
            </div>

            <div className="ml-4 flex items-center md:ml-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary-600" />
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-700">
                    {user?.email}
                  </div>
                  <div className="text-xs text-gray-500">
                    Admin
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
} 