// PurplezChat - Firebase Authentication & Subscription Client

(function() {
  'use strict';

  const STORAGE_KEY = 'purplez_auth_session';

  function isValidGmail(email) {
    if (!email || typeof email !== 'string') return false;
    const clean = email.trim().toLowerCase();
    const regex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|googlemail\.com)$/i;
    return regex.test(clean);
  }

  function getDeviceId() {
    if (window.AndroidNative && typeof window.AndroidNative.getDeviceId === 'function') {
      try {
        return window.AndroidNative.getDeviceId() || 'web_device';
      } catch (_) {}
    }
    let fallback = localStorage.getItem('purplez_device_id');
    if (!fallback) {
      fallback = 'dev_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('purplez_device_id', fallback);
    }
    return fallback;
  }

  function getStoredSession() {
    // 1. Try Native Android session
    if (window.AndroidNative && typeof window.AndroidNative.getAuthSession === 'function') {
      try {
        const raw = window.AndroidNative.getAuthSession();
        if (raw && raw !== '{}') {
          return JSON.parse(raw);
        }
      } catch (_) {}
    }

    // 2. Try localStorage
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}

    return null;
  }

  function saveStoredSession(session) {
    if (!session) return;
    const jsonStr = JSON.stringify(session);
    try {
      localStorage.setItem(STORAGE_KEY, jsonStr);
    } catch (_) {}

    if (window.AndroidNative && typeof window.AndroidNative.saveAuthSession === 'function') {
      try {
        window.AndroidNative.saveAuthSession(jsonStr);
      } catch (_) {}
    }
  }

  function clearStoredSession() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_) {}

    if (window.AndroidNative && typeof window.AndroidNative.clearAuthSession === 'function') {
      try {
        window.AndroidNative.clearAuthSession();
      } catch (_) {}
    }
  }

  function computeStatusFromSession(session) {
    if (!session || !session.email) {
      return {
        authenticated: false,
        status: 'unauthenticated',
        plan: 'none',
        isAccessAllowed: false,
        badgeText: 'SIGN IN REQUIRED',
        remainingTimeText: 'Locked'
      };
    }

    const now = Date.now();
    let isAccessAllowed = false;
    let badgeText = 'EXPIRED';
    let remainingTimeText = 'Expired';

    if (session.role === 'admin') {
      isAccessAllowed = true;
      badgeText = 'ADMIN';
      remainingTimeText = 'Permanent';
    } else if (session.status === 'suspended') {
      isAccessAllowed = false;
      badgeText = 'SUSPENDED';
      remainingTimeText = 'Locked';
    } else if (session.status === 'pro') {
      isAccessAllowed = true;
      if (session.plan === 'lifetime' || !session.licenseExpiresAt) {
        badgeText = 'PRO (Lifetime)';
        remainingTimeText = 'Lifetime';
      } else {
        const diffMs = Math.max(0, session.licenseExpiresAt - now);
        const days = Math.ceil(diffMs / (24 * 3600 * 1000));
        const hours = Math.ceil(diffMs / (3600 * 1000));
        const planName = session.plan === 'weekly' ? 'Weekly' : 'Monthly';
        badgeText = `PRO (${planName})`;
        remainingTimeText = days > 1 ? `${days}d left` : `${hours}h left`;
        if (diffMs <= 0) {
          isAccessAllowed = false;
          badgeText = 'EXPIRED';
          remainingTimeText = 'Expired';
        }
      }
    } else if (session.status === 'trial') {
      const diffMs = Math.max(0, (session.trialExpiresAt || 0) - now);
      const hours = Math.ceil(diffMs / (3600 * 1000));
      if (hours > 0) {
        isAccessAllowed = true;
        badgeText = 'TRIAL';
        remainingTimeText = `${hours}h left`;
      } else {
        isAccessAllowed = false;
        badgeText = 'EXPIRED';
        remainingTimeText = 'Expired';
      }
    }

    return {
      authenticated: true,
      uid: session.uid,
      email: session.email,
      displayName: session.displayName || session.email.split('@')[0],
      role: session.role || 'user',
      status: isAccessAllowed ? (session.status || 'trial') : 'expired',
      plan: session.plan || 'none',
      isAccessAllowed: isAccessAllowed,
      badgeText: badgeText,
      remainingTimeText: remainingTimeText,
      trialExpiresAt: session.trialExpiresAt,
      licenseExpiresAt: session.licenseExpiresAt
    };
  }

  // Auth Client Interface
  const PurplezAuth = {
    isValidGmail: isValidGmail,
    getDeviceId: getDeviceId,

    getCurrentStatus: function() {
      const session = getStoredSession();
      return computeStatusFromSession(session);
    },

    register: async function(email, password, displayName = '') {
      if (!isValidGmail(email)) {
        throw new Error('Please enter a valid Gmail address (@gmail.com).');
      }
      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }

      const deviceId = getDeviceId();
      const serverUrl = localStorage.getItem('purplez_studio_server') || 'http://127.0.0.1:3333';

      try {
        const res = await fetch(`${serverUrl}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, displayName, deviceId })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Registration failed');

        saveStoredSession(data.user);
        return computeStatusFromSession(data.user);
      } catch (err) {
        // Offline / Standalone Fallback Trial Simulation
        console.warn('[PurplezAuth] Remote register failed, using local offline session:', err.message);
        const now = Date.now();
        const localUser = {
          uid: 'usr_local_' + Math.random().toString(36).substring(2, 8),
          email: email.trim().toLowerCase(),
          displayName: displayName || email.split('@')[0],
          role: 'user',
          status: 'trial',
          plan: 'trial',
          trialHours: 48,
          trialExpiresAt: now + (48 * 3600 * 1000),
          licenseExpiresAt: null,
          boundDeviceId: deviceId,
          createdAt: now
        };
        saveStoredSession(localUser);
        return computeStatusFromSession(localUser);
      }
    },

    login: async function(email, password) {
      if (!isValidGmail(email)) {
        throw new Error('Please enter a valid Gmail address (@gmail.com).');
      }
      if (!password) {
        throw new Error('Please enter your password.');
      }

      const deviceId = getDeviceId();
      const serverUrl = localStorage.getItem('purplez_studio_server') || 'http://127.0.0.1:3333';

      try {
        const res = await fetch(`${serverUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, deviceId })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Login failed');

        saveStoredSession(data.user);
        return computeStatusFromSession(data.user);
      } catch (err) {
        // If local offline session exists with matching email
        const stored = getStoredSession();
        if (stored && stored.email.toLowerCase() === email.trim().toLowerCase()) {
          return computeStatusFromSession(stored);
        }
        throw new Error(err.message || 'Login failed. Please check your credentials or connection.');
      }
    },

    refreshStatus: async function() {
      const stored = getStoredSession();
      if (!stored || !stored.email) {
        return computeStatusFromSession(null);
      }

      const deviceId = getDeviceId();
      const serverUrl = localStorage.getItem('purplez_studio_server') || 'http://127.0.0.1:3333';

      try {
        const res = await fetch(`${serverUrl}/api/auth/status?email=${encodeURIComponent(stored.email)}&deviceId=${encodeURIComponent(deviceId)}`);
        if (res.ok) {
          const remoteStatus = await res.json();
          if (remoteStatus.authenticated) {
            stored.status = remoteStatus.status;
            stored.plan = remoteStatus.plan;
            stored.role = remoteStatus.role;
            stored.trialExpiresAt = remoteStatus.trialExpiresAt;
            stored.licenseExpiresAt = remoteStatus.licenseExpiresAt;
            stored.boundDeviceId = remoteStatus.boundDeviceId;
            saveStoredSession(stored);
          }
        }
      } catch (_) {}

      return computeStatusFromSession(stored);
    },

    logout: function() {
      clearStoredSession();
      return computeStatusFromSession(null);
    }
  };

  window.PurplezAuth = PurplezAuth;
})();
