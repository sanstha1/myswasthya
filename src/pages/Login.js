import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiCall } from '../utils/api';
import { setAuthState } from '../utils/auth';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', totpCode: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showMFA, setShowMFA] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [locked, setLocked] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // SECURITY: Sanitize MFA input to digits only
    if (name === 'totpCode') {
      setForm((prev) => ({ ...prev, [name]: value.replace(/\D/g, '').slice(0, 6) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email || !form.password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);
    try {
      const result = await apiCall('POST', '/auth/login', {
        email: form.email,
        password: form.password,
        totpCode: form.totpCode || undefined,
      });

      if (result.success) {
        const userData = result.data.data;

        // SECURITY: Check if password has expired
        if (userData.passwordExpired) {
          navigate('/settings?tab=password&expired=true');
          return;
        }

        setAuthState(userData);
        navigate('/dashboard');
      } else {
        const data = result.data;

        if (result.status === 423) {
          setLocked(true);
          setError(result.message);
        } else if (data?.requiresMFA) {
          setShowMFA(true);
          setError('Please enter your 6-digit MFA code');
        } else {
          setError(result.message);
          if (data?.failedAttempts) {
            setFailedAttempts(data.failedAttempts);
          }
          // SECURITY: Show CAPTCHA warning after 3 failed attempts
          if (data?.showCaptcha) {
            setFailedAttempts(data.failedAttempts || 3);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <img
            src="/image/logo.png"
            alt="MySwasthya logo"
            className="w-16 h-16 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to MySwasthya</p>
        </div>

        {locked && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 text-center">
            <p className="text-2xl mb-2">🔒</p>
            <p className="text-sm font-medium text-red-700">Account Temporarily Locked</p>
            <p className="text-xs text-red-600 mt-1">
              Too many failed attempts. Please wait 15 minutes before trying again.
            </p>
          </div>
        )}

        {!locked && (
          <>
            <ErrorMessage message={error} onDismiss={() => setError('')} />

            {/* SECURITY: CAPTCHA warning shown after 3 failed attempts */}
            {failedAttempts >= 3 && !locked && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-5">
                <p className="text-sm font-medium text-orange-700">⚠ Suspicious Activity Detected</p>
                <p className="text-xs text-orange-600 mt-1">
                  {failedAttempts} failed attempts. Account will be locked after 5 failed attempts.
                  Please verify you are human with hCaptcha.
                </p>
                {/* hCaptcha widget would render here in production */}
                <div className="mt-3 p-3 bg-white border border-orange-200 rounded-lg text-center">
                  <p className="text-xs text-gray-500">🤖 hCaptcha verification required</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Configure REACT_APP_HCAPTCHA_SITE_KEY to enable CAPTCHA
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  maxLength={254}
                  required
                  autoComplete="email"
                  disabled={loading}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Your password"
                    maxLength={128}
                    required
                    autoComplete="current-password"
                    disabled={loading}
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              {/* SECURITY: MFA code input (required when isMFAEnabled) */}
              <div className={showMFA ? 'block' : 'block'}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Authenticator Code
                  <span className="text-xs text-gray-400 font-normal ml-2">(if MFA enabled)</span>
                </label>
                <input
                  type="text"
                  name="totpCode"
                  value={form.totpCode}
                  onChange={handleChange}
                  placeholder="123456"
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  disabled={loading}
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 ${
                    showMFA ? 'border-primary-400 bg-primary-50' : 'border-gray-300'
                  }`}
                />
                {showMFA && (
                  <p className="text-xs text-primary-600 mt-1">
                    Open your authenticator app and enter the 6-digit code
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><LoadingSpinner size="sm" color="white" /> Signing in...</>
                ) : (
                  'Sign In →'
                )}
              </button>
            </form>
          </>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-600 hover:underline font-medium">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;