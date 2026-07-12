import React from 'react';
import { Link } from 'react-router-dom';

function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        <img
          src="/image/logo.png"
          alt="MySwasthya logo"
          className="w-24 h-24 mx-auto mb-6"
        />

        <h1 className="text-3xl font-bold text-gray-900">MySwasthya</h1>
        <p className="text-gray-500 text-sm mt-2 mb-8">
          Your health records, secured and always in your hands.
        </p>

        <div className="space-y-3">
          <Link
            to="/login"
            className="block w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors"
          >
            Sign In →
          </Link>
          <Link
            to="/register"
            className="block w-full py-3 px-4 border border-primary-600 text-primary-600 hover:bg-primary-50 rounded-xl font-medium transition-colors"
          >
            Create Account
          </Link>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Secure personal health records dashboard
        </p>
      </div>
    </div>
  );
}

export default Landing;