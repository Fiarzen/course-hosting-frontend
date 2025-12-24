import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../api/api';

function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [upgrading, setUpgrading] = useState({});
  const [resetting, setResetting] = useState({});

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    } else {
      setError('Only admins can access this page.');
      setLoading(false);
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await usersApi.getAll();
      // Backend returns ResponseEntity, so data is in response.data
      const data = Array.isArray(response) ? response : (response.data || []);
      setUsers(data);
      setError(null);
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 401) {
        setError(err.response?.data?.error || 'Only admins can access this page.');
      } else {
        setError(err.response?.data?.error || 'Failed to load users. Make sure you are an admin.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeToCreator = async (userId) => {
    setUpgrading({ ...upgrading, [userId]: true });
    try {
      await usersApi.upgradeUserToCreator(userId);
      // Reload users
      await loadUsers();
      alert('User successfully upgraded to CREATOR!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to upgrade user. Please try again.');
      console.error(err);
    } finally {
      setUpgrading({ ...upgrading, [userId]: false });
    }
  };

  const handleResetPassword = async (userId) => {
    if (!window.confirm('Generate a password reset link for this user?')) {
      return;
    }

    setResetting({ ...resetting, [userId]: true });
    try {
      const result = await usersApi.resetPassword(userId);
      const resetPath = result?.resetPath || (result?.resetToken ? `/reset-password?token=${result.resetToken}` : '');

      if (!resetPath) {
        alert('Password reset link could not be generated. Please try again.');
        return;
      }

      const fullUrl = `${window.location.origin}${resetPath}`;

      // Show a prompt so the admin can copy the link and send it to the user
      window.prompt('Copy this password reset link and send it to the user:', fullUrl);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to generate password reset link. Please try again.');
      console.error(err);
    } finally {
      setResetting({ ...resetting, [userId]: false });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Users</h2>

      {users.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No users found.</p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                {isAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((userItem) => (
                <tr key={userItem.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {userItem.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {userItem.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {userItem.email || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      userItem.role === 'ADMIN' 
                        ? 'bg-purple-100 text-purple-800'
                        : userItem.role === 'CREATOR'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {userItem.role || 'N/A'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      {userItem.role !== 'CREATOR' && userItem.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleUpgradeToCreator(userItem.id)}
                          disabled={upgrading[userItem.id]}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-1 px-3 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {upgrading[userItem.id] ? 'Upgrading...' : 'Upgrade to Creator'}
                        </button>
                      )}
                      <button
                        onClick={() => handleResetPassword(userItem.id)}
                        disabled={resetting[userItem.id]}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium py-1 px-3 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {resetting[userItem.id] ? 'Generating link...' : 'Reset Password'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Users;

