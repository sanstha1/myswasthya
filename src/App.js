import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { getAuthState, setAuthState } from './utils/auth';
import { apiCall } from './utils/api';

import Landing from './Landing_page';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

function ProtectedRoute({ children }) {
  const [status, setStatus] = useState('checking'); 

  useEffect(() => {
    const check = async () => {
      const state = getAuthState();
      if (state) {
        setStatus('auth');
        return;
      }

      // SECURITY: No local state - verify httpOnly cookie with backend (handles OAuth redirect)
      const result = await apiCall('GET', '/auth/me');
      if (result.success) {
        setAuthState(result.data.data);
        setStatus('auth');
      } else {
        setStatus('unauth');
      }
    };
    check();
  }, []);

  if (status === 'checking') return null;
  if (status === 'unauth') return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const state = getAuthState();
  if (state) return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

          {/* SECURITY: Protected routes verify JWT cookie server-side before rendering */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;