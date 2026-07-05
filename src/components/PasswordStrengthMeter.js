import React, { useMemo } from 'react';
import zxcvbn from 'zxcvbn';

// Password strength feedback using zxcvbn
const STRENGTH_LABELS = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
const STRENGTH_COLORS = [
  'bg-red-500',
  'bg-orange-500',
  'bg-yellow-500',
  'bg-blue-500',
  'bg-green-500',
];
const STRENGTH_TEXT_COLORS = [
  'text-red-600',
  'text-orange-600',
  'text-yellow-600',
  'text-blue-600',
  'text-green-600',
];

function PasswordStrengthMeter({ password }) {
  const result = useMemo(() => {
    if (!password) return null;
    return zxcvbn(password);
  }, [password]);

  if (!password) return null;

  const score = result?.score ?? 0;
  const warning = result?.feedback?.warning || '';
  const suggestions = result?.feedback?.suggestions || [];
  const crackTime = result?.crack_times_display?.offline_slow_hashing_1e4_per_second || '';

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              i <= score ? STRENGTH_COLORS[score] : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${STRENGTH_TEXT_COLORS[score]}`}>
          {STRENGTH_LABELS[score]}
        </span>
        {crackTime && (
          <span className="text-xs text-gray-400">
            Est. crack time: {crackTime}
          </span>
        )}
      </div>
      {warning && (
        <p className="text-xs text-orange-600">⚠ {warning}</p>
      )}
      {suggestions.length > 0 && (
        <ul className="text-xs text-gray-500 space-y-0.5">
          {suggestions.slice(0, 2).map((s, i) => (
            <li key={i} className="flex items-center gap-1">
              <span className="text-primary-600">→</span> {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PasswordStrengthMeter;
