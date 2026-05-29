import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../api/api';
import { Leaf, Kicker, RolePill, LeafLoader } from './Leaf';

function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [upgrading, setUpgrading] = useState({});
  const [resetting, setResetting] = useState({});
  const [deleting, setDeleting] = useState({});
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');

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
      let fullUrl = '';
      if (result?.resetToken) {
        const path = `/reset-password?token=${encodeURIComponent(result.resetToken)}`;
        fullUrl = `${window.location.origin}${path}`;
      } else if (result?.resetPath) {
        const rp = result.resetPath;
        if (/^https?:\/\//i.test(rp)) {
          fullUrl = rp;
        } else {
          const normalizedPath = rp.startsWith('/') ? rp : `/${rp}`;
          fullUrl = `${window.location.origin}${normalizedPath}`;
        }
      }
      if (!fullUrl) {
        alert('Password reset link could not be generated. Please try again.');
        return;
      }
      window.prompt('Copy this password reset link and send it to the user:', fullUrl);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to generate password reset link. Please try again.');
      console.error(err);
    } finally {
      setResetting({ ...resetting, [userId]: false });
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (!window.confirm(
      `Permanently delete the account for "${userEmail}"? This will also delete all their courses and data. This cannot be undone.`
    )) return;

    setDeleting((prev) => ({ ...prev, [userId]: true }));
    try {
      await usersApi.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete user. Please try again.');
      console.error(err);
    } finally {
      setDeleting((prev) => ({ ...prev, [userId]: false }));
    }
  };

  if (loading) {
    return <LeafLoader label="loading people" />;
  }

  if (error) {
    return (
      <div className="ml-card p-6 my-12 max-w-page mx-auto" role="alert">
        <strong className="font-serif text-ink">A small pause. </strong>
        <span className="text-ink-soft">{error}</span>
      </div>
    );
  }

  const counts = {
    all: users.length,
    student: users.filter((u) => u.role === 'STUDENT').length,
    creator: users.filter((u) => u.role === 'CREATOR').length,
    admin: users.filter((u) => u.role === 'ADMIN').length,
  };
  const query = q.trim().toLowerCase();
  const filtered = users
    .filter((u) => (filter === 'all' ? true : u.role === filter.toUpperCase()))
    .filter((u) => (query ? `${u.name || ''} ${u.email || ''}`.toLowerCase().includes(query) : true));

  const thStyle = 'font-mono text-[10px] tracking-widest uppercase text-ink-faint font-normal py-4 pr-4 text-left';
  const tdStyle = 'py-5 pr-4 align-middle';
  const cellBorder = { borderBottom: '1px solid var(--hair)' };

  return (
    <div className="ml-screen-fade max-w-page mx-auto py-12">
      <Kicker className="mb-4">studio · admin</Kicker>
      <h1 className="font-serif text-[clamp(38px,5vw,56px)] leading-[1.05] text-ink tracking-tight2 mb-3">People in the garden.</h1>
      <p className="text-[16px] text-ink-soft leading-relaxed max-w-[520px] mb-10">
        Everyone who has joined us, and the role they play.
      </p>

      <div className="flex items-center justify-between gap-6 flex-wrap pb-4 mb-2" style={{ borderBottom: '1px solid var(--hair)' }}>
        <div className="flex gap-6 flex-wrap">
          {[['all', 'all'], ['student', 'students'], ['creator', 'creators'], ['admin', 'admins']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="text-[13px] py-1.5 inline-flex items-baseline gap-1.5"
              style={{
                color: filter === key ? 'var(--ink)' : 'var(--ink-soft)',
                borderBottom: '2px solid ' + (filter === key ? 'var(--moss)' : 'transparent'),
              }}
            >
              {label}
              <span className="font-mono text-[10px] text-ink-faint">{String(counts[key]).padStart(2, '0')}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 min-w-[220px]" style={{ borderBottom: '1px solid var(--hair-strong)' }}>
          <span className="font-mono text-[11px] text-ink-faint">search</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="name or email"
            className="flex-1 bg-transparent outline-none py-2 text-[14px] text-ink"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-ink-faint">
          <Leaf size={28} strokeWidth={1} />
          <p className="mt-3 text-[14px]">No one matches that search.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={thStyle} style={cellBorder}>person</th>
                <th className={thStyle} style={cellBorder}>role</th>
                <th className={`${thStyle} text-right pr-0`} style={cellBorder}>actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((userItem) => (
                <tr key={userItem.id}>
                  <td className={tdStyle} style={cellBorder}>
                    <div className="flex items-center gap-3.5">
                      <span
                        className="grid place-items-center rounded-full shrink-0"
                        style={{ width: 36, height: 36, background: 'var(--moss-wash)', border: '1px solid var(--hair)', color: 'var(--moss-deep)', fontSize: 13 }}
                      >
                        {(userItem.name || userItem.email || '?')[0]?.toLowerCase()}
                      </span>
                      <div className="min-w-0">
                        <div className="text-[14px] text-ink truncate">{userItem.name || 'unnamed'}</div>
                        <div className="text-[12px] text-ink-faint truncate">{userItem.email || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className={tdStyle} style={cellBorder}>
                    <RolePill role={userItem.role || 'STUDENT'} />
                  </td>
                  <td className={`${tdStyle} pr-0`} style={cellBorder}>
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                      {userItem.role !== 'CREATOR' && userItem.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleUpgradeToCreator(userItem.id)}
                          disabled={upgrading[userItem.id]}
                          className="ml-button-ghost text-[11px] py-1.5 px-3"
                        >
                          {upgrading[userItem.id] ? 'upgrading…' : 'make creator'}
                        </button>
                      )}
                      <button
                        onClick={() => handleResetPassword(userItem.id)}
                        disabled={resetting[userItem.id]}
                        className="ml-button-ghost text-[11px] py-1.5 px-3"
                      >
                        {resetting[userItem.id] ? 'generating…' : 'reset password'}
                      </button>
                      {userItem.role !== 'ADMIN' && userItem.id !== user?.id && (
                        <button
                          onClick={() => handleDeleteUser(userItem.id, userItem.email)}
                          disabled={deleting[userItem.id]}
                          className="text-[11px] text-ink-faint hover:text-ink px-1"
                        >
                          {deleting[userItem.id] ? 'deleting…' : 'delete'}
                        </button>
                      )}
                    </div>
                  </td>
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
