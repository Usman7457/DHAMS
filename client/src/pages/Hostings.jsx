import React, { useState, useMemo } from 'react';
import {
  Server,
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

export function HostingsPage({ hostings, clients, domains, hostingProviders = [], refreshData, addToast, currentUser }) {
  const isAdmin = currentUser?.role === 'admin';
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingHosting, setEditingHosting] = useState(null);
  const [hostingToDelete, setHostingToDelete] = useState(null);

  // Masked password view state maps
  const [showPanelPassMap, setShowPanelPassMap] = useState({});
  const [showProviderPassMap, setShowProviderPassMap] = useState({});

  const togglePanelPass = (id) => {
    setShowPanelPassMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleProviderPass = (id) => {
    setShowProviderPassMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const [formData, setFormData] = useState({
    client_id: '',
    domain_id: '',
    hosting_provider: '',
    provider_url: '',
    provider_username: '',
    provider_password: '',
    server_ip: '',
    panel_url: '',
    username: '',
    password: '',
    expiry_date: '',
    notes: '',
  });

  // Column search filters
  const [columnFilters, setColumnFilters] = useState({
    id: '',
    domain_name: '',
    hosting_provider: '',
    client_name: '',
    username: '',
    expiry_date: '',
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredHostings = useMemo(() => {
    return hostings.filter((h) => {
      const matchId = columnFilters.id === '' || String(h.id).includes(columnFilters.id);
      const matchDomain = (h.linked_domain_name || '').toLowerCase().includes(columnFilters.domain_name.toLowerCase());
      const matchProvider = (h.hosting_provider || '').toLowerCase().includes(columnFilters.hosting_provider.toLowerCase());
      const matchClient = (h.client_name || '').toLowerCase().includes(columnFilters.client_name.toLowerCase());
      const matchUser = (h.username || '').toLowerCase().includes(columnFilters.username.toLowerCase());
      const matchExpiry = (h.expiry_date || '').includes(columnFilters.expiry_date);
      return matchId && matchDomain && matchProvider && matchClient && matchUser && matchExpiry;
    });
  }, [hostings, columnFilters]);

  const totalPages = Math.ceil(filteredHostings.length / pageSize) || 1;
  const paginatedHostings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredHostings.slice(start, start + pageSize);
  }, [filteredHostings, currentPage, pageSize]);

  const handleOpenAdd = () => {
    setEditingHosting(null);
    const defaultProv = hostingProviders[0]?.name || 'Hostinger Premium';
    const defaultUrl = hostingProviders[0]?.website_url || 'https://hpanel.hostinger.com';
    const initialClientId = clients[0]?.id || '';
    const initialClientDomains = initialClientId
      ? domains.filter((d) => String(d.client_id) === String(initialClientId))
      : domains;

    setFormData({
      client_id: initialClientId,
      domain_id: initialClientDomains[0]?.id || '',
      hosting_provider: defaultProv,
      provider_url: defaultUrl,
      provider_username: '',
      provider_password: '',
      server_ip: '',
      panel_url: 'https://hpanel.hostinger.com',
      username: '',
      password: '',
      expiry_date: '',
      notes: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (hosting) => {
    setEditingHosting(hosting);
    setFormData({
      client_id: hosting.client_id || '',
      domain_id: hosting.domain_id || '',
      hosting_provider: hosting.hosting_provider || '',
      provider_url: hosting.provider_url || '',
      provider_username: hosting.provider_username || '',
      provider_password: hosting.provider_password || '',
      server_ip: hosting.server_ip || '',
      panel_url: hosting.panel_url || '',
      username: hosting.username || '',
      password: hosting.password || '',
      expiry_date: hosting.expiry_date ? hosting.expiry_date.split('T')[0] : '',
      notes: hosting.notes || '',
    });
    setModalOpen(true);
  };

  const handleOpenDelete = (hosting) => {
    setHostingToDelete(hosting);
    setDeleteModalOpen(true);
  };

  const clientOptions = useMemo(() => {
    return clients.map((c) => ({
      value: String(c.id),
      label: `[ID: #${c.id}] ${c.name} (${c.phone})`,
    }));
  }, [clients]);

  // Requirement: Filter domains strictly by selected client_id
  const domainOptions = useMemo(() => {
    const list = [{ value: '', label: '-- Unlinked --' }];
    const clientDomains = formData.client_id
      ? domains.filter((d) => String(d.client_id) === String(formData.client_id))
      : domains;

    clientDomains.forEach((d) => {
      list.push({ value: String(d.id), label: `[ID: #${d.id}] ${d.domain_name}` });
    });
    return list;
  }, [domains, formData.client_id]);

  const providerOptions = useMemo(() => {
    return hostingProviders.map((hp) => ({
      value: hp.name,
      label: hp.name,
    }));
  }, [hostingProviders]);

  const handleClientSelect = (clientId) => {
    const validDomain = domains.find(
      (d) => String(d.id) === String(formData.domain_id) && String(d.client_id) === String(clientId)
    );
    setFormData((prev) => ({
      ...prev,
      client_id: clientId,
      domain_id: validDomain ? prev.domain_id : '',
    }));
  };

  const handleProviderSelect = (selectedName) => {
    const matched = hostingProviders.find((p) => p.name === selectedName);
    setFormData((prev) => ({
      ...prev,
      hosting_provider: selectedName,
      provider_url: matched?.website_url || prev.provider_url,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.domain_id) {
      const dupDom = hostings.some(
        (h) =>
          String(h.domain_id) === String(formData.domain_id) &&
          (!editingHosting || h.id !== editingHosting.id)
      );
      if (dupDom) {
        addToast('A hosting record for this linked domain already exists in the system!', 'error');
        return;
      }
    }
    const dupPanel = hostings.some(
      (h) =>
        (h.panel_url || '').trim().toLowerCase() === (formData.panel_url || '').trim().toLowerCase() &&
        (h.username || '').trim().toLowerCase() === (formData.username || '').trim().toLowerCase() &&
        (!editingHosting || h.id !== editingHosting.id)
    );
    if (dupPanel) {
      addToast(`Hosting account for username "${formData.username.trim()}" already exists on this panel!`, 'error');
      return;
    }

    try {
      if (editingHosting) {
        await api.put(`/hostings/${editingHosting.id}`, formData);
        addToast('Hosting credentials updated!', 'success');
      } else {
        await api.post('/hostings', formData);
        addToast('Hosting record added successfully!', 'success');
      }
      setModalOpen(false);
      refreshData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save hosting', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!hostingToDelete) return;
    try {
      await api.delete(`/hostings/${hostingToDelete.id}`);
      addToast('Hosting record deleted!', 'success');
      setDeleteModalOpen(false);
      refreshData();
    } catch (err) {
      addToast('Failed to delete hosting record', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">Hostings & Platform Credentials</h2>
          <p className="text-xs text-stone-500">Manage hosting provider account logins and server/cPanel credentials</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-md shadow-emerald-700/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Hosting Credentials</span>
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
                <th className="py-3 px-4 min-w-[210px]">
                  Domain & Hosting Provider
                  <div className="space-y-1 mt-1.5">
                    <input
                      type="text"
                      placeholder="Search domain name..."
                      value={columnFilters.domain_name}
                      onChange={(e) => setColumnFilters({ ...columnFilters, domain_name: e.target.value })}
                      className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-[11px] text-stone-800 placeholder-stone-400 font-normal focus:outline-none focus:border-emerald-600"
                    />
                    <input
                      type="text"
                      placeholder="Search provider..."
                      value={columnFilters.hosting_provider}
                      onChange={(e) => setColumnFilters({ ...columnFilters, hosting_provider: e.target.value })}
                      className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-[11px] text-stone-800 placeholder-stone-400 font-normal focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </th>
                <th className="py-3 px-4 min-w-[160px]">
                  Client Owner
                  <input
                    type="text"
                    placeholder="Filter client..."
                    value={columnFilters.client_name}
                    onChange={(e) => setColumnFilters({ ...columnFilters, client_name: e.target.value })}
                    className="mt-1.5 w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-[11px] text-stone-800 placeholder-stone-400 font-normal focus:outline-none focus:border-emerald-600"
                  />
                </th>
                <th className="py-3 px-4 min-w-[220px]">{isAdmin ? 'Server & cPanel Credentials' : 'Server Info'}</th>
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
              {paginatedHostings.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="py-8 text-center text-stone-400 text-xs">
                    No hosting records found.
                  </td>
                </tr>
              ) : (
                paginatedHostings.map((hosting) => {
                  const expiry = new Date(hosting.expiry_date);
                  const now = new Date();
                  const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
                  const isExpired = diffDays < 0;
                  const isExpiring = diffDays >= 0 && diffDays <= 30;
                  const isPanelPassVis = showPanelPassMap[hosting.id];
                  const isProvPassVis = showProviderPassMap[hosting.id];

                  return (
                    <tr key={hosting.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-amber-900">
                        #{hosting.id}
                      </td>
                      <td className="py-3 px-4 text-stone-900">
                        <div className="space-y-1.5">
                          {/* 1. Linked Domain Name at TOP */}
                          {hosting.linked_domain_name ? (
                            <div className="flex items-center gap-1.5 font-bold text-stone-900 text-xs">
                              <Globe className="w-4 h-4 text-emerald-700 shrink-0" />
                              <span>{hosting.linked_domain_name}</span>
                            </div>
                          ) : (
                            <div className="text-stone-400 italic text-[11px]">Unlinked Domain</div>
                          )}

                          {/* 2. Hosting Provider Company BELOW IT */}
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                            <Server className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                            <span>{hosting.hosting_provider}</span>
                          </div>

                          {/* Provider Portal Login (ADMIN ONLY) */}
                          {isAdmin && hosting.provider_url && (
                            <div className="text-[10px] pt-0.5">
                              <a
                                href={hosting.provider_url.startsWith('http') ? hosting.provider_url : `https://${hosting.provider_url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-amber-800 hover:underline inline-flex items-center gap-1 font-bold"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Provider Portal Login</span>
                              </a>
                            </div>
                          )}
                          {isAdmin && hosting.provider_username && (
                            <div className="text-[10px] text-stone-600 font-mono">
                              Acc User: {hosting.provider_username}
                            </div>
                          )}
                          {isAdmin && hosting.provider_password && (
                            <div className="flex items-center gap-1.5 font-mono text-[10px] text-stone-500">
                              <span>Acc Pass: {isProvPassVis ? hosting.provider_password : '••••••••'}</span>
                              <button
                                type="button"
                                onClick={() => toggleProviderPass(hosting.id)}
                                className="text-stone-400 hover:text-stone-700"
                              >
                                {isProvPassVis ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-stone-900 font-medium">
                          {hosting.client_name ? `${hosting.client_name}` : 'Unassigned'}
                        </div>
                        {hosting.client_phone && <div className="text-[10px] text-stone-500 font-mono">{hosting.client_phone}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {isAdmin && hosting.panel_url && (
                            <a
                              href={hosting.panel_url.startsWith('http') ? hosting.panel_url : `https://${hosting.panel_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>cPanel / Control Panel</span>
                            </a>
                          )}
                          {hosting.server_ip && (
                            <div className="text-[10px] text-stone-500 font-mono">IP: {hosting.server_ip}</div>
                          )}
                          {isAdmin && hosting.username && (
                            <div className="text-[11px] text-stone-800 font-mono">User: {hosting.username}</div>
                          )}
                          {isAdmin && hosting.password && (
                            <div className="flex items-center gap-2 font-mono text-[11px] text-stone-600">
                              <span>Pass: {isPanelPassVis ? hosting.password : '••••••••••••'}</span>
                              <button
                                type="button"
                                onClick={() => togglePanelPass(hosting.id)}
                                className="text-stone-400 hover:text-stone-700 p-0.5"
                              >
                                {isPanelPassVis ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          )}
                          {!isAdmin && !hosting.server_ip && (
                            <div className="text-[11px] text-stone-400 font-mono">-</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-stone-700">
                        {new Date(hosting.expiry_date).toLocaleDateString()}
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
                              onClick={() => handleOpenEdit(hosting)}
                              className="p-1.5 rounded-lg bg-stone-100 hover:bg-emerald-700 text-stone-600 hover:text-white transition-all"
                              title="Edit Hosting"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenDelete(hosting)}
                              className="p-1.5 rounded-lg bg-stone-100 hover:bg-rose-600 text-stone-600 hover:text-white transition-all"
                              title="Delete Hosting"
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
            <span>entries &bull; Total {filteredHostings.length} hosting records</span>
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

      {/* CREATE / EDIT HOSTING MODAL (Requirement #4: WIDER MODAL FOR SHORT HEIGHT) */}
      {modalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl bg-white border border-stone-200 rounded-2xl shadow-2xl my-6 overflow-hidden">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <h3 className="font-bold text-base text-stone-900">
                {editingHosting ? `Edit Hosting Credentials (ID #${editingHosting.id})` : 'Add New Hosting Credentials'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-stone-400 hover:text-stone-700 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
              {/* Row 1: Basic Links with SearchableSelect */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SearchableSelect
                  label="Select Client Owner"
                  required
                  value={formData.client_id}
                  onChange={(val) => handleClientSelect(val)}
                  options={clientOptions}
                  placeholder="-- Choose Client --"
                  accentColor="amber"
                />

                <SearchableSelect
                  label="Link Domain (Optional)"
                  value={formData.domain_id}
                  onChange={(val) => setFormData((prev) => ({ ...prev, domain_id: val }))}
                  options={domainOptions}
                  placeholder="-- Unlinked --"
                  accentColor="amber"
                />

                <SearchableSelect
                  label="Hosting Provider Company"
                  required
                  value={formData.hosting_provider}
                  onChange={(val) => handleProviderSelect(val)}
                  options={providerOptions}
                  placeholder="-- Select Provider Company --"
                  accentColor="amber"
                />
              </div>

              {/* Requirement #4: WIDE 2-COLUMN SECTION FOR PROVIDER ACC & SERVER CPANEL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Box 1: Provider Account Details */}
                <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/80 space-y-3">
                  <div className="text-xs font-bold text-amber-900 uppercase tracking-wide border-b border-amber-200 pb-2">
                    1. Provider Account Credentials (Where Purchased)
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 uppercase mb-1">
                      Provider Portal URL
                    </label>
                    <input
                      type="url"
                      value={formData.provider_url}
                      onChange={(e) => setFormData({ ...formData, provider_url: e.target.value })}
                      placeholder="https://hpanel.hostinger.com"
                      className="w-full bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-emerald-600 font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 uppercase mb-1">
                        Account Username
                      </label>
                      <input
                        type="text"
                        value={formData.provider_username}
                        onChange={(e) => setFormData({ ...formData, provider_username: e.target.value })}
                        placeholder="Provider login email"
                        className="w-full bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-emerald-600 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 uppercase mb-1">
                        Account Password
                      </label>
                      <input
                        type="text"
                        value={formData.provider_password}
                        onChange={(e) => setFormData({ ...formData, provider_password: e.target.value })}
                        placeholder="Provider login password"
                        className="w-full bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-emerald-600 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Box 2: cPanel / Server Credentials */}
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200/80 space-y-3">
                  <div className="text-xs font-bold text-emerald-900 uppercase tracking-wide border-b border-emerald-200 pb-2">
                    2. cPanel / Server Login Credentials
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 uppercase mb-1">
                      Panel Login URL *
                    </label>
                    <input
                      type="url"
                      required
                      value={formData.panel_url}
                      onChange={(e) => setFormData({ ...formData, panel_url: e.target.value })}
                      placeholder="https://cpanel.domain.com:2083"
                      className="w-full bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-emerald-600 font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 uppercase mb-1">
                        cPanel Username *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="Panel username"
                        className="w-full bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-emerald-600 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 uppercase mb-1">
                        cPanel Password *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Panel password"
                        className="w-full bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-emerald-600 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Server IP, Expiry Date & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">Server IP</label>
                  <input
                    type="text"
                    value={formData.server_ip}
                    onChange={(e) => setFormData({ ...formData, server_ip: e.target.value })}
                    placeholder="e.g. 185.199.108.1"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-600 font-mono"
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

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">Notes / Instructions</label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes..."
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
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
                  {editingHosting ? 'Update Hosting' : 'Save Hosting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalOpen && hostingToDelete && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white border border-stone-200 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-900">Delete Hosting Credentials?</h3>
            <p className="text-xs text-stone-600">
              Are you sure you want to delete credentials for <span className="text-stone-900 font-bold">{hostingToDelete.hosting_provider}</span> (ID #{hostingToDelete.id})?
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
