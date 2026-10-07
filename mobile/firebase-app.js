// PurplezChat - Firebase Authentication & Subscription Client

(function() {
  'use strict';

  const STORAGE_KEY = 'purplez_auth_session';

  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyCqLUN6tbb8LQjHiHh2YwtaJeutpZRogAw",
    authDomain: "purplez-chat.firebaseapp.com",
    projectId: "purplez-chat",
    storageBucket: "purplez-chat.firebasestorage.app",
    messagingSenderId: "196719665391",
    appId: "1:196719665391:web:15b19f578e44ba3c37fb1a",
    measurementId: "G-C0B3T5V9GX"
  };

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
      licenseExpiresAt: session.licenseExpiresAt,
      boundDeviceId: session.boundDeviceId || getDeviceId()
    };
  }

  const CLOUD_AUTH_URL = 'https://tikfi.akiwren.site/api/auth.php';

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

      const cleanEmail = email.trim().toLowerCase();
      const deviceId = getDeviceId();
      let firebaseUid = null;
      let idToken = null;

      // 1. Direct Google Firebase Identity Signup
      try {
        const fbUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(FIREBASE_CONFIG.apiKey)}`;
        const fbRes = await fetch(fbUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password: password, returnSecureToken: true })
        });
        const fbData = await fbRes.json();
        if (fbRes.ok && fbData.localId) {
          firebaseUid = fbData.localId;
          idToken = fbData.idToken;

          // Update Firebase profile with device id
          try {
            const updateUrl = `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${encodeURIComponent(FIREBASE_CONFIG.apiKey)}`;
            await fetch(updateUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                idToken: idToken,
                displayName: displayName || cleanEmail.split('@')[0],
                photoUrl: 'device:' + deviceId,
                returnSecureToken: true
              })
            });
          } catch (_) {}
        } else if (fbData.error?.message === 'EMAIL_EXISTS') {
          throw new Error('This Gmail is already registered. Please sign in instead.');
        } else if (fbData.error?.message) {
          console.warn('[PurplezAuth] Firebase signup note:', fbData.error.message);
        }
      } catch (fbErr) {
        if (fbErr.message.includes('already registered')) throw fbErr;
        console.warn('[PurplezAuth] Firebase direct signup skipped:', fbErr.message);
      }

      // 2. Primary Sync with 24/7 Cloud Auth Bridge (https://tikfi.akiwren.site/api/auth.php)
      let syncedUser = null;
      try {
        const cloudRes = await fetch(`${CLOUD_AUTH_URL}?action=register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'register',
            email: cleanEmail,
            displayName: displayName || cleanEmail.split('@')[0],
            deviceId: deviceId,
            firebaseUid: firebaseUid
          })
        });
        if (cloudRes.ok) {
          const cloudData = await cloudRes.json();
          if (cloudData && cloudData.user) {
            syncedUser = cloudData.user;
          }
        }
      } catch (cErr) {
        console.warn('[PurplezAuth] Cloud register sync note:', cErr.message);
      }

      // 3. Optional local studio server sync if custom server configured
      const localServer = localStorage.getItem('purplez_studio_server');
      if (localServer) {
        try {
          const res = await fetch(`${localServer}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail, password, displayName, deviceId, firebaseUid })
          });
          const data = await res.json();
          if (res.ok && data.user && !syncedUser) {
            syncedUser = data.user;
          }
        } catch (_) {}
      }

      if (syncedUser) {
        if (!syncedUser.boundDeviceId) syncedUser.boundDeviceId = deviceId;
        saveStoredSession(syncedUser);
        return computeStatusFromSession(syncedUser);
      }

      // 4. Fallback Local Session
      const now = Date.now();
      const localUser = {
        uid: firebaseUid || ('usr_local_' + Math.random().toString(36).substring(2, 8)),
        email: cleanEmail,
        displayName: displayName || cleanEmail.split('@')[0],
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
    },

    login: async function(email, password) {
      if (!isValidGmail(email)) {
        throw new Error('Please enter a valid Gmail address (@gmail.com).');
      }
      if (!password) {
        throw new Error('Please enter your password.');
      }

      const cleanEmail = email.trim().toLowerCase();
      const deviceId = getDeviceId();
      let firebaseUid = null;
      let idToken = null;

      // 1. Direct Google Firebase Identity Login
      try {
        const fbUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(FIREBASE_CONFIG.apiKey)}`;
        const fbRes = await fetch(fbUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password: password, returnSecureToken: true })
        });
        const fbData = await fbRes.json();
        if (fbRes.ok && fbData.localId) {
          firebaseUid = fbData.localId;
          idToken = fbData.idToken;

          // Update Firebase profile with device id
          try {
            const updateUrl = `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${encodeURIComponent(FIREBASE_CONFIG.apiKey)}`;
            await fetch(updateUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                idToken: idToken,
                photoUrl: 'device:' + deviceId,
                returnSecureToken: true
              })
            });
          } catch (_) {}
        } else if (fbData.error?.message === 'EMAIL_NOT_FOUND') {
          throw new Error('No account found with this Gmail. Please sign up first.');
        } else if (fbData.error?.message === 'INVALID_PASSWORD' || fbData.error?.message === 'INVALID_LOGIN_CREDENTIALS') {
          throw new Error('Incorrect password. Please try again or click Forgot Password.');
        }
      } catch (fbErr) {
        if (fbErr.message.includes('No account found') || fbErr.message.includes('Incorrect password')) {
          throw fbErr;
        }
        console.warn('[PurplezAuth] Firebase direct login fallback:', fbErr.message);
      }

      // 2. Primary Sync with 24/7 Cloud Auth Bridge (https://tikfi.akiwren.site/api/auth.php)
      let syncedUser = null;
      try {
        const cloudRes = await fetch(`${CLOUD_AUTH_URL}?action=login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'login',
            email: cleanEmail,
            deviceId: deviceId,
            firebaseUid: firebaseUid
          })
        });
        if (cloudRes.ok) {
          const cloudData = await cloudRes.json();
          if (cloudData && cloudData.user) {
            syncedUser = cloudData.user;
          }
        }
      } catch (cErr) {
        console.warn('[PurplezAuth] Cloud login sync note:', cErr.message);
      }

      // 3. Optional local studio server sync
      const localServer = localStorage.getItem('purplez_studio_server');
      if (localServer) {
        try {
          const res = await fetch(`${localServer}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail, password, deviceId })
          });
          const data = await res.json();
          if (res.ok && data.user && !syncedUser) {
            syncedUser = data.user;
          }
        } catch (_) {}
      }

      if (syncedUser) {
        if (!syncedUser.boundDeviceId) syncedUser.boundDeviceId = deviceId;
        saveStoredSession(syncedUser);
        return computeStatusFromSession(syncedUser);
      }

      // 4. Fallback to existing stored local session if match
      const stored = getStoredSession();
      if (stored && stored.email.toLowerCase() === cleanEmail) {
        stored.boundDeviceId = deviceId;
        saveStoredSession(stored);
        return computeStatusFromSession(stored);
      }

      // If Firebase login succeeded but local didn't exist yet, create active trial session
      if (firebaseUid) {
        const now = Date.now();
        const authedUser = {
          uid: firebaseUid,
          email: cleanEmail,
          displayName: cleanEmail.split('@')[0],
          role: 'user',
          status: 'trial',
          plan: 'trial',
          trialHours: 48,
          trialExpiresAt: now + (48 * 3600 * 1000),
          licenseExpiresAt: null,
          boundDeviceId: deviceId,
          createdAt: now
        };
        saveStoredSession(authedUser);
        return computeStatusFromSession(authedUser);
      }

      throw new Error('Login failed. Please verify your Gmail and password.');
    },

    sendPasswordReset: async function(email) {
      if (!isValidGmail(email)) {
        throw new Error('Please enter a valid Gmail address (@gmail.com).');
      }

      const cleanEmail = email.trim().toLowerCase();
      const fbUrl = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${encodeURIComponent(FIREBASE_CONFIG.apiKey)}`;

      const res = await fetch(fbUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestType: 'PASSWORD_RESET', email: cleanEmail })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to send password reset email.');
      }

      return {
        success: true,
        email: cleanEmail,
        message: 'Password reset link sent to your Gmail inbox. Please check your email.'
      };
    },

    refreshStatus: async function() {
      const stored = getStoredSession();
      if (!stored || !stored.email) {
        return computeStatusFromSession(null);
      }

      const deviceId = getDeviceId();

      // 1. Try Cloud Auth Bridge first
      try {
        const res = await fetch(`${CLOUD_AUTH_URL}?action=status&email=${encodeURIComponent(stored.email)}&deviceId=${encodeURIComponent(deviceId)}`);
        if (res.ok) {
          const remoteStatus = await res.json();
          if (remoteStatus.authenticated) {
            stored.status = remoteStatus.status;
            stored.plan = remoteStatus.plan;
            stored.role = remoteStatus.role;
            stored.trialExpiresAt = remoteStatus.trialExpiresAt;
            stored.licenseExpiresAt = remoteStatus.licenseExpiresAt;
            stored.boundDeviceId = remoteStatus.boundDeviceId || deviceId;
            saveStoredSession(stored);
            return computeStatusFromSession(stored);
          }
        }
      } catch (_) {}

      // 2. Try Local Studio Server if configured
      const localServer = localStorage.getItem('purplez_studio_server');
      if (localServer) {
        try {
          const res = await fetch(`${localServer}/api/auth/status?email=${encodeURIComponent(stored.email)}&deviceId=${encodeURIComponent(deviceId)}`);
          if (res.ok) {
            const remoteStatus = await res.json();
            if (remoteStatus.authenticated) {
              stored.status = remoteStatus.status;
              stored.plan = remoteStatus.plan;
              stored.role = remoteStatus.role;
              stored.trialExpiresAt = remoteStatus.trialExpiresAt;
              stored.licenseExpiresAt = remoteStatus.licenseExpiresAt;
              stored.boundDeviceId = remoteStatus.boundDeviceId || deviceId;
              saveStoredSession(stored);
              return computeStatusFromSession(stored);
            }
          }
        } catch (_) {}
      }

      return computeStatusFromSession(stored);
    },

    logout: function() {
      clearStoredSession();
      return computeStatusFromSession(null);
    }
  };

  window.PurplezAuth = PurplezAuth;
})();
