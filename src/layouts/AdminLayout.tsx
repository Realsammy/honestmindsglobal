import { useRouter } from 'next/router';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  LifeBuoy, 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  CreditCard, 
  ShoppingBag, 
  LogOut, 
  Settings,
  AlertTriangle,
  ChevronDown,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import Sidebar from '../components/admin/Sidebar';
import Header from '../components/admin/Header';

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const router = useRouter();

  // Redirect to login if user is not authenticated
  if (!user) {
    router.push('/auth/login');
    return null;
  }

  // Redirect to user dashboard if not an admin
  if (!user.is_admin) {
    router.push('/dashboard');
    return null;
  }

  // Navigation links
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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/auth/login');
    } catch (err) {
      console.error('Error during logout:', err);
      // Still try to navigate to login page even if there's an error
      router.push('/auth/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />
      <div className="lg:pl-64">
        <Header />
        <main className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
