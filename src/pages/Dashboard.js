import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import StatsCard from '../components/StatsCard';
import MedicalRecordList from '../components/MedicalRecordList';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import { apiCall } from '../utils/api';
import { getCurrentUser } from '../utils/auth';

function Dashboard() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [profile, setProfile] = useState(null);
  const [records, setRecords] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadModal, setUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    recordType: 'lab_report',
    description: '',
    doctorName: '',
    recordDate: '',
  });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
  loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [profileRes, recordsRes, txRes] = await Promise.all([
        apiCall('GET', '/profile'),
        apiCall('GET', '/records'),
        apiCall('GET', '/transactions'),
      ]);

      if (profileRes.success) setProfile(profileRes.data.data);
      if (recordsRes.success) setRecords(recordsRes.data.data || []);
      if (txRes.success) setTransactions(txRes.data.data || []);
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please select a file');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('title', uploadForm.title);
      formData.append('recordType', uploadForm.recordType);
      formData.append('description', uploadForm.description);
      formData.append('doctorName', uploadForm.doctorName);
      if (uploadForm.recordDate) formData.append('recordDate', uploadForm.recordDate);

      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3000/api'}/records/upload`,
        {
          method: 'POST',
          credentials: 'include',
          body: formData,
        }
      );

      const data = await response.json();

      if (data.success) {
        setRecords((prev) => [data.data, ...prev]);
        setUploadModal(false);
        setUploadForm({ title: '', recordType: 'lab_report', description: '', doctorName: '', recordDate: '' });
        setUploadFile(null);
      } else {
        setUploadError(data.message || 'Upload failed');
      }
    } catch {
      setUploadError('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // SECURITY: Client-side file validation (secondary to server-side checks)
    const allowed = ['application/pdf', 'image/png', 'image/jpeg'];
    if (!allowed.includes(file.type)) {
      setUploadError('Only PDF, PNG, and JPEG files are allowed');
      e.target.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must not exceed 10MB');
      e.target.value = '';
      return;
    }

    setUploadFile(file);
    setUploadError('');
  };

  const handleDeleteRecord = (deletedId) => {
    setRecords((prev) => prev.filter((r) => r._id !== deletedId));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" text="Loading your health dashboard..." />
        </div>
      </div>
    );
  }

  const completedTx = transactions.filter((t) => t.status === 'completed');
  const totalSpent = completedTx.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {profile?.fullName || user?.email?.split('@')[0] || 'User'} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Your health records dashboard ·{' '}
            {new Date().toLocaleDateString('en-NP', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        <ErrorMessage message={error} onDismiss={() => setError('')} />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Blood Group"
            value={profile?.bloodGroup || '—'}
            subtitle="Blood type on file"
            icon="🩸"
            color="red"
          />
          <StatsCard
            title="Medical Records"
            value={records.length}
            subtitle="Files uploaded"
            icon="📋"
            color="primary"
            onClick={() =>
              document.getElementById('records-section')?.scrollIntoView({ behavior: 'smooth' })
            }
          />
          <StatsCard
            title="Transactions"
            value={transactions.length}
            subtitle="Total payments"
            icon="💳"
            color="secondary"
            onClick={() =>
              document.getElementById('tx-section')?.scrollIntoView({ behavior: 'smooth' })
            }
          />
          <StatsCard
            title="Total Spent"
            value={`NPR ${totalSpent.toLocaleString()}`}
            subtitle="All time payments"
            icon="💰"
            color="yellow"
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              📤 Upload Record
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 px-4 py-2 bg-secondary-600 hover:bg-secondary-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              👤 Update Profile
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              ⚙️ Settings
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div id="records-section" className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800">Medical Records</h2>
              <button
                onClick={() => setUploadModal(true)}
                className="text-xs text-primary-600 hover:underline"
              >
                + Upload
              </button>
            </div>
            <MedicalRecordList
              records={records.slice(0, 5)}
              onDelete={handleDeleteRecord}
              onUpload={() => setUploadModal(true)}
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800">Health Summary</h2>
              <button
                onClick={() => navigate('/profile')}
                className="text-xs text-primary-600 hover:underline"
              >
                Edit Profile
              </button>
            </div>
            {profile ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-2xl">👤</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{profile.fullName}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </div>
                {profile.dateOfBirth && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-xs text-gray-500">Date of Birth</span>
                    <span className="text-xs font-medium text-gray-700">
                      {new Date(profile.dateOfBirth).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {profile.bloodGroup && profile.bloodGroup !== 'Unknown' && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-xs text-gray-500">Blood Group</span>
                    <span className="text-xs font-bold text-red-600">{profile.bloodGroup}</span>
                  </div>
                )}
                {profile.phone && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-xs text-gray-500">Phone</span>
                    <span className="text-xs font-medium text-gray-700">{profile.phone}</span>
                  </div>
                )}
                {profile.allergies && (
                  <div className="py-2">
                    <p className="text-xs text-gray-500 mb-1">Allergies</p>
                    <p className="text-xs text-gray-700">{profile.allergies}</p>
                  </div>
                )}
                {profile.emergencyContact?.name && (
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-xs font-medium text-red-700 mb-1">🆘 Emergency Contact</p>
                    <p className="text-xs text-red-600">{profile.emergencyContact.name}</p>
                    <p className="text-xs text-red-500">{profile.emergencyContact.phone}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <p className="text-3xl mb-2">👤</p>
                <p className="text-sm">Complete your profile</p>
                <button
                  onClick={() => navigate('/profile')}
                  className="mt-2 text-xs text-primary-600 hover:underline"
                >
                  Go to Profile →
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {uploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Upload Medical Record</h3>
              <button
                onClick={() => { setUploadModal(false); setUploadError(''); }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-5 space-y-4">
              <ErrorMessage message={uploadError} onDismiss={() => setUploadError('')} />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g., Blood Test Results March 2025"
                  maxLength={200}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Record Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={uploadForm.recordType}
                  onChange={(e) => setUploadForm((p) => ({ ...p, recordType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="lab_report">🧪 Lab Report</option>
                  <option value="prescription">💊 Prescription</option>
                  <option value="scan">🔬 Scan / X-Ray</option>
                  <option value="discharge_summary">🏥 Discharge Summary</option>
                  <option value="vaccination">💉 Vaccination Record</option>
                  <option value="other">📄 Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  File <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.png,.jpg,.jpeg"
                  required
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                <p className="text-xs text-gray-400 mt-1">PDF, PNG, JPEG only · Max 10MB</p>
                {uploadFile && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Doctor Name</label>
                <input
                  type="text"
                  value={uploadForm.doctorName}
                  onChange={(e) => setUploadForm((p) => ({ ...p, doctorName: e.target.value }))}
                  placeholder="Dr. Name"
                  maxLength={100}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Record Date</label>
                <input
                  type="date"
                  value={uploadForm.recordDate}
                  onChange={(e) => setUploadForm((p) => ({ ...p, recordDate: e.target.value }))}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setUploadModal(false); setUploadError(''); }}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <><LoadingSpinner size="sm" color="white" /> Uploading...</>
                  ) : (
                    '📤 Upload'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;