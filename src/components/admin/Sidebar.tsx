import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  CreditCard, 
  ShoppingBag, 
  Settings,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';

export default function Sidebar() {
  const router = useRouter();

  const navLinks = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
    { name: 'Users', path: '/admin/users', icon: <Users size={20} /> },
    { name: 'Thrifts', path: '/admin/thrifts', icon: <CreditCard size={20} /> },
    { name: 'Complaints', path: '/admin/complaints', icon: <MessageSquare size={20} /> },
    { name: 'December Foodie', path: '/admin/december-foodie', icon: <ShoppingBag size={20} /> },
  ];

  const isActive = (path: string) => {
    return router.pathname === path;
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-md hidden lg:block">
      <div className="h-full flex flex-col justify-between px-4">
        <div>
          <div className="flex items-center justify-center h-16 border-b border-gray-200">
            <Link href="/admin" className="flex items-center space-x-2">
              <span className="text-xl font-bold text-gray-900">Admin Portal</span>
            </Link>
          </div>

          <nav className="mt-8 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-md group transition-colors ${
                  isActive(link.path)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className={`mr-3 ${isActive(link.path) ? 'text-primary-600' : 'text-gray-500'}`}>
                  {link.icon}
                </span>
                {link.name}
                {isActive(link.path) && <ChevronRight size={16} className="ml-auto text-primary-500" />}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto px-4 py-6">
          <div className="bg-amber-50 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle size={16} className="text-amber-500" />
              <h3 className="ml-2 text-xs font-semibold text-amber-800 uppercase tracking-wider">
                Admin Access
              </h3>
            </div>
            <p className="mt-2 text-xs text-gray-600">
              Remember that all actions are logged and monitored for security purposes.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
} 