import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/Toast.jsx';
import { useAuth } from './auth.jsx';
import Sidebar from './components/Sidebar.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Groups from './pages/Groups.jsx';
import GroupDetail from './pages/GroupDetail.jsx';
import CustomerList from './pages/CustomerList.jsx';
import Calendar from './pages/Calendar.jsx';
import Reports from './pages/Reports.jsx';
import Settings from './pages/Settings.jsx';

export default function App() {
  const { user, loading } = useAuth();

  // While restoring session, show a minimal splash (avoid flashing the app).
  if (loading) {
    return (
      <div className="login-wrap">
        <div className="login-logo">🤝</div>
        <p className="login-sub">Memuatkan...</p>
      </div>
    );
  }

  // Not signed in -> login screen only, no app chrome.
  if (!user) {
    return (
      <ToastProvider>
        <Login />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="app">
        <Sidebar />
        <main className="main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/groups/:id" element={<GroupDetail />} />
            <Route path="/customers" element={<CustomerList />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </ToastProvider>
  );
}
