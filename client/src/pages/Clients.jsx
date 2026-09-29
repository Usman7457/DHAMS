import React, { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import api from '../api';

export function ClientsPage({ clients, refreshData, addToast, currentUser }) {
  const isAdmin = currentUser?.role === 'admin';
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [clientToDelete, setClientToDelete] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    notes: '',
  });

  // Column search filters
  const [columnFilters, setColumnFilters] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    company: '',
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchId = columnFilters.id === '' || String(c.id).includes(columnFilters.id);
      const matchName = (c.name || '').toLowerCase().includes(columnFilters.name.toLowerCase());
      const matchEmail = (c.email || '').toLowerCase().includes(columnFilters.email.toLowerCase());
      const matchPhone = (c.phone || '').toLowerCase().includes(columnFilters.phone.toLowerCase());
      const matchCompany = (c.company || '').toLowerCase().includes(columnFilters.company.toLowerCase());
      return matchId && matchName && matchEmail && matchPhone && matchCompany;
    });
  }, [clients, columnFilters]);

  // Paginated slices
  const totalPages = Math.ceil(filteredClients.length / pageSize) || 1;
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredClients.slice(start, start + pageSize);
  }, [filteredClients, currentPage, pageSize]);

  const handleOpenAdd = () => {
    setEditingClient(null);
    setFormData({ name: '', email: '', phone: '', company: '', notes: '' });
    setModalOpen(true);
  };

  const handleOpenEdit = (client) => {
    setEditingClient(client);
    setFormData({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      company: client.company || '',
      notes: client.notes || '',
    });
    setModalOpen(true);
  };

  const handleOpenDelete = (client) => {
    setClientToDelete(client);
    setDeleteModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await api.put(`/clients/${editingClient.id}`, formData);
        addToast('Client details updated successfully!', 'success');
      } else {
        await api.post('/clients', formData);
        addToast('New client registered successfully!', 'success');
      }
      setModalOpen(false);
      refreshData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save client', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;
    try {
      await api.delete(`/clients/${clientToDelete.id}`);
      addToast('Client record deleted successfully!', 'success');
      setDeleteModalOpen(false);
      refreshData();
    } catch (err) {
      addToast('Failed to delete client', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">Clients Directory</h2>
          <p className="text-xs text-stone-500">Manage client profiles, contact numbers, and domain/hosting allocations</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-md shadow-emerald-700/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Client</span>
          </button>
        )}
      </div>

      {/* Main Table Card */}
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
                    className="mt-1.5 w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-[11px] text-stone-800 placeholder-stone-400 font-normal focus:outline-none focus:border-emerald-600"
                  />
                </th>
                <th className="py-3 px-4 min-w-[180px]">
                  Client Name
                  <input
                    type="text"
                    placeholder="Search name..."
                    value={columnFilters.name}
                    onChange={(e) => setColumnFilters({ ...columnFilters, name: e.target.value })}
                    className="mt-1.5 w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-[11px] text-stone-800 placeholder-stone-400 font-normal focus:outline-none focus:border-emerald-600"
                  />
                </th>
                <th className="py-3 px-4 min-w-[150px]">
                  Phone Number
                  <input
                    type="text"
                    placeholder="Search phone..."
                    value={columnFilters.phone}
                    onChange={(e) => setColumnFilters({ ...columnFilters, phone: e.target.value })}
                    className="mt-1.5 w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-[11px] text-stone-800 placeholder-stone-400 font-normal focus:outline-none focus:border-emerald-600"
                  />
                </th>
                <th className="py-3 px-4 min-w-[180px]">
                  Email Address
                  <input
                    type="text"
                    placeholder="Search email..."
                    value={columnFilters.email}
                    onChange={(e) => setColumnFilters({ ...columnFilters, email: e.target.value })}
                    className="mt-1.5 w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-[11px] text-stone-800 placeholder-stone-400 font-normal focus:outline-none focus:border-emerald-600"
                  />
                </th>
                <th className="py-3 px-4 min-w-[140px]">
                  Company
                  <input
                    type="text"
                    placeholder="Search company..."
                    value={columnFilters.company}
                    onChange={(e) => setColumnFilters({ ...columnFilters, company: e.target.value })}
                    className="mt-1.5 w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-[11px] text-stone-800 placeholder-stone-400 font-normal focus:outline-none focus:border-emerald-600"
                  />
                </th>
                <th className="py-3 px-4 text-center">Domains</th>
                <th className="py-3 px-4 text-center">Hostings</th>
                {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {paginatedClients.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="py-8 text-center text-stone-400 text-xs">
                    No matching clients found.
                  </td>
                </tr>
              ) : (
                paginatedClients.map((client) => (
                  <tr key={client.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-900">
                      #{client.id}
                    </td>
                    <td className="py-3 px-4 font-bold text-stone-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs border border-amber-200">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div>{client.name}</div>
                          {client.notes && <div className="text-[10px] text-stone-500 font-normal">{client.notes}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-stone-700">{client.phone}</td>
                    <td className="py-3 px-4 text-stone-600">{client.email || '-'}</td>
                    <td className="py-3 px-4 text-stone-700">{client.company || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 font-bold">
                        {client.domain_count || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 font-bold">
                        {client.hosting_count || 0}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(client)}
                            className="p-1.5 rounded-lg bg-stone-100 hover:bg-emerald-700 text-stone-600 hover:text-white transition-all"
                            title="Edit Client"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(client)}
                            className="p-1.5 rounded-lg bg-stone-100 hover:bg-rose-600 text-stone-600 hover:text-white transition-all"
                            title="Delete Client"
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
            <span>entries &bull; Total {filteredClients.length} clients</span>
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

      {/* CREATE / EDIT CLIENT MODAL */}
      {modalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-stone-200 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <h3 className="font-bold text-base text-stone-900">
                {editingClient ? `Edit Client Details (ID #${editingClient.id})` : 'Register New Client'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-stone-400 hover:text-stone-700 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Sheikh Usman"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                  Phone / Contact Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. +92 300 1234567"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. usman@example.com"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">Company Name</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="e.g. TechCorp Solutions"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">Notes / Description</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional client details..."
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-600"
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
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-xs font-bold text-white shadow-md shadow-emerald-700/20"
                >
                  {editingClient ? 'Update Client' : 'Save Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalOpen && clientToDelete && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white border border-stone-200 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-900">Delete Client Record?</h3>
            <p className="text-xs text-stone-600">
              Are you sure you want to delete <span className="text-stone-900 font-bold">{clientToDelete.name}</span> (ID #{clientToDelete.id})? This action cannot be undone.
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
