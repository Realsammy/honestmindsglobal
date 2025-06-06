import { useState, useEffect } from 'react';
import { User } from '../../types';
import { UserPlus, UserX, Edit, Lock, Unlock, Shield, ShieldOff } from 'lucide-react';
import Button from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useNotification } from '../../hooks/useNotification';

interface UserWithJoins extends User {
  virtual_accounts: {
    account_number: string;
    bank_name: string;
    is_active: boolean;
  }[];
  complaints: {
    id: string;
    status: string;
  }[];
}

export default function AdminUsers() {
  const { showToast } = useNotification();
  const [users, setUsers] = useState<UserWithJoins[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithJoins | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          virtual_accounts (
            account_number,
            bank_name,
            is_active
          ),
          complaints (
            id,
            status
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data as UserWithJoins[] || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('virtual_accounts')
        .update({ is_active: !isActive })
        .eq('user_id', userId);

      if (error) throw error;
      
      // Refresh users list
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const toggleAdminPrivilege = async (userId: string, isAdmin: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_admin: !isAdmin })
        .eq('id', userId);

      if (error) throw error;

      // Notify user of privilege change
      showToast(`Your admin privileges have been ${!isAdmin ? 'granted' : 'revoked'}`, 'info');
      
      // Refresh users list
      fetchUsers();
    } catch (error) {
      console.error('Error toggling admin privilege:', error);
    }
  };

  const handleUserUpdate = async (userData: Partial<User>) => {
    try {
      const { error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', userData.id);

      if (error) throw error;
      
      setIsEditing(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage user accounts, privileges, and virtual accounts
          </p>
        </div>
        <Button
          leftIcon={<UserPlus size={16} />}
          onClick={() => setIsEditing(true)}
        >
          Add User
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Virtual Account
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Complaints
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                          {user.full_name?.[0] || '?'}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.full_name || 'Unnamed User'}
                          {user.is_admin && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800">
                              <Shield size={12} className="mr-1" />
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.virtual_accounts && user.virtual_accounts.length > 0 ? (
                      <div>
                        <div className="text-sm text-gray-900">{user.virtual_accounts[0].account_number}</div>
                        <div className="text-sm text-gray-500">{user.virtual_accounts[0].bank_name}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No virtual account</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.virtual_accounts && user.virtual_accounts.length > 0 && user.virtual_accounts[0].is_active
                        ? 'bg-success-100 text-success-800'
                        : 'bg-error-100 text-error-800'
                    }`}>
                      {user.virtual_accounts && user.virtual_accounts.length > 0 && user.virtual_accounts[0].is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {user.complaints?.length || 0} total
                    </div>
                    <div className="text-sm text-gray-500">
                      {user.complaints?.filter(c => c.status === 'COMPLETED').length || 0} resolved
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedUser(user);
                          setIsEditing(true);
                        }}
                        leftIcon={<Edit size={16} />}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant={user.virtual_accounts && user.virtual_accounts.length > 0 && user.virtual_accounts[0].is_active ? 'outline' : 'primary'}
                        onClick={() => toggleUserStatus(user.id, !!(user.virtual_accounts && user.virtual_accounts.length > 0 && user.virtual_accounts[0].is_active))}
                        leftIcon={user.virtual_accounts && user.virtual_accounts.length > 0 && user.virtual_accounts[0].is_active ? <Lock size={16} /> : <Unlock size={16} />}
                      >
                        {user.virtual_accounts && user.virtual_accounts.length > 0 && user.virtual_accounts[0].is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        size="sm"
                        variant={user.is_admin ? 'outline' : 'primary'}
                        onClick={() => toggleAdminPrivilege(user.id, !!user.is_admin)}
                        leftIcon={user.is_admin ? <ShieldOff size={16} /> : <Shield size={16} />}
                      >
                        {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              {selectedUser ? 'Edit User' : 'Add New User'}
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleUserUpdate({
                id: selectedUser?.id,
                full_name: formData.get('name') as string,
                email: formData.get('email') as string,
                phone_number: formData.get('phone') as string,
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    defaultValue={selectedUser?.full_name}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    defaultValue={selectedUser?.email}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    defaultValue={selectedUser?.phone_number}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedUser(null);
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedUser ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
