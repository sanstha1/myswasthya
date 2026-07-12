import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { clearAuthState, getCurrentUser } from '../utils/auth';
import { apiCall } from '../utils/api';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from './ConfirmDialog';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const user = getCurrentUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const performLogout = async () => {
    setShowLogoutConfirm(false);
    setLoggingOut(true);
    try {
      // SECURITY: Server-side session invalidation (removes sessionId from DB)
      await apiCall('POST', '/auth/logout');
      toast.success('Logged out successfully');
    } catch {
      toast.info('Logged out');
    } finally {
      // Clear client-side auth state regardless of server response
      clearAuthState();
      navigate('/login');
    }
  };

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/profile', label: 'Profile', icon: '👤' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <img
              src="/image/logo.png"
              alt="MySwasthya logo"
              className="w-8 h-8"
            />
            <span className="text-lg font-bold text-primary-700">MySwasthya</span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-gray-500">Logged in as</p>
              <p className="text-sm font-medium text-gray-700 truncate max-w-32">{user?.email || 'User'}</p>
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              disabled={loggingOut}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loggingOut ? '...' : '🚪 Logout'}
            </button>
          </div>

          <button
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                  isActive(link.path) ? 'bg-primary-50 text-primary-700' : 'text-gray-600'
                }`}
              >
                {link.icon} {link.label}
              </Link>
            ))}
            <button
              onClick={() => {
                setMobileOpen(false);
                setShowLogoutConfirm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 text-red-600 text-sm font-medium w-full"
            >
              🚪 Logout
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        title="Log out?"
        message="Are you sure you want to logout?"
        confirmLabel="Logout"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={performLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </nav>
  );
}

export default Navbar;