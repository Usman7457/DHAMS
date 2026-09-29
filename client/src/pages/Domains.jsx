import React, { useState, useMemo } from 'react';
import {
  Globe,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  Eye,
  EyeOff,
} from 'lucide-react';
import api from '../api';
import { SearchableSelect } from '../components/SearchableSelect';

export function DomainsPage({ domains, clients, domainProviders = [], refreshData, addToast, currentUser }) {
  const isAdmin = currentUser?.role === 'admin';
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState(null);
  const [domainToDelete, setDomainToDelete] = useState(null);

  // Masked password view state map for domain registrar credentials
  const [showPasswordMap, setShowPasswordMap] = useState({});

  const togglePasswordVisibility = (id) => {
    setShowPasswordMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const [formData, setFormData] = useState({
    client_id: '',
    domain_name: '',
    provider_name: '',
    provider_url: '',
    provider_username: '',
    provider_password: '',
    registration_date: '',
    expiry_date: '',
    auto_renew: false,
    notes: '',
  });

  // Column search filters
  const [columnFilters, setColumnFilters] = useState({
    id: '',
    domain_name: '',
    client_name: '',
    provider_name: '',
    expiry_date: '',
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredDomains = useMemo(() => {
    return domains.filter((d) => {
      const matchId = columnFilters.id === '' || String(d.id).includes(columnFilters.id);
      const matchDomain = (d.domain_name || '').toLowerCase().includes(columnFilters.domain_name.toLowerCase());
      const matchClient = (d.client_name || '').toLowerCase().includes(columnFilters.client_name.toLowerCase());
      const matchProvider = (d.provider_name || '').toLowerCase().includes(columnFilters.provider_name.toLowerCase());
      const matchExpiry = (d.expiry_date || '').includes(columnFilters.expiry_date);
      return matchId && matchDomain && matchClient && matchProvider && matchExpiry;
    });
  }, [domains, columnFilters]);

  const totalPages = Math.ceil(filteredDomains.length / pageSize) || 1;
  const paginatedDomains = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDomains.slice(start, start + pageSize);
  }, [filteredDomains, currentPage, pageSize]);

  const handleOpenAdd = () => {
    setEditingDomain(null);
    const defaultProv = domainProviders[0]?.name || 'GoDaddy';
    const defaultUrl = domainProviders[0]?.website_url || 'https://sso.godaddy.com';

    setFormData({
      client_id: clients[0]?.id || '',
      domain_name: '',
      provider_name: defaultProv,
      provider_url: defaultUrl,
      provider_username: '',
      provider_password: '',
      registration_date: new Date().toISOString().split('T')[0],
      expiry_date: '',
      auto_renew: false,
      notes: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (domain) => {
    setEditingDomain(domain);
    setFormData({
      client_id: domain.client_id || '',
      domain_name: domain.domain_name || '',
      provider_name: domain.provider_name || '',
      provider_url: domain.provider_url || '',
      provider_username: domain.provider_username || '',
      provider_password: domain.provider_password || '',
      registration_date: domain.registration_date ? domain.registration_date.split('T')[0] : '',
      expiry_date: domain.expiry_date ? domain.expiry_date.split('T')[0] : '',
      auto_renew: domain.auto_renew || false,
      notes: domain.notes || '',
    });
    setModalOpen(true);
  };

  const clientOptions = useMemo(() => {
    return clients.map((c) => ({
      value: String(c.id),
      label: `[ID: #${c.id}] ${c.name} (${c.phone})`,
    }));
  }, [clients]);

  const providerOptions = useMemo(() => {
    return domainProviders.map((dp) => ({
      value: dp.name,
      label: dp.name,
    }));
  }, [domainProviders]);

  const handleProviderSelect = (selectedName) => {
    const matched = domainProviders.find((p) => p.name === selectedName);
    setFormData((prev) => ({
      ...prev,
      provider_name: selectedName,
      provider_url: matched?.website_url || prev.provider_url,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanDomain = (formData.domain_name || '').trim().toLowerCase();
    const exists = domains.some(
      (d) =>
        (d.domain_name || '').trim().toLowerCase() === cleanDomain &&
        (!editingDomain || d.id !== editingDomain.id)
    );
    if (exists) {
      addToast(`Domain name "${formData.domain_name.trim()}" already exists in the system!`, 'error');
      return;
    }

    try {
      if (editingDomain) {
        await api.put(`/domains/${editingDomain.id}`, formData);
        addToast('Domain record updated!', 'success');
      } else {
        await api.post('/domains', formData);
        addToast('Domain added successfully!', 'success');
      }
      setModalOpen(false);
      refreshData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save domain', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!domainToDelete) return;
    try {
      await api.delete(`/domains/${domainToDelete.id}`);
      addToast('Domain record deleted!', 'success');
      setDeleteModalOpen(false);
      refreshData();
    } catch (err) {
      addToast('Failed to delete domain', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">Domains Management</h2>
          <p className="text-xs text-stone-500">Track domain names, registrar portal credentials (GoDaddy/HosterPK), and expirations</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-md shadow-emerald-700/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Domain</span>
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
                    className="mt-1.5 w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-[11px] text-stone-800 placeholder-stone-400 font-normal focus:outline-none focus:border-emerald-600"
                  />
                </th>
                <th className="py-3 px-4 min-w-[180px]">
                  Domain Name
                  <input
                    type="text"
                    placeholder="Filter domain..."
                    value={columnFilters.domain_name}
                    onChange={(e) => setColumnFilters({ ...columnFilters, domain_name: e.target.value })}
                    className="mt-1.5 w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-[11px] text-stone-800 placeholder-stone-400 font-normal focus:outline-none focus:border-emerald-600"
                  />
                </th>
                <th className="py-3 px-4 min-w-[170px]">
                  Client Owner
                  <input
                    type="text"
                    placeholder="Filter client..."
                    value={columnFilters.client_name}
                    onChange={(e) => setColumnFilters({ ...columnFilters, client_name: e.target.value })}
                    className="mt-1.5 w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-[11px] text-stone-800 placeholder-stone-400 font-normal focus:outline-none focus:border-emerald-600"
                  />
                </th>
                <th className="py-3 px-4 min-w-[200px]">
                  {isAdmin ? 'Purchased Registrar & Login Credentials' : 'Purchased Registrar'}
                  <input
                    type="text"
                    placeholder="Filter provider..."
                    value={columnFilters.provider_name}
                    onChange={(e) => setColumnFilters({ ...columnFilters, provider_name: e.target.value })}
                    className="mt-1.5 w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-[11px] text-stone-800 placeholder-stone-400 font-normal focus:outline-none focus:border-emerald-600"
                  />
                </th>
                <th className="py-3 px-4 min-w-[140px]">
                  Expiry Date
                  <input
                    type="text"
                    placeholder="Filter date..."
                    value={columnFilters.expiry_date}
                    onChange={(e) => setColumnFilters({ ...columnFilters, expiry_date: e.target.value })}
                    className="mt-1.5 w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-[11px] text-stone-800 placeholder-stone-400 font-normal focus:outline-none focus:border-emerald-600"
                  />
                </th>
                <th className="py-3 px-4 text-center">Status</th>
                {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {paginatedDomains.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="py-8 text-center text-stone-400 text-xs">
                    No domain records found.
                  </td>
                </tr>
              ) : (
                paginatedDomains.map((domain) => {
                  const expiry = new Date(domain.expiry_date);
                  const now = new Date();
                  const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
                  const isExpired = diffDays < 0;
                  const isExpiring = diffDays >= 0 && diffDays <= 30;
                  const isPassVisible = showPasswordMap[domain.id];

                  return (
                    <tr key={domain.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-emerald-800">
                        #{domain.id}
                      </td>
                      <td className="py-3 px-4 font-bold text-stone-900">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{domain.domain_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-stone-900 font-medium">
                          {domain.client_name ? `${domain.client_name}` : 'Unassigned'}
                        </div>
                        {domain.client_phone && <div className="text-[10px] text-stone-500 font-mono">{domain.client_phone}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="font-bold text-stone-900 flex items-center gap-1.5">
                            <span>{domain.provider_name}</span>
                            {isAdmin && domain.provider_url && (
                              <a
                                href={domain.provider_url.startsWith('http') ? domain.provider_url : `https://${domain.provider_url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-0.5 text-[11px]"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Portal</span>
                              </a>
                            )}
                          </div>
                          {isAdmin && domain.provider_username && (
                            <div className="text-[11px] text-stone-700 font-mono">User: {domain.provider_username}</div>
                          )}
                          {isAdmin && domain.provider_password && (
                            <div className="flex items-center gap-2 font-mono text-[11px] text-stone-600">
                              <span>Pass: {isPassVisible ? domain.provider_password : '••••••••••••'}</span>
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(domain.id)}
                                className="text-stone-400 hover:text-stone-700 p-0.5"
                              >
                                {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-stone-700">
                        {new Date(domain.expiry_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isExpired
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : isExpiring
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}
                        >
                          {isExpired ? `Expired (${Math.abs(diffDays)}d)` : isExpiring ? `${diffDays} days left` : 'Active'}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(domain)}
                              className="p-1.5 rounded-lg bg-stone-100 hover:bg-emerald-700 text-stone-600 hover:text-white transition-all"
                              title="Edit Domain"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenDelete(domain)}
                              className="p-1.5 rounded-lg bg-stone-100 hover:bg-rose-600 text-stone-600 hover:text-white transition-all"
                              title="Delete Domain"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
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
            <span>entries &bull; Total {filteredDomains.length} domains</span>
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

      {/* CREATE / EDIT DOMAIN MODAL */}
      {modalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white border border-stone-200 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <h3 className="font-bold text-base text-stone-900">
                {editingDomain ? `Edit Domain Details (ID #${editingDomain.id})` : 'Add New Domain'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-stone-400 hover:text-stone-700 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 max-h-[75vh] overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <SearchableSelect
                    label="Select Client Owner"
                    required
                    value={formData.client_id}
                    onChange={(val) => setFormData((prev) => ({ ...prev, client_id: val }))}
                    options={clientOptions}
                    placeholder="-- Choose Client --"
                    accentColor="emerald"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                    Domain Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.domain_name}
                    onChange={(e) => setFormData({ ...formData, domain_name: e.target.value })}
                    placeholder="e.g. example.com"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <SearchableSelect
                  label="Provider / Registrar Company"
                  required
                  value={formData.provider_name}
                  onChange={(val) => handleProviderSelect(val)}
                  options={providerOptions}
                  placeholder="-- Select Registrar Company --"
                  accentColor="emerald"
                />

                {/* Registrar Account Credentials */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                    Registrar Portal Login URL
                  </label>
                  <input
                    type="url"
                    value={formData.provider_url}
                    onChange={(e) => setFormData({ ...formData, provider_url: e.target.value })}
                    placeholder="https://www.hosterpk.com"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                    Registrar Account Username
                  </label>
                  <input
                    type="text"
                    value={formData.provider_username}
                    onChange={(e) => setFormData({ ...formData, provider_username: e.target.value })}
                    placeholder="Registrar login username"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                    Registrar Account Password
                  </label>
                  <input
                    type="text"
                    value={formData.provider_password}
                    onChange={(e) => setFormData({ ...formData, provider_password: e.target.value })}
                    placeholder="Registrar login password"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                    Registration Date
                  </label>
                  <input
                    type="date"
                    value={formData.registration_date}
                    onChange={(e) => setFormData({ ...formData, registration_date: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">Notes / Key Details</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional domain notes..."
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
                  {editingDomain ? 'Update Domain' : 'Save Domain'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalOpen && domainToDelete && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white border border-stone-200 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-900">Delete Domain?</h3>
            <p className="text-xs text-stone-600">
              Are you sure you want to delete <span className="text-stone-900 font-bold">{domainToDelete.domain_name}</span> (ID #{domainToDelete.id})?
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
