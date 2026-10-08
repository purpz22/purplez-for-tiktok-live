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
    const match = clean.match(/^([a-z0-9.]+)@(gmail\.com|googlemail\.com)$/);
    if (!match) return false;
    const username = match[1];
    if (username.length < 6 || username.length > 30) return false;
    if (username.startsWith('.') || username.endsWith('.') || username.includes('..')) return false;
    // Real Gmail username must have at least one vowel or number
    if (!/[aeiouy0-9]/.test(username) && username.length >= 5) return false;
    // Reject 4+ consecutive identical characters (e.g. aaaaa)
    if (/(.)\1{3,}/.test(username)) return false;
    return true;
  }

  function isDeviceTrialUsed() {
    if (window.AndroidNative && typeof window.AndroidNative.isDeviceTrialUsed === 'function') {
      try {
        return window.AndroidNative.isDeviceTrialUsed();
      } catch (_) {}
    }
    return localStorage.getItem('purplez_device_trial_used') === 'true';
  }

  function markDeviceTrialUsed() {
    try {
      localStorage.setItem('purplez_device_trial_used', 'true');
    } catch (_) {}
    if (window.AndroidNative && typeof window.AndroidNative.markDeviceTrialUsed === 'function') {
      try {
        window.AndroidNative.markDeviceTrialUsed();
      } catch (_) {}
    }
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
    } else if (session.emailVerified === false) {
      isAccessAllowed = false;
      badgeText = 'UNVERIFIED';
      remainingTimeText = 'Verify Email';
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
      const days = Math.ceil(diffMs / (24 * 3600 * 1000));
      if (hours > 0) {
        isAccessAllowed = true;
        badgeText = 'TRIAL';
        remainingTimeText = days > 1 ? `${days}d left` : `${hours}h left`;
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
      status: session.status === 'suspended' ? 'suspended' : ((session.emailVerified === false && session.role !== 'admin') ? 'unverified' : (isAccessAllowed ? (session.status || 'trial') : 'expired')),
      plan: session.plan || 'none',
      isAccessAllowed: isAccessAllowed,
      emailVerified: session.emailVerified !== false,
      badgeText: badgeText,
      remainingTimeText: remainingTimeText,
      trialExpiresAt: session.trialExpiresAt,
      licenseExpiresAt: session.licenseExpiresAt,
      boundDeviceId: session.boundDeviceId || getDeviceId()
    };
  }

  function getCandidateServerUrls() {
    const list = [];
    const saved = (localStorage.getItem('purplez_studio_server') || '').trim().replace(/\/+$/, '');
    if (saved) {
      if (!saved.startsWith('http://') && !saved.startsWith('https://')) {
        list.push('http://' + saved + ':3333');
        list.push('http://' + saved + ':3000');
        list.push('http://' + saved);
      } else {
        list.push(saved);
        if (!saved.includes(':3333') && !saved.includes(':3000')) {
          list.push(saved + ':3333');
          list.push(saved + ':3000');
        }
      }
    }

    // Default primary studio PC IP on local LAN / Wi-Fi
    list.push('http://192.168.254.100:3333');
    list.push('http://192.168.254.100:3000');

    // Android emulator host alias
    list.push('http://10.0.2.2:3333');
    list.push('http://10.0.2.2:3000');

    // Local loopback for dev testing
    list.push('http://127.0.0.1:3333');
    list.push('http://127.0.0.1:3000');
    list.push('http://localhost:3333');
    list.push('http://localhost:3000');

    return [...new Set(list)];
  }

  async function fetchWithServerFallback(endpointPath, options = {}) {
    const saved = (localStorage.getItem('purplez_studio_server') || '').trim().replace(/\/+$/, '');

    // 1. Try saved studio server first with fast 1000ms timeout
    if (saved) {
      try {
        const fullSaved = (saved.startsWith('http://') || saved.startsWith('https://')) ? saved : `http://${saved}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000);
        const res = await fetch(`${fullSaved}${endpointPath}`, {
          ...options,
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          return await res.json();
        }
      } catch (_) {}
    }

    // 2. Fast parallel candidate discovery across LAN candidates
    const candidates = getCandidateServerUrls();
    const probeCandidate = async (base) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);
      try {
        const res = await fetch(`${base}${endpointPath}`, {
          ...options,
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          try {
            localStorage.setItem('purplez_studio_server', base);
          } catch (_) {}
          return data;
        }
      } catch (_) {
        clearTimeout(timeoutId);
      }
      return null;
    };

    try {
      const results = await Promise.all(candidates.map(base => probeCandidate(base)));
      const successful = results.find(r => r !== null);
      if (successful) return successful;
    } catch (_) {}

    return null;
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

      const cleanEmail = email.trim().toLowerCase();
      const deviceId = getDeviceId();
      let firebaseUid = null;
      let idToken = null;
      let refreshToken = null;

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
          refreshToken = fbData.refreshToken;

          // Send verification email to user's real Gmail inbox
          try {
            const oobUrl = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${encodeURIComponent(FIREBASE_CONFIG.apiKey)}`;
            await fetch(oobUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                requestType: 'VERIFY_EMAIL',
                idToken: idToken
              })
            });
          } catch (_) {}

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

      // Mark that this hardware device has created an account
      markDeviceTrialUsed();

      // 2. Sync with Studio Backend
      const studioRes = await fetchWithServerFallback('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password: password,
          displayName: displayName,
          deviceId: deviceId,
          firebaseUid: firebaseUid
        })
      });

      if (studioRes && studioRes.user) {
        if (!studioRes.user.boundDeviceId) studioRes.user.boundDeviceId = deviceId;
        if (idToken) studioRes.user.idToken = idToken;
        if (refreshToken) studioRes.user.refreshToken = refreshToken;
        studioRes.user.emailVerified = (studioRes.user.emailVerified === true);
        saveStoredSession(studioRes.user);
        return computeStatusFromSession(studioRes.user);
      }

      // 3. Fallback Local Session (defaults to unverified until email confirmation)
      const now = Date.now();
      const trialAlreadyUsed = isDeviceTrialUsed();
      const trialDuration = trialAlreadyUsed ? 0 : 48 * 3600 * 1000;
      const localUser = {
        uid: firebaseUid || ('usr_local_' + Math.random().toString(36).substring(2, 8)),
        email: cleanEmail,
        displayName: displayName || cleanEmail.split('@')[0],
        role: 'user',
        status: trialAlreadyUsed ? 'expired' : 'unverified',
        plan: trialAlreadyUsed ? 'none' : 'trial',
        emailVerified: false,
        trialHours: trialAlreadyUsed ? 0 : 48,
        trialExpiresAt: now + trialDuration,
        licenseExpiresAt: null,
        boundDeviceId: deviceId,
        idToken: idToken,
        refreshToken: refreshToken,
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
      let refreshToken = null;
      let isEmailVerified = null;

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
          refreshToken = fbData.refreshToken;

          // Check if email is verified via accounts:lookup
          try {
            const lookupUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(FIREBASE_CONFIG.apiKey)}`;
            const lkRes = await fetch(lookupUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken: idToken })
            });
            if (lkRes.ok) {
              const lkData = await lkRes.json();
              const u = lkData.users?.[0];
              if (u && u.emailVerified !== undefined) {
                isEmailVerified = !!u.emailVerified;
              }
            }
          } catch (_) {}

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

      // 2. Sync with Studio Backend
      const studioRes = await fetchWithServerFallback('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password: password,
          deviceId: deviceId,
          firebaseUid: firebaseUid
        })
      });

      if (studioRes && studioRes.user) {
        if (!studioRes.user.boundDeviceId) studioRes.user.boundDeviceId = deviceId;
        if (idToken) studioRes.user.idToken = idToken;
        if (refreshToken) studioRes.user.refreshToken = refreshToken;
        if (isEmailVerified !== null) studioRes.user.emailVerified = isEmailVerified;
        saveStoredSession(studioRes.user);
        return computeStatusFromSession(studioRes.user);
      }

      // 3. Fallback to existing stored local session if match
      const stored = getStoredSession();
      if (stored && stored.email.toLowerCase() === cleanEmail) {
        stored.boundDeviceId = deviceId;
        if (idToken) stored.idToken = idToken;
        if (refreshToken) stored.refreshToken = refreshToken;
        if (isEmailVerified !== null) stored.emailVerified = isEmailVerified;
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
          idToken: idToken,
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

    resendVerificationEmail: async function() {
      const stored = getStoredSession();
      if (!stored || !stored.email) {
        throw new Error('No active account session found.');
      }
      if (stored.idToken) {
        const fbUrl = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${encodeURIComponent(FIREBASE_CONFIG.apiKey)}`;
        const res = await fetch(fbUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestType: 'VERIFY_EMAIL', idToken: stored.idToken })
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error?.message || 'Failed to send verification email.');
        }
        return {
          success: true,
          email: stored.email,
          message: 'Verification link sent to ' + stored.email + '. Check your inbox and spam folder.'
        };
      }
      throw new Error('Please sign in again to send verification email.');
    },

    refreshStatus: async function() {
      const stored = getStoredSession();
      if (!stored || !stored.email) {
        return computeStatusFromSession(null);
      }

      const deviceId = getDeviceId();

      // 1. Check local Studio server first
      const remoteStatus = await fetchWithServerFallback(`/api/auth/status?email=${encodeURIComponent(stored.email)}&deviceId=${encodeURIComponent(deviceId)}`);
      if (remoteStatus) {
        if (!remoteStatus.authenticated || remoteStatus.status === 'unregistered') {
          clearStoredSession();
          return computeStatusFromSession(null);
        }
        stored.status = remoteStatus.status;
        stored.plan = remoteStatus.plan;
        stored.role = remoteStatus.role;
        stored.trialExpiresAt = remoteStatus.trialExpiresAt;
        stored.licenseExpiresAt = remoteStatus.licenseExpiresAt;
        stored.boundDeviceId = remoteStatus.boundDeviceId || deviceId;
        stored.isAccessAllowed = remoteStatus.isAccessAllowed;
        if (remoteStatus.emailVerified !== undefined) {
          stored.emailVerified = !!remoteStatus.emailVerified;
        }
        saveStoredSession(stored);
        return computeStatusFromSession(stored);
      }

      // 2. Direct Cloud validation fallback via Google Identity Toolkit
      if (stored.idToken) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500);
          const fbRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(FIREBASE_CONFIG.apiKey)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: stored.idToken }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (fbRes.ok) {
            const fbData = await fbRes.json();
            const fbUser = fbData.users?.[0];
            if (!fbUser) {
              clearStoredSession();
              return computeStatusFromSession(null);
            }
            if (fbUser.disabled) {
              stored.status = 'suspended';
              stored.isAccessAllowed = false;
              saveStoredSession(stored);
              return computeStatusFromSession(stored);
            }
            if (fbUser.emailVerified !== undefined) {
              stored.emailVerified = !!fbUser.emailVerified;
            }
          } else {
            const errData = await fbRes.json().catch(() => ({}));
            const errCode = errData?.error?.message;
            if (errCode === 'USER_NOT_FOUND' || errCode === 'TOKEN_EXPIRED') {
              clearStoredSession();
              return computeStatusFromSession(null);
            }
          }
        } catch (_) {}
      }

      // 3. Local clock validation (ensures expired trial/license immediately locks)
      const computed = computeStatusFromSession(stored);
      if (computed.status !== stored.status || computed.isAccessAllowed !== stored.isAccessAllowed) {
        stored.status = computed.status;
        stored.isAccessAllowed = computed.isAccessAllowed;
        saveStoredSession(stored);
      }
      return computed;
    },

    applyRemoteStatus: function(remoteStatus) {
      if (!remoteStatus || remoteStatus.authenticated === false || remoteStatus.status === 'unregistered') {
        clearStoredSession();
        return computeStatusFromSession(null);
      }
      const stored = getStoredSession();
      if (!stored || !stored.email) return computeStatusFromSession(null);
      if (remoteStatus.status !== undefined) stored.status = remoteStatus.status;
      if (remoteStatus.plan !== undefined) stored.plan = remoteStatus.plan;
      if (remoteStatus.role !== undefined) stored.role = remoteStatus.role;
      if (remoteStatus.trialExpiresAt !== undefined) stored.trialExpiresAt = remoteStatus.trialExpiresAt;
      if (remoteStatus.licenseExpiresAt !== undefined) stored.licenseExpiresAt = remoteStatus.licenseExpiresAt;
      if (remoteStatus.boundDeviceId !== undefined) stored.boundDeviceId = remoteStatus.boundDeviceId;
      if (remoteStatus.isAccessAllowed !== undefined) stored.isAccessAllowed = remoteStatus.isAccessAllowed;
      if (remoteStatus.emailVerified !== undefined) stored.emailVerified = !!remoteStatus.emailVerified;
      saveStoredSession(stored);
      return computeStatusFromSession(stored);
    },

    logout: function() {
      clearStoredSession();
      return computeStatusFromSession(null);
    }
  };

  window.PurplezAuth = PurplezAuth;
})();
