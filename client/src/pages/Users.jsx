import React, { useState, useEffect, useMemo } from 'react';
import { UserCog, Plus, Edit, Trash2, ChevronLeft, ChevronRight, X, ShieldCheck, UserCheck } from 'lucide-react';
import api from '../api';

export function UsersPage({ addToast, clients }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    role: 'viewer',
    client_id: '',
  });

  const [columnFilters, setColumnFilters] = useState({
    id: '',
    username: '',
    full_name: '',
    role: '',
    client_name: '',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      addToast('Failed to fetch users list', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchId = columnFilters.id === '' || String(u.id).includes(columnFilters.id);
      const matchUser = (u.username || '').toLowerCase().includes(columnFilters.username.toLowerCase());
      const matchName = (u.full_name || '').toLowerCase().includes(columnFilters.full_name.toLowerCase());
      const matchRole = (u.role || '').toLowerCase().includes(columnFilters.role.toLowerCase());
      const matchClient = (u.client_name || '').toLowerCase().includes(columnFilters.client_name.toLowerCase());
      return matchId && matchUser && matchName && matchRole && matchClient;
    });
  }, [users, columnFilters]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      full_name: '',
      email: '',
      role: 'viewer',
      client_id: clients[0]?.id || '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username || '',
      password: '',
      full_name: user.full_name || '',
      email: user.email || '',
      role: user.role || 'viewer',
      client_id: user.client_id || '',
    });
    setModalOpen(true);
  };

  const handleOpenDelete = (user) => {
    if (user.is_system_default) {
      addToast('System Default Admin cannot be deleted!', 'warning');
      return;
    }
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, formData);
        addToast('User details updated!', 'success');
      } else {
        await api.post('/users', formData);
        addToast('New user account created successfully!', 'success');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save user', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    try {
      await api.delete(`/users/${userToDelete.id}`);
      addToast('User deleted successfully!', 'success');
      setDeleteModalOpen(false);
      fetchUsers();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete user', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">Users Management (Admin Panel)</h2>
          <p className="text-xs text-stone-500">Create user accounts, set access roles (Admin / Viewer), and restrict client scope</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs shadow-md shadow-amber-700/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create New User</span>
        </button>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 text-stone-500 uppercase text-[10px] tracking-wider border-b border-stone-200">
              <tr>
                <th className="py-3 px-4 w-20">
                  ID
                  <input
                    type="text"
                    placeholder="ID..."
                    value={columnFilters.id}
                    onChange={(e) => setColumnFilters({ ...columnFilters, id: e.target.value })}
                    className="mt-1.5 w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-[11px] text-stone-800 placeholder-stone-400 font-normal focus:outline-none focus:border-amber-600"
                  />
                </th>
                <th className="py-3 px-4 min-w-[160px]">
                  Username
                  <input
                    type="text"
                    placeholder="Filter user..."
                    value={columnFilters.username}
                    onChange={(e) => setColumnFilters({ ...columnFilters, username: e.target.value })}
                    className="mt-1.5 w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-[11px] text-stone-800 placeholder-stone-400 font-normal focus:outline-none focus:border-amber-600"
                  />
                </th>
                <th className="py-3 px-4 min-w-[180px]">
                  Full Name
                  <input
                    type="text"
                    placeholder="Filter name..."
                    value={columnFilters.full_name}
                    onChange={(e) => setColumnFilters({ ...columnFilters, full_name: e.target.value })}
                    className="mt-1.5 w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-[11px] text-stone-800 placeholder-stone-400 font-normal focus:outline-none focus:border-amber-600"
                  />
                </th>
                <th className="py-3 px-4 min-w-[120px]">
                  Access Role
                  <input
                    type="text"
                    placeholder="Filter role..."
                    value={columnFilters.role}
                    onChange={(e) => setColumnFilters({ ...columnFilters, role: e.target.value })}
                    className="mt-1.5 w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-[11px] text-stone-800 placeholder-stone-400 font-normal focus:outline-none focus:border-amber-600"
                  />
                </th>
                <th className="py-3 px-4 min-w-[170px]">
                  Scoped Client Link
                  <input
                    type="text"
                    placeholder="Filter client..."
                    value={columnFilters.client_name}
                    onChange={(e) => setColumnFilters({ ...columnFilters, client_name: e.target.value })}
                    className="mt-1.5 w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-[11px] text-stone-800 placeholder-stone-400 font-normal focus:outline-none focus:border-amber-600"
                  />
                </th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400 text-xs">
                    No users found.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-900">
                      #{user.id}
                    </td>
                    <td className="py-3 px-4 font-bold text-stone-900">
                      <div className="flex items-center gap-2">
                        <UserCog className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>@{user.username}</span>
                        {user.is_system_default && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-extrabold border border-amber-300">
                            DEFAULT ADMIN
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold">{user.full_name}</div>
                      {user.email && <div className="text-[10px] text-stone-500">{user.email}</div>}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          user.role === 'admin'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}
                      >
                        {user.role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-stone-700">
                      {user.role === 'admin' ? (
                        <span className="text-stone-400 text-[11px] italic">Full Access (All Clients)</span>
                      ) : user.client_name ? (
                        <span className="font-bold text-emerald-800">
                          {user.client_name} (Client #{user.client_id})
                        </span>
                      ) : (
                        <span className="text-stone-400 text-[11px]">Unlinked</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="p-1.5 rounded-lg bg-stone-100 hover:bg-amber-700 text-stone-600 hover:text-white transition-all"
                          title="Edit User"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {!user.is_system_default && (
                          <button
                            onClick={() => handleOpenDelete(user)}
                            className="p-1.5 rounded-lg bg-stone-100 hover:bg-rose-600 text-stone-600 hover:text-white transition-all"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-stone-300 text-stone-800 rounded-lg px-2 py-1 text-xs focus:outline-none"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
            </select>
            <span>entries &bull; Total {filteredUsers.length} users</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 disabled:opacity-40 text-stone-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-stone-800">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 disabled:opacity-40 text-stone-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* CREATE / EDIT USER MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-stone-200 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <h3 className="font-bold text-base text-stone-900">
                {editingUser ? `Edit User (@${editingUser.username})` : 'Create New User Account'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-stone-400 hover:text-stone-700 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="e.g. faisal"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-amber-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                  {editingUser ? 'Password (Leave blank to keep unchanged)' : 'Password *'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Password"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-amber-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="e.g. Faisal Raza"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. faisal@designhub.pk"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                  Access Role *
                </label>
                <select
                  disabled={editingUser?.is_system_default}
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-amber-600"
                >
                  <option value="viewer">Viewer (Scoped to 1 Client)</option>
                  <option value="admin">Admin (Full System Access)</option>
                </select>
              </div>

              {formData.role === 'viewer' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                    Link to Client Owner (Viewer Scope) *
                  </label>
                  <select
                    required
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-amber-600 font-bold text-emerald-800"
                  >
                    <option value="">-- Choose Client --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        [Client #{c.id}] {c.name} ({c.phone})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-stone-500 mt-1">
                    This user will ONLY be able to see domains and hostings belonging to this client.
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-xs font-bold text-stone-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-xs font-bold text-white shadow-md shadow-amber-700/20"
                >
                  {editingUser ? 'Update User' : 'Save User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalOpen && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white border border-stone-200 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-900">Delete User Account?</h3>
            <p className="text-xs text-stone-600">
              Are you sure you want to delete user <span className="text-stone-900 font-bold">@{userToDelete.username}</span>?
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-xs font-bold text-stone-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-md shadow-rose-600/20"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
