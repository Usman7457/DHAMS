import React, { useState, useEffect } from 'react';
import api from './api';
import { ToastContainer } from './components/Toast';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { ClientsPage } from './pages/Clients';
import { DomainsPage } from './pages/Domains';
import { HostingsPage } from './pages/Hostings';
import { DomainProvidersPage } from './pages/DomainProviders';
import { HostingProvidersPage } from './pages/HostingProviders';
import { UsersPage } from './pages/Users';

export default function App() {
  // Auth state
  const [token, setToken] = useState(localStorage.getItem('dhams_token') || '');
  const [currentUser, setCurrentUser] = useState(null);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // App navigation
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState({ total_notifications: 0, items: [] });
  const [dismissedNotifications, setDismissedNotifications] = useState(false);

  const handleDismissNotifications = () => {
    setDismissedNotifications(true);
  };

  // Stats state
  const [stats, setStats] = useState({
    total_clients: 0,
    total_domains: 0,
    total_hostings: 0,
    expiring_domains: 0,
    expired_domains: 0,
    expiring_hostings: 0,
    expired_hostings: 0,
    total_alerts: 0,
  });

  // Data states
  const [clients, setClients] = useState([]);
  const [domains, setDomains] = useState([]);
  const [hostings, setHostings] = useState([]);
  const [domainProviders, setDomainProviders] = useState([]);
  const [hostingProviders, setHostingProviders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Toast state
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Verify Auth on mount
  useEffect(() => {
    if (token) {
      fetchUserProfile();
      fetchAllData();
    }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      const res = await api.get('/me');
      setCurrentUser(res.data);
    } catch (err) {
      handleLogout();
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, notifRes, clientsRes, domainsRes, hostingsRes, domProvRes, hostProvRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/notifications/expiring'),
        api.get('/clients'),
        api.get('/domains'),
        api.get('/hostings'),
        api.get('/domain-providers'),
        api.get('/hosting-providers'),
      ]);

      setStats(statsRes.data);
      setNotifications(notifRes.data);
      setClients(clientsRes.data);
      setDomains(domainsRes.data);
      setHostings(hostingsRes.data);
      setDomainProviders(domProvRes.data);
      setHostingProviders(hostProvRes.data);
    } catch (err) {
      console.error('Fetch error:', err);
      addToast('Failed to load system data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (loginForm) => {
    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await api.post('/login', loginForm);
      localStorage.setItem('dhams_token', res.data.token);
      setToken(res.data.token);
      setCurrentUser(res.data.user);
      setDismissedNotifications(false);
      addToast(`Welcome back, ${res.data.user.fullName}!`, 'success');
      setActiveTab('dashboard');
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Login failed. Please check credentials.');
      addToast('Invalid login credentials', 'error');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('dhams_token');
    setToken('');
    setCurrentUser(null);
    setDismissedNotifications(false);
    addToast('Logged out successfully', 'info');
  };

  if (!token) {
    return (
      <Login
        handleLogin={handleLogin}
        loginLoading={loginLoading}
        loginError={loginError}
        toasts={toasts}
        removeToast={removeToast}
      />
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#FDFBF7] text-stone-800 font-sans">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* TOP NAVBAR (FIXED AT TOP) */}
      <Navbar
        currentUser={currentUser}
        notifications={notifications}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        setActiveTab={setActiveTab}
        handleLogout={handleLogout}
        refreshData={fetchAllData}
        dismissedNotifications={dismissedNotifications}
        handleDismissNotifications={handleDismissNotifications}
      />

      {/* BODY CONTENT (SIDEBAR FIXED + MAIN AREA SCROLLS) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* FIXED SIDEBAR */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          currentUser={currentUser}
          clientsCount={clients.length}
          domainsCount={domains.length}
          hostingsCount={hostings.length}
          domainProvidersCount={domainProviders.length}
          hostingProvidersCount={hostingProviders.length}
        />

        {/* SCROLLABLE PAGE MAIN AREA */}
        <main className="flex-1 overflow-y-auto h-full p-4 sm:p-6 lg:p-8 bg-[#FDFBF7]">
          {activeTab === 'dashboard' && (
            <DashboardPage
              stats={stats}
              clients={clients}
              domains={domains}
              hostings={hostings}
              notifications={notifications}
              setActiveTab={setActiveTab}
              refreshData={fetchAllData}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'clients' && (
            <ClientsPage
              clients={clients}
              refreshData={fetchAllData}
              addToast={addToast}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'domains' && (
            <DomainsPage
              domains={domains}
              clients={clients}
              domainProviders={domainProviders}
              refreshData={fetchAllData}
              addToast={addToast}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'domain-providers' && (
            <DomainProvidersPage
              addToast={addToast}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'hostings' && (
            <HostingsPage
              hostings={hostings}
              clients={clients}
              domains={domains}
              hostingProviders={hostingProviders}
              refreshData={fetchAllData}
              addToast={addToast}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'hosting-providers' && (
            <HostingProvidersPage
              addToast={addToast}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'users' && currentUser?.role === 'admin' && (
            <UsersPage
              addToast={addToast}
              clients={clients}
            />
          )}
        </main>
      </div>
    </div>
  );
}
