import React, { useState } from 'react';
import { apiCall } from '../utils/api';
import LoadingSpinner from './LoadingSpinner';
import ConfirmDialog from './ConfirmDialog';

const RECORD_TYPE_LABELS = {
  lab_report: '🧪 Lab Report',
  prescription: '💊 Prescription',
  scan: '🔬 Scan',
  discharge_summary: '🏥 Discharge Summary',
  vaccination: '💉 Vaccination',
  other: '📄 Other',
};

function MedicalRecordList({ records, onDelete, onUpload }) {
  const [downloading, setDownloading] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [confirmRecord, setConfirmRecord] = useState(null);

  const handleDownload = async (record) => {
    setDownloading(record._id);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3000/api'}/records/${record._id}/download`,
        {
          method: 'GET',
          credentials: 'include',  // SECURITY: Send httpOnly cookie
        }
      );

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = record.metadata?.originalName || record.title;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Download failed: ' + err.message);
    } finally {
      setDownloading(null);
    }
  };

  const handleDeleteClick = (record) => {
    setConfirmRecord(record);
  };

  const handleConfirmDelete = async () => {
    const record = confirmRecord;
    setConfirmRecord(null);
    if (!record) return;

    setDeleting(record._id);
    try {
      const result = await apiCall('DELETE', `/records/${record._id}`);
      if (result.success) {
        onDelete && onDelete(record._id);
      } else {
        alert('Delete failed: ' + result.message);
      }
    } catch (err) {
      alert('Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  if (!records || records.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-4xl mb-2">📋</p>
        <p className="text-sm">No medical records yet</p>
        <button
          onClick={onUpload}
          className="mt-3 text-sm text-primary-600 hover:underline"
        >
          Upload your first record →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {records.map((record) => (
        <div
          key={record._id}
          className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-lg hover:border-gray-200 transition-colors"
        >
          <div className="flex-1 min-w-0 mr-4">
            <p className="text-sm font-medium text-gray-900 truncate">{record.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {RECORD_TYPE_LABELS[record.recordType] || record.recordType} ·{' '}
              {(record.fileSize / 1024).toFixed(1)} KB ·{' '}
              {new Date(record.uploadedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownload(record)}
              disabled={downloading === record._id}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-secondary-600 bg-secondary-50 hover:bg-secondary-100 rounded-lg disabled:opacity-50 transition-colors"
            >
              {downloading === record._id ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>⬇ Download</>
              )}
            </button>
            <button
              onClick={() => handleDeleteClick(record)}
              disabled={deleting === record._id}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg disabled:opacity-50 transition-colors"
            >
              {deleting === record._id ? <LoadingSpinner size="sm" /> : '🗑 Delete'}
            </button>
          </div>
        </div>
      ))}

      <ConfirmDialog
        open={!!confirmRecord}
        title="Delete Record"
        message={confirmRecord ? `Delete "${confirmRecord.title}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmRecord(null)}
      />
    </div>
  );
}

export default MedicalRecordList;