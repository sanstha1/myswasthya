import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import { apiCall } from '../utils/api';
import { clearAuthState } from '../utils/auth';

function Settings() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('password');

  // Password Change State
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });

  // MFA State
  const [mfaStatus, setMfaStatus] = useState({ isMFAEnabled: false, loading: true });
  const [mfaSetup, setMfaSetup] = useState({ qrCode: '', secret: '', backupCodes: [] });
  const [mfaVerifyCode, setMfaVerifyCode] = useState('');
  const [mfaDisablePassword, setMfaDisablePassword] = useState('');
  const [mfaError, setMfaError] = useState('');
  const [mfaSuccess, setMfaSuccess] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [showMfaSetup, setShowMfaSetup] = useState(false);

  
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionError, setSessionError] = useState('');

  
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  useEffect(() => {
    loadMFAStatus();
    loadSessions();
  }, []);

  const loadMFAStatus = async () => {
    setMfaStatus({ isMFAEnabled: false, loading: true });
    try {
      // Get profile to check MFA status
      const result = await apiCall('GET', '/auth/sessions');
      if (result.success) {
        // eslint-disable-next-line no-unused-vars
        const currentSession = result.data.data?.find((s) => s.isCurrent);
        setMfaStatus((prev) => ({ ...prev, loading: false }));
      } else {
        setMfaStatus((prev) => ({ ...prev, loading: false }));
      }
    } catch {
      setMfaStatus((prev) => ({ ...prev, loading: false }));
    }
  };

  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const result = await apiCall('GET', '/auth/sessions');
      if (result.success) {
        setSessions(result.data.data || []);
      }
    } catch {
      setSessionError('Failed to load sessions');
    } finally {
      setSessionsLoading(false);
    }
  };

  // SECURITY: Password change requires current password verification
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (!pwForm.currentPassword) { setPwError('Current password is required'); return; }
    if (pwForm.newPassword.length < 12) { setPwError('New password must be at least 12 characters'); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwError('New passwords do not match'); return; }

    setPwLoading(true);
    try {
      const result = await apiCall('POST', '/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });

      if (result.success) {
        // SECURITY: Server invalidates all sessions after password change
        clearAuthState();
        navigate('/login?message=password-changed');
      } else {
        setPwError(result.message);
      }
    } finally {
      setPwLoading(false);
    }
  };

  // SECURITY: Enable MFA - generates TOTP secret and QR code
  const handleEnableMFA = async () => {
    setMfaLoading(true);
    setMfaError('');
    try {
      const result = await apiCall('POST', '/auth/enable-mfa');
      if (result.success) {
        setMfaSetup({
          qrCode: result.data.data.qrCode,
          secret: result.data.data.totpSecret,
          backupCodes: result.data.data.backupCodes || [],
        });
        setShowMfaSetup(true);
      } else {
        setMfaError(result.message);
      }
    } finally {
      setMfaLoading(false);
    }
  };

  // SECURITY: Verify TOTP code to activate MFA
  const handleVerifyMFA = async () => {
    if (!mfaVerifyCode || mfaVerifyCode.length !== 6) {
      setMfaError('Enter 6-digit code from authenticator app');
      return;
    }

    setMfaLoading(true);
    setMfaError('');
    try {
      const result = await apiCall('POST', '/auth/verify-mfa-setup', { totpCode: mfaVerifyCode });
      if (result.success) {
        setMfaSuccess('MFA enabled successfully!');
        setMfaStatus((prev) => ({ ...prev, isMFAEnabled: true }));
        setShowMfaSetup(false);
        setMfaVerifyCode('');
      } else {
        setMfaError(result.message);
      }
    } finally {
      setMfaLoading(false);
    }
  };

  // SECURITY: Disable MFA requires password re-authentication
  const handleDisableMFA = async () => {
    if (!mfaDisablePassword) {
      setMfaError('Password required to disable MFA');
      return;
    }

    setMfaLoading(true);
    setMfaError('');
    try {
      const result = await apiCall('POST', '/auth/disable-mfa', { password: mfaDisablePassword });
      if (result.success) {
        setMfaSuccess('MFA disabled');
        setMfaStatus((prev) => ({ ...prev, isMFAEnabled: false }));
        setMfaDisablePassword('');
      } else {
        setMfaError(result.message);
      }
    } finally {
      setMfaLoading(false);
    }
  };

  // SECURITY: Logout from all other sessions
  const handleLogoutOtherSessions = async () => {
    try {
      const result = await apiCall('DELETE', '/auth/sessions/others');
      if (result.success) {
        loadSessions();
        setSessionError('');
        alert('All other sessions logged out successfully');
      } else {
        setSessionError(result.message);
      }
    } catch {
      setSessionError('Failed to logout other sessions');
    }
  };

  const tabs = [
    { id: 'password', label: '🔑 Password', icon: '🔑' },
    { id: 'mfa', label: '🔐 MFA', icon: '🔐' },
    { id: 'sessions', label: '📱 Sessions', icon: '📱' },
    { id: 'privacy', label: '🛡 Privacy', icon: '🛡' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Security and account preferences</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

       
        {activeTab === 'password' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-5">Change Password</h2>

            {pwSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-green-700">{pwSuccess}</p>
              </div>
            )}
            <ErrorMessage message={pwError} onDismiss={() => setPwError('')} />

            <form onSubmit={handlePasswordChange} className="space-y-4" noValidate>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Current Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPw.current ? 'text' : 'password'}
                    value={pwForm.currentPassword}
                    onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
                    maxLength={128}
                    required
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button type="button" onClick={() => setShowPw((p) => ({ ...p, current: !p.current }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPw.current ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPw.new ? 'text' : 'password'}
                    value={pwForm.newPassword}
                    onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
                    maxLength={128}
                    required
                    autoComplete="new-password"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button type="button" onClick={() => setShowPw((p) => ({ ...p, new: !p.new }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPw.new ? '🙈' : '👁'}
                  </button>
                </div>
                {/* SECURITY: Real-time password strength for new password */}
                {pwForm.newPassword && <PasswordStrengthMeter password={pwForm.newPassword} />}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPw.confirm ? 'text' : 'password'}
                    value={pwForm.confirmPassword}
                    onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                    maxLength={128}
                    required
                    autoComplete="new-password"
                    className={`w-full px-3 py-2 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword
                        ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  <button type="button" onClick={() => setShowPw((p) => ({ ...p, confirm: !p.confirm }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPw.confirm ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700 font-medium">ℹ Security Notice</p>
                <p className="text-xs text-blue-600 mt-1">
                  Changing your password will log you out of all devices. You will need to login again.
                </p>
              </div>

              <button
                type="submit"
                disabled={pwLoading}
                className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {pwLoading ? <><LoadingSpinner size="sm" color="white" /> Changing...</> : '🔑 Change Password'}
              </button>
            </form>
          </div>
        )}

      
        {activeTab === 'mfa' && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-2">
                Multi-Factor Authentication (TOTP)
              </h2>
              <p className="text-sm text-gray-500 mb-5">
                TOTP MFA adds a second layer of security using a time-based one-time password from an authenticator app.
              </p>

              {mfaSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-green-700">✓ {mfaSuccess}</p>
                </div>
              )}
              <ErrorMessage message={mfaError} onDismiss={() => setMfaError('')} />

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg mb-5">
                <span className={`text-2xl ${mfaStatus.isMFAEnabled ? '🔐' : '🔓'}`} />
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    MFA is {mfaStatus.isMFAEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {mfaStatus.isMFAEnabled
                      ? 'Your account requires a TOTP code at login'
                      : 'Enable MFA to secure your account with an authenticator app'}
                  </p>
                </div>
                <div className="ml-auto">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    mfaStatus.isMFAEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {mfaStatus.isMFAEnabled ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {!mfaStatus.isMFAEnabled && !showMfaSetup && (
                <button
                  onClick={handleEnableMFA}
                  disabled={mfaLoading}
                  className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {mfaLoading ? <LoadingSpinner size="sm" color="white" /> : '🔐'} Enable MFA
                </button>
              )}

             
              {showMfaSetup && (
                <div className="space-y-5">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      Step 1: Scan this QR code with Google Authenticator or Authy
                    </p>
                    {mfaSetup.qrCode && (
                      <div className="flex justify-center">
                        <img src={mfaSetup.qrCode} alt="TOTP QR Code" className="w-40 h-40 border-2 border-primary-200 rounded-xl p-2" />
                      </div>
                    )}
                    {mfaSetup.secret && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Manual entry:</p>
                        <p className="font-mono text-xs text-gray-700 break-all select-all">{mfaSetup.secret}</p>
                      </div>
                    )}
                  </div>

                  {mfaSetup.backupCodes.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-xs font-medium text-yellow-800 mb-2">⚠ Backup Codes (save these now):</p>
                      <div className="grid grid-cols-2 gap-1">
                        {mfaSetup.backupCodes.map((code, i) => (
                          <code key={i} className="text-xs bg-white border border-yellow-200 rounded px-2 py-1 font-mono">
                            {code}
                          </code>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Step 2: Enter the 6-digit code from your app to verify
                    </p>
                    <input
                      type="text"
                      value={mfaVerifyCode}
                      onChange={(e) => setMfaVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      maxLength={6}
                      inputMode="numeric"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => { setShowMfaSetup(false); setMfaVerifyCode(''); }}
                        className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleVerifyMFA}
                        disabled={mfaLoading || mfaVerifyCode.length !== 6}
                        className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {mfaLoading ? <LoadingSpinner size="sm" color="white" /> : '✓ Verify & Enable'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SECURITY: Disable MFA requires password re-authentication */}
              {mfaStatus.isMFAEnabled && (
                <div className="mt-5 border-t border-gray-100 pt-5">
                  <p className="text-sm font-medium text-gray-700 mb-2">Disable MFA</p>
                  <p className="text-xs text-gray-500 mb-3">Enter your password to confirm disabling MFA</p>
                  <input
                    type="password"
                    value={mfaDisablePassword}
                    onChange={(e) => setMfaDisablePassword(e.target.value)}
                    placeholder="Your current password"
                    maxLength={128}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-3"
                  />
                  <button
                    onClick={handleDisableMFA}
                    disabled={mfaLoading || !mfaDisablePassword}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {mfaLoading ? <LoadingSpinner size="sm" color="white" /> : '🔓 Disable MFA'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        
        {activeTab === 'sessions' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-800">Active Sessions</h2>
              <button
                onClick={handleLogoutOtherSessions}
                className="text-xs text-red-600 hover:underline"
              >
                Logout All Others
              </button>
            </div>

            <ErrorMessage message={sessionError} onDismiss={() => setSessionError('')} />

            {sessionsLoading ? (
              <LoadingSpinner size="md" text="Loading sessions..." />
            ) : sessions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No active sessions found</p>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.sessionId}
                    className={`p-4 rounded-lg border ${
                      session.isCurrent
                        ? 'bg-primary-50 border-primary-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800 flex items-center gap-2">
                          📱 {session.isCurrent ? 'Current Session' : 'Other Session'}
                          {session.isCurrent && (
                            <span className="px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded text-xs">
                              This device
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                          {session.userAgent?.slice(0, 60) || 'Unknown device'}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          IP: {session.ipAddress} · Started: {new Date(session.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        
        {activeTab === 'privacy' && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Data & Privacy</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Export All My Data</p>
                    <p className="text-xs text-gray-500 mt-0.5">Download all your health records and profile data</p>
                  </div>
                  <button
                    onClick={async () => {
                      const response = await fetch(
                        `${process.env.REACT_APP_API_URL || 'http://localhost:3000/api'}/profile/export`,
                        { method: 'GET', credentials: 'include' }
                      );
                      if (response.ok) {
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `myswasthya-export-${Date.now()}.json`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                      }
                    }}
                    className="px-4 py-2 bg-secondary-600 hover:bg-secondary-700 text-white rounded-lg text-sm font-medium"
                  >
                    📥 Export
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
                  <div>
                    <p className="text-sm font-medium text-red-800">Delete Account</p>
                    <p className="text-xs text-red-600 mt-0.5">Permanently delete your account and all data</p>
                  </div>
                  <button
                    onClick={() => setDeleteModal(true)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="text-center mb-5">
              <p className="text-4xl mb-3">⚠️</p>
              <h3 className="text-lg font-bold text-gray-900">Delete Account</h3>
              <p className="text-sm text-gray-500 mt-2">
                This action is permanent and cannot be undone. All your health records, profile data, and transaction history will be deleted.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Type <span className="font-mono text-red-600">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-center font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setDeleteModal(false); setDeleteConfirm(''); }}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                disabled={deleteConfirm !== 'DELETE'}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                onClick={() => {
                  alert('Account deletion would be implemented here. Contact support for now.');
                  setDeleteModal(false);
                }}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;