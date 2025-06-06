import { useRouter } from 'next/router';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { 
  LifeBuoy, 
  Home, 
  User, 
  MessageSquare, 
  Wallet, 
  ShoppingBag, 
  Bell, 
  Menu, 
  X, 
  LogOut, 
  Settings,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  Key,
  History,
  CreditCard,
  AlertCircle,
  Users,
  Shield,
  Clock,
  Activity,
  CheckCircle,
  Banknote,
  Receipt,
  ArrowUpRight,
  Calendar
} from 'lucide-react';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, signOut } = useAuth();
  const { notifications, unreadCount } = useNotifications();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const router = useRouter();

  // Redirect to login if user is not authenticated
  if (!user) {
    router.push('/auth/login');
    return null;
  }

  // Navigation links
  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: <Home size={20} /> },
    { name: 'My Thrifts', path: '/dashboard/thrifts', icon: <Wallet size={20} /> },
    { name: 'Wallet Transactions', path: '/dashboard/wallet-transactions', icon: <CreditCard size={20} /> },
    { 
      name: 'Settlement Accounts', 
      path: '/dashboard/settlements', 
      icon: <Banknote size={20} />,
      subItems: [
        { name: 'Due for Clearance', path: '/dashboard/settlements/due', icon: <Receipt size={16} /> },
        { name: 'All Paid Accounts', path: '/dashboard/settlements/paid', icon: <CheckCircle size={16} /> },
        { name: 'Request Bulk Account Withdrawal', path: '/dashboard/settlements/bulk-withdrawal', icon: <ArrowUpRight size={16} /> },
        { name: 'Account for Next Settlement', path: '/dashboard/settlements/next', icon: <Calendar size={16} /> },
      ]
    },
    { 
      name: 'Complaints', 
      path: '/dashboard/complaints', 
      icon: <MessageSquare size={20} />,
      subItems: [
        { name: 'Log A New Complain', path: '/dashboard/complaints/new', icon: <PlusCircle size={16} /> },
        { name: 'View Pending Complaints', path: '/dashboard/complaints/pending', icon: <Clock size={16} /> },
        { name: 'View Ongoing Complaints', path: '/dashboard/complaints/ongoing', icon: <Activity size={16} /> },
        { name: 'View Completed Complaints', path: '/dashboard/complaints/completed', icon: <CheckCircle size={16} /> },
      ]
    },
    { name: 'December Foodie', path: '/dashboard/december-foodie', icon: <ShoppingBag size={20} /> },
    { 
      name: 'My Profile', 
      path: '/dashboard/profile', 
      icon: <User size={20} />,
      subItems: [
        { name: 'Go to My Profile', path: '/dashboard/profile', icon: <User size={16} /> },
        { name: 'Add More Account', path: '/dashboard/add-account', icon: <PlusCircle size={16} /> },
        { name: 'Clear Bulk Account Defaults', path: '/dashboard/clear-defaults', icon: <AlertCircle size={16} /> },
        { name: 'Change Password', path: '/dashboard/change-password', icon: <Key size={16} /> },
        { name: 'View Bank Details', path: '/dashboard/bank-details', icon: <CreditCard size={16} /> },
        { name: 'Login History', path: '/dashboard/login-history', icon: <History size={16} /> },
        { name: 'Saturday(s) Wallet Balance', path: '/dashboard/saturday-wallet', icon: <Wallet size={16} /> },
        { name: 'Defaults Suspended Account', path: '/dashboard/suspended-defaults', icon: <Shield size={16} /> },
        { name: 'Defaults Auto Downline', path: '/dashboard/auto-downline', icon: <Users size={16} /> },
      ]
    },
  ];

  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (path: string) => {
    setExpandedSection(expandedSection === path ? null : path);
  };

  const isActive = (path: string) => {
    return router.pathname === path;
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
    setUserMenuOpen(false);
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
    setNotificationsOpen(false);
  };

  const handleLogout = async () => {
    try {
      console.log('Attempting to sign out...');
      await signOut();
      console.log('Successfully signed out, navigating to login page...');
      router.push('/auth/login');
    } catch (err) {
      console.error('Error during logout:', err);
      // Still try to navigate to login page even if there's an error
      router.push('/auth/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and mobile menu button */}
            <div className="flex">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 md:hidden"
                onClick={toggleSidebar}
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <div className="flex-shrink-0 flex items-center">
                <Link href="/dashboard" className="flex items-center space-x-2">
                  <LifeBuoy size={28} className="text-primary-600" />
                  <span className="text-xl font-bold text-primary-600 hidden sm:inline-block">Honest Minds</span>
                </Link>
              </div>
            </div>

            {/* User navigation */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button
                  type="button"
                  className="p-1 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none"
                  onClick={toggleNotifications}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                  )}
                </button>

                {/* Notifications dropdown */}
                {notificationsOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="py-2 px-4 border-b border-gray-100">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="text-xs font-medium text-primary-600">{unreadCount} new</span>
                        )}
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.slice(0, 5).map((notification) => (
                          <div
                            key={notification.id}
                            className={`px-4 py-3 hover:bg-gray-50 ${!notification.read ? 'bg-blue-50/30' : ''}`}
                          >
                            <div className="flex justify-between">
                              <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(notification.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <p className="mt-1 text-sm text-gray-500">{notification.message}</p>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-6 text-center text-sm text-gray-500">
                          No notifications to display
                        </div>
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="py-2 px-4 border-t border-gray-100">
                        <button 
                          className="text-xs font-medium text-primary-600 hover:text-primary-800 w-full text-center"
                        >
                          View all notifications
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  type="button"
                  className="flex items-center space-x-2 rounded-full focus:outline-none"
                  onClick={toggleUserMenu}
                >
                  <div className="h-8 w-8 rounded-full bg-primary-200 flex items-center justify-center text-primary-800 font-medium">
                    {(user.user_metadata?.name || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:inline-block text-sm font-medium text-gray-700">
                    {user.user_metadata?.name || user.email || 'User'}
                  </span>
                  <ChevronDown size={16} className="text-gray-500" />
                </button>

                {/* User menu dropdown */}
                {userMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="py-1">
                      <Link
                        href="/dashboard/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <div className="flex items-center">
                          <User size={16} className="mr-2" />
                          Go to My Profile
                        </div>
                      </Link>
                      <Link
                        href="/dashboard/add-account"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <div className="flex items-center">
                          <PlusCircle size={16} className="mr-2" />
                          Add More Account
                        </div>
                      </Link>
                      <Link
                        href="/dashboard/clear-defaults"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <div className="flex items-center">
                          <AlertCircle size={16} className="mr-2" />
                          Clear Bulk Account Defaults
                        </div>
                      </Link>
                      <Link
                        href="/dashboard/change-password"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <div className="flex items-center">
                          <Key size={16} className="mr-2" />
                          Change Password
                        </div>
                      </Link>
                      <Link
                        href="/dashboard/bank-details"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <div className="flex items-center">
                          <CreditCard size={16} className="mr-2" />
                          View Bank Details
                        </div>
                      </Link>
                      <Link
                        href="/dashboard/login-history"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <div className="flex items-center">
                          <History size={16} className="mr-2" />
                          Login History
                        </div>
                      </Link>
                      <Link
                        href="/dashboard/saturday-wallet"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <div className="flex items-center">
                          <Wallet size={16} className="mr-2" />
                          Saturday(s) Wallet Balance
                        </div>
                      </Link>
                      <Link
                        href="/dashboard/suspended-defaults"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <div className="flex items-center">
                          <Shield size={16} className="mr-2" />
                          Defaults Suspended Account
                        </div>
                      </Link>
                      <Link
                        href="/dashboard/auto-downline"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <div className="flex items-center">
                          <Users size={16} className="mr-2" />
                          Defaults Auto Downline
                        </div>
                      </Link>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={handleLogout}
                      >
                        <div className="flex items-center">
                          <LogOut size={16} className="mr-2" />
                          Sign out
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={toggleSidebar}
            aria-label="Close sidebar overlay"
          />
        )}
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 w-64 bg-white shadow-md pt-16 pb-4 transition-transform duration-300 ease-in-out flex-shrink-0 z-50
            ${sidebarOpen ? 'block' : 'hidden'} md:block md:static md:translate-x-0 md:pt-0 md:z-auto`}
          aria-label="Sidebar navigation"
        >
          <div className="h-full flex flex-col justify-between px-4">
            <nav className="mt-8 space-y-1">
              {navLinks.map((link) => (
                <div key={link.path}>
                  {link.subItems ? (
                    <button
                      onClick={() => toggleSection(link.path)}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md group transition-colors ${
                        isActive(link.path)
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`mr-3 ${isActive(link.path) ? 'text-primary-600' : 'text-gray-500'}`}>
                        {link.icon}
                      </span>
                      {link.name}
                      <ChevronDown
                        size={16}
                        className={`ml-auto transition-transform ${
                          expandedSection === link.path ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  ) : (
                    <Link
                      href={link.path}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md group transition-colors ${
                        isActive(link.path)
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className={`mr-3 ${isActive(link.path) ? 'text-primary-600' : 'text-gray-500'}`}>
                        {link.icon}
                      </span>
                      {link.name}
                      {isActive(link.path) && <ChevronRight size={16} className="ml-auto text-primary-500" />}
                    </Link>
                  )}
                  {link.subItems && expandedSection === link.path && (
                    <div className="ml-4 mt-1 space-y-1">
                      {link.subItems.map((subItem) => (
                        <Link
                          key={subItem.path}
                          href={subItem.path}
                          className={`flex items-center px-4 py-2 text-sm font-medium rounded-md group transition-colors ${
                            isActive(subItem.path)
                              ? 'bg-primary-50 text-primary-700'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <span className={`mr-3 ${isActive(subItem.path) ? 'text-primary-600' : 'text-gray-500'}`}>
                            {subItem.icon}
                          </span>
                          {subItem.name}
                          {isActive(subItem.path) && <ChevronRight size={16} className="ml-auto text-primary-500" />}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            <div className="mt-auto px-4 py-6">
              <div className="bg-primary-50 rounded-lg p-4">
                <h3 className="text-xs font-semibold text-primary-800 uppercase tracking-wider">
                  Need Help?
                </h3>
                <p className="mt-2 text-xs text-gray-600">
                  Contact our support team or visit our help center for assistance.
                </p>
                <button className="mt-3 text-xs font-medium text-primary-600 hover:text-primary-700">
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main
          className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 transition-all duration-300"
          style={{ minWidth: 0 }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
