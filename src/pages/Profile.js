import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import { apiCall } from '../utils/api';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];
const NEPAL_PROVINCES = [
  'Koshi Province', 'Madhesh Province', 'Bagmati Province',
  'Gandaki Province', 'Lumbini Province', 'Karnali Province', 'Sudurpashchim Province',
];

function Profile() {
  // eslint-disable-next-line no-unused-vars
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    fullName: '', phone: '', dateOfBirth: '', bloodGroup: 'Unknown',
    allergies: '', medicalHistory: '',
    emergencyContact: { name: '', phone: '', relationship: '' },
    address: { street: '', city: '', district: '', province: '', postalCode: '' },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const result = await apiCall('GET', '/profile');
      if (result.success && result.data.data) {
        const p = result.data.data;
        setProfile(p);
        setForm({
          fullName: p.fullName || '',
          phone: p.phone || '',
          dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().split('T')[0] : '',
          bloodGroup: p.bloodGroup || 'Unknown',
          allergies: p.allergies || '',
          medicalHistory: p.medicalHistory || '',
          emergencyContact: {
            name: p.emergencyContact?.name || '',
            phone: p.emergencyContact?.phone || '',
            relationship: p.emergencyContact?.relationship || '',
          },
          address: {
            street: p.address?.street || '',
            city: p.address?.city || '',
            district: p.address?.district || '',
            province: p.address?.province || '',
            postalCode: p.address?.postalCode || '',
          },
        });
      }
    } catch {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleNestedChange = (section, field, value) => {
    setForm((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.fullName.trim() || form.fullName.trim().length < 2) {
      setError('Full name must be at least 2 characters');
      return;
    }

    setSaving(true);
    try {
      const result = await apiCall('PUT', '/profile', form);
      if (result.success) {
        setSuccess('Profile updated successfully!');
        setProfile(result.data.data);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3000/api'}/profile/export`,
        { method: 'GET', credentials: 'include' }
      );
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `myswasthya-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      setError('Export failed');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" text="Loading profile..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your personal health information</p>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {exporting ? <LoadingSpinner size="sm" /> : '📥'} Export Data
          </button>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-5 flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <p className="text-sm text-green-700 font-medium">{success}</p>
          </div>
        )}
        <ErrorMessage message={error} onDismiss={() => setError('')} />

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Personal Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-5 flex items-center gap-2">
              👤 Personal Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  maxLength={100}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+977-9800000000"
                  maxLength={20}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={form.dateOfBirth}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Blood Group</label>
                <select
                  name="bloodGroup"
                  value={form.bloodGroup}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-5 flex items-center gap-2">
              🏥 Medical Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Allergies</label>
                <textarea
                  name="allergies"
                  value={form.allergies}
                  onChange={handleChange}
                  placeholder="List any known allergies (medications, food, environmental)..."
                  maxLength={1000}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Medical History</label>
                <textarea
                  name="medicalHistory"
                  value={form.medicalHistory}
                  onChange={handleChange}
                  placeholder="Past surgeries, chronic conditions, significant medical events..."
                  maxLength={5000}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-red-100 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-5 flex items-center gap-2">
              🆘 Emergency Contact
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                <input
                  type="text"
                  value={form.emergencyContact.name}
                  onChange={(e) => handleNestedChange('emergencyContact', 'name', e.target.value)}
                  placeholder="Contact name"
                  maxLength={100}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                <input
                  type="tel"
                  value={form.emergencyContact.phone}
                  onChange={(e) => handleNestedChange('emergencyContact', 'phone', e.target.value)}
                  placeholder="+977-9800000000"
                  maxLength={20}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Relationship</label>
                <input
                  type="text"
                  value={form.emergencyContact.relationship}
                  onChange={(e) => handleNestedChange('emergencyContact', 'relationship', e.target.value)}
                  placeholder="e.g., Spouse, Parent"
                  maxLength={50}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

         
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-5 flex items-center gap-2">
              📍 Address
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Street / Tole</label>
                <input
                  type="text"
                  value={form.address.street}
                  onChange={(e) => handleNestedChange('address', 'street', e.target.value)}
                  placeholder="Street address"
                  maxLength={200}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">City / Municipality</label>
                <input
                  type="text"
                  value={form.address.city}
                  onChange={(e) => handleNestedChange('address', 'city', e.target.value)}
                  placeholder="Kathmandu"
                  maxLength={100}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">District</label>
                <input
                  type="text"
                  value={form.address.district}
                  onChange={(e) => handleNestedChange('address', 'district', e.target.value)}
                  placeholder="Kathmandu"
                  maxLength={100}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Province</label>
                <select
                  value={form.address.province}
                  onChange={(e) => handleNestedChange('address', 'province', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select province</option>
                  {NEPAL_PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Postal Code</label>
                <input
                  type="text"
                  value={form.address.postalCode}
                  onChange={(e) => handleNestedChange('address', 'postalCode', e.target.value)}
                  placeholder="44600"
                  maxLength={20}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 px-6 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <><LoadingSpinner size="sm" color="white" /> Saving...</>
              ) : (
                '💾 Save Changes'
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default Profile;