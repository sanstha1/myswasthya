import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiCall } from '../utils/api';
import { setAuthState } from '../utils/auth';
import { useToast } from '../context/ToastContext';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';

function Login() {
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({
    email: '',
    password: '',
    totpCode: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showMFA, setShowMFA] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [locked, setLocked] = useState(false);

  // SECURITY: Allow only 6 numeric digits for MFA code
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'totpCode') {
      setForm((prev) => ({
        ...prev,
        [name]: value.replace(/\D/g, '').slice(0, 6),
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
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

        if (userData.passwordExpired) {
          toast.info('Your password has expired. Please set a new one.');
          navigate('/settings?tab=password&expired=true');
          return;
        }

        setAuthState(userData);
        toast.success('Logged in successfully');
        navigate('/dashboard');
      } else {
        const data = result.data;

        if (result.status === 423) {
          setLocked(true);
          setError(result.message);
          toast.error(result.message);
        } else if (data?.requiresMFA) {
          setShowMFA(true);
          setError('Please enter your 6-digit MFA code');
        } else {
          setError(result.message);
          toast.error(result.message);

          if (data?.failedAttempts) {
            setFailedAttempts(data.failedAttempts);
          }

          if (data?.showCaptcha) {
            setFailedAttempts(data.failedAttempts || 5);
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

          <h1 className="text-2xl font-bold text-gray-900">
            Welcome Back
          </h1>

          <p className="text-gray-500 text-sm mt-1">
            Sign in to MySwasthya
          </p>
        </div>

        {locked ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 text-center">
            <p className="text-2xl mb-2">🔒</p>

            <p className="text-sm font-medium text-red-700">
              Account Temporarily Locked
            </p>

            <p className="text-xs text-red-600 mt-1">
              Too many failed attempts. Please wait 15 minutes before trying
              again.
            </p>
          </div>
        ) : (
          <>
            <ErrorMessage
              message={error}
              onDismiss={() => setError('')}
            />

            {/* SECURITY: Display warning after repeated failed logins */}
            {failedAttempts >= 5 && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-5">
                <p className="text-sm font-medium text-orange-700">
                  ⚠ Suspicious Activity Detected
                </p>

                <p className="text-xs text-orange-600 mt-1">
                  {failedAttempts} failed attempts. Account will be locked
                  after 10 failed attempts.
                </p>

                <div className="mt-3 p-3 bg-white border border-orange-200 rounded-lg text-center">
                  <p className="text-xs text-gray-500">
                    🤖 hCaptcha verification required
                  </p>
                </div>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
              noValidate
            >
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
                  autoComplete="email"
                  required
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
                    autoComplete="current-password"
                    required
                    disabled={loading}
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50"
                  />

                  <button
                    type="button"
                    aria-label="Toggle password visibility"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              {/* SECURITY: MFA code required for users with MFA enabled */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Authenticator Code
                  <span className="text-xs text-gray-400 font-normal ml-2">
                    (if MFA enabled)
                  </span>
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
                    showMFA
                      ? 'border-primary-400 bg-primary-50'
                      : 'border-gray-300'
                  }`}
                />

                {showMFA && (
                  <p className="text-xs text-primary-600 mt-1">
                    Open your authenticator app and enter the 6-digit code.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" color="white" />
                    Signing in...
                  </>
                ) : (
                  'Sign In →'
                )}
              </button>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>

                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-white text-gray-400">
                    or continue with
                  </span>
                </div>
              </div>

              {/* SECURITY: OAuth authentication handled by Google */}
              <a              
                href="http://localhost:3000/api/auth/google"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>

                Continue with Google
              </a>
            </form>
          </>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-primary-600 hover:underline font-medium"
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;