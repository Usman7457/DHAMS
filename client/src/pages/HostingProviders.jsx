import React, { useState, useEffect, useMemo } from 'react';
import { Server, Plus, Edit, Trash2, ChevronLeft, ChevronRight, X, ExternalLink } from 'lucide-react';
import api from '../api';

export function HostingProvidersPage({ addToast, currentUser }) {
  const isAdmin = currentUser?.role === 'admin';
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [providerToDelete, setProviderToDelete] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    website_url: '',
    notes: '',
  });

  // Requirement 1: Search filter input for every column
  const [columnFilters, setColumnFilters] = useState({
    id: '',
    name: '',
    website_url: '',
    notes: '',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/hosting-providers');
      setProviders(res.data);
    } catch (err) {
      addToast('Failed to fetch hosting providers list', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredProviders = useMemo(() => {
    return providers
      .filter((p) => {
        const matchId = columnFilters.id === '' || String(p.id).includes(columnFilters.id);
        const matchName = (p.name || '').toLowerCase().includes(columnFilters.name.toLowerCase());
        const matchUrl = (p.website_url || '').toLowerCase().includes(columnFilters.website_url.toLowerCase());
        const matchNotes = (p.notes || '').toLowerCase().includes(columnFilters.notes.toLowerCase());
        return matchId && matchName && matchUrl && matchNotes;
      })
      .sort((a, b) => a.id - b.id);
  }, [providers, columnFilters]);

  const totalPages = Math.ceil(filteredProviders.length / pageSize) || 1;
  const paginatedProviders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProviders.slice(start, start + pageSize);
  }, [filteredProviders, currentPage, pageSize]);

  const handleOpenAdd = () => {
    setEditingProvider(null);
    setFormData({ name: '', website_url: '', notes: '' });
    setModalOpen(true);
  };

  const handleOpenEdit = (provider) => {
    setEditingProvider(provider);
    setFormData({
      name: provider.name || '',
      website_url: provider.website_url || '',
      notes: provider.notes || '',
    });
    setModalOpen(true);
  };

  const handleOpenDelete = (provider) => {
    setProviderToDelete(provider);
    setDeleteModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProvider) {
        await api.put(`/hosting-providers/${editingProvider.id}`, formData);
        addToast('Hosting provider company updated!', 'success');
      } else {
        await api.post('/hosting-providers', formData);
        addToast('New hosting provider added!', 'success');
      }
      setModalOpen(false);
      fetchProviders();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save provider', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!providerToDelete) return;
    try {
      await api.delete(`/hosting-providers/${providerToDelete.id}`);
      addToast('Hosting provider deleted!', 'success');
      setDeleteModalOpen(false);
      fetchProviders();
    } catch (err) {
      addToast('Failed to delete provider', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">Hosting Provider Companies List</h2>
          <p className="text-xs text-stone-500">Manage hosting provider companies (e.g. HosterPK, HostNext, Hostinger, AWS, cPanel HostGator)</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-semibold text-xs shadow-md shadow-amber-800/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Hosting Provider</span>
          </button>
        )}
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
                <th className="py-3 px-4 min-w-[200px]">
                  Company / Provider Name
                  <input
                    type="text"
                    placeholder="Search company..."
                    value={columnFilters.name}
                    onChange={(e) => setColumnFilters({ ...columnFilters, name: e.target.value })}
                    className="mt-1.5 w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-[11px] text-stone-800 placeholder-stone-400 font-normal focus:outline-none focus:border-amber-600"
                  />
                </th>
                <th className="py-3 px-4 min-w-[220px]">
                  Official Website Portal
                  <input
                    type="text"
                    placeholder="Search portal URL..."
                    value={columnFilters.website_url}
                    onChange={(e) => setColumnFilters({ ...columnFilters, website_url: e.target.value })}
                    className="mt-1.5 w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-[11px] text-stone-800 placeholder-stone-400 font-normal focus:outline-none focus:border-amber-600"
                  />
                </th>
                <th className="py-3 px-4 min-w-[200px]">
                  Notes
                  <input
                    type="text"
                    placeholder="Search notes..."
                    value={columnFilters.notes}
                    onChange={(e) => setColumnFilters({ ...columnFilters, notes: e.target.value })}
                    className="mt-1.5 w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-[11px] text-stone-800 placeholder-stone-400 font-normal focus:outline-none focus:border-amber-600"
                  />
                </th>
                {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {paginatedProviders.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="py-8 text-center text-stone-400 text-xs">
                    No hosting providers registered.
                  </td>
                </tr>
              ) : (
                paginatedProviders.map((provider) => (
                  <tr key={provider.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-900">
                      #{provider.id}
                    </td>
                    <td className="py-3 px-4 font-bold text-stone-900">
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>{provider.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {provider.website_url ? (
                        <a
                          href={provider.website_url.startsWith('http') ? provider.website_url : `https://${provider.website_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-800 hover:underline inline-flex items-center gap-1 font-bold"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>{provider.website_url}</span>
                        </a>
                      ) : (
                        <span className="text-stone-400 font-sans italic">No website URL</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-stone-600">{provider.notes || '-'}</td>
                    {isAdmin && (
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(provider)}
                            className="p-1.5 rounded-lg bg-stone-100 hover:bg-amber-700 text-stone-600 hover:text-white transition-all"
                            title="Edit Provider"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(provider)}
                            className="p-1.5 rounded-lg bg-stone-100 hover:bg-rose-600 text-stone-600 hover:text-white transition-all"
                            title="Delete Provider"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
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
            <span>entries &bull; Total {filteredProviders.length} providers</span>
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

      {/* MODAL */}
      {modalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-stone-200 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <h3 className="font-bold text-base text-stone-900">
                {editingProvider ? `Edit Hosting Provider (#${editingProvider.id})` : 'Add Hosting Provider'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-stone-400 hover:text-stone-700 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                  Company / Provider Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. HosterPK, HostNext, Hostinger"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                  Official Website Portal URL
                </label>
                <input
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  placeholder="https://www.hosterpk.com"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-amber-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-amber-600"
                />
              </div>

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
                  className="px-5 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-xs font-bold text-white shadow-md shadow-amber-800/20"
                >
                  {editingProvider ? 'Update Provider' : 'Save Provider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteModalOpen && providerToDelete && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white border border-stone-200 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-900">Delete Hosting Provider?</h3>
            <p className="text-xs text-stone-600">
              Are you sure you want to delete provider <span className="text-stone-900 font-bold">{providerToDelete.name}</span>?
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
