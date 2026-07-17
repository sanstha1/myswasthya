import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiCall } from '../utils/api';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import { useToast } from '../context/ToastContext';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';

// SECURITY: Password requirements as per OWASP 2024
const PASSWORD_REQUIREMENTS = [
  { label: 'At least 12 characters', test: (p) => p.length >= 12 },
  { label: 'Uppercase letter (A-Z)', test: (p) => /[A-Z]/.test(p) },
  { label: 'Lowercase letter (a-z)', test: (p) => /[a-z]/.test(p) },
  { label: 'Number (0-9)', test: (p) => /\d/.test(p) },
  { label: 'Special character (!@#$...)', test: (p) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(p) },
];

function Register() {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', fullName: '' });
  const [errors, setErrors] = useState([]);
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [totpSecret, setTotpSecret] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors([]);
    setGeneralError('');
  };

  const validateForm = () => {
    const errs = [];

    if (!form.fullName.trim() || form.fullName.trim().length < 2) {
      errs.push('Full name must be at least 2 characters');
    }

    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) {
      errs.push('Valid email address is required');
    }

    PASSWORD_REQUIREMENTS.forEach((req) => {
      if (!req.test(form.password)) errs.push(req.label + ' is required');
    });

    if (form.password !== form.confirmPassword) {
      errs.push('Passwords do not match');
    }

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setGeneralError('');

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const result = await apiCall('POST', '/auth/register', {
        email: form.email,
        password: form.password,
        fullName: form.fullName,
      });

      if (result.success) {
        setQrCode(result.data.data.qrCode);
        setTotpSecret(result.data.data.totpSecret);
        setRegisteredEmail(form.email);
        toast.success('Account created successfully');
      } else {
        setGeneralError(result.message);
        toast.error(result.message);
        if (result.data?.errors) setErrors(result.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  // SECURITY: Show QR code for MFA enrollment after successful registration
  if (qrCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-green-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
          <div className="text-center mb-6">
            <img
              src="/image/logo_no_background.png"
              alt="MySwasthya logo"
              className="w-16 h-16 mx-auto mb-4"
            />
            <h2 className="text-2xl font-bold text-gray-900">Setup Authenticator</h2>
            <p className="text-gray-500 text-sm mt-2">
              Scan this QR code with Google Authenticator, Authy, or any TOTP app
            </p>
          </div>

          <div className="flex justify-center mb-6">
            <div className="p-4 bg-white border-2 border-primary-200 rounded-xl">
              <img src={qrCode} alt="TOTP QR Code" className="w-48 h-48" />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-xs text-gray-500 mb-1">Manual entry code (if QR fails):</p>
            <p className="font-mono text-sm text-gray-800 break-all select-all">{totpSecret}</p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
            <p className="text-xs text-yellow-700">
              ⚠ Save these backup codes in a safe place. You'll need them if you lose access to your authenticator app.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors"
            >
              Proceed to Login →
            </button>
            <p className="text-center text-xs text-gray-400">
              Account created for {registeredEmail}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full overflow-hidden flex flex-col md:flex-row max-h-[95vh]">
        <div className="w-full md:w-1/2 p-6">
          <div className="text-center mb-4">
            <img
              src="/image/logo.png"
              alt="MySwasthya logo"
              className="w-12 h-12 mx-auto mb-2"
            />
            <h1 className="text-xl font-bold text-gray-900">Create Account</h1>
            <p className="text-gray-500 text-xs mt-0.5">MySwasthya - Secure Health Records</p>
          </div>

          <ErrorMessage
            message={generalError}
            errors={errors}
            onDismiss={() => { setGeneralError(''); setErrors([]); }}
          />

          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Your full name"
                maxLength={100}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  maxLength={128}
                  required
                  autoComplete="new-password"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* SECURITY: Real-time password strength feedback */}
              {form.password && <PasswordStrengthMeter password={form.password} />}

              {/* Password requirements checklist */}
              {form.password && (
                <div className="mt-2 space-y-1">
                  {PASSWORD_REQUIREMENTS.map((req, i) => {
                    const met = req.test(form.password);
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <span className={`text-xs ${met ? 'text-green-600' : 'text-gray-400'}`}>
                          {met ? '✓' : '○'}
                        </span>
                        <span className={`text-xs ${met ? 'text-green-700' : 'text-gray-500'}`}>
                          {req.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                maxLength={128}
                required
                autoComplete="new-password"
                className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition ${
                  form.confirmPassword && form.password !== form.confirmPassword
                    ? 'border-red-300 bg-red-50'
                    : form.confirmPassword && form.password === form.confirmPassword
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300'
                }`}
              />
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <><LoadingSpinner size="sm" color="white" /> Creating Account...</>
              ) : (
                'Create Account →'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>

        <div className="hidden md:flex md:w-1/2 items-center justify-center bg-primary-50 p-6">
          <img
            src="/image/health.png"
            alt="Health illustration"
            className="w-full h-auto max-h-[380px] object-contain"
          />
        </div>
      </div>
    </div>
  );
}

export default Register;