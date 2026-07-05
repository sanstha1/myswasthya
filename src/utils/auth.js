/**
 * Authentication utilities
 * SECURITY: JWT is in httpOnly cookie; localStorage stores only non-sensitive state.
 */

const AUTH_KEY = 'ms_auth_state';

/**
 * Save minimal auth state (no JWT)
 */
function setAuthState(userData) {
  try {
    const state = {
      userId: userData.userId,
      email: userData.email,
      isMFAEnabled: userData.isMFAEnabled,
      loginTime: Date.now(),
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(state));
  } catch {
    // localStorage may be unavailable
  }
}

function getAuthState() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearAuthState() {
  try {
    localStorage.removeItem(AUTH_KEY);
  } catch {
    // ignore
  }
}

/**
 * Client-side check (real validation is server-side)
 */
function isAuthenticated() {
  const state = getAuthState();
  if (!state) return false;
  // Session valid for 30 days (matches JWT expiry)
  const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; 
  return Date.now() - state.loginTime < SESSION_DURATION;
}

function getCurrentUser() {
  return getAuthState();
}

export { setAuthState, getAuthState, clearAuthState, isAuthenticated, getCurrentUser };
