// PurplezChat - Streamer Control Center & Floating HUD Logic

(function() {
  'use strict';

  // Mode detection
  const isOverlayMode = window.location.search.includes('mode=overlay');
  if (isOverlayMode) {
    document.body.classList.add('overlay-mode');
  }

  // Application State
  let activeTab = 'regular'; // 'regular' | 'gifter' (Default to All viewers)
  let highlightedMessageId = null;
  let isWindowHidden = false;
  let isLandscape = window.innerWidth > window.innerHeight;
  let totalGiftCoins = 0;
  let hasOverlayPermission = false;
  let isOverlayRunning = false;
  let isSimAtEdge = false;

  // Stream Live Real-Time Data (Starts 100% empty, populated exclusively by real live stream events)
  const gifterChats = [];
  const regularChats = [];
  const sessionGiftList = [];

  // DOM Elements - Views
  const controlCenterView = document.getElementById('controlCenterView');
  const inAppPreviewView = document.getElementById('inAppPreviewView');

  // Control Center Elements
  const deviceOrientationBadge = document.getElementById('deviceOrientationBadge');
  const overlayStatusDot = document.getElementById('overlayStatusDot');
  const overlayStatusText = document.getElementById('overlayStatusText');
  const permStatusBadge = document.getElementById('permStatusBadge');
  const permDescription = document.getElementById('permDescription');
  const grantPermissionBtn = document.getElementById('grantPermissionBtn');
  const mainLaunchOverlayBtn = document.getElementById('mainLaunchOverlayBtn');
  const openPreviewBtn = document.getElementById('openPreviewBtn');
  const closeAppBtn = document.getElementById('closeAppBtn');
  const otaVersionBadge = document.getElementById('otaVersionBadge');
  const otaStatusText = document.getElementById('otaStatusText');
  const otaCheckBtn = document.getElementById('otaCheckBtn');
  const otaReloadBtn = document.getElementById('otaReloadBtn');
  const nativeApkUpdateCard = document.getElementById('nativeApkUpdateCard');
  const nativeApkVersionBadge = document.getElementById('nativeApkVersionBadge');
  const nativeApkNotes = document.getElementById('nativeApkNotes');
  const apkProgressBarContainer = document.getElementById('apkProgressBarContainer');
  const apkProgressBar = document.getElementById('apkProgressBar');
  const downloadApkBtn = document.getElementById('downloadApkBtn');
  const installPermSettingsBtn = document.getElementById('installPermSettingsBtn');
  const toggleOrientationBtn = document.getElementById('toggleOrientationBtn');
  const orientationBtnText = document.getElementById('orientationBtnText');

  // Preview & HUD Elements
  const backToControlCenterBtn = document.getElementById('backToControlCenterBtn');
  const chatContainer = document.getElementById('chatMessagesContainer');
  const tabGifter = document.getElementById('tabGifter');
  const tabRegular = document.getElementById('tabRegular');
  const giftListBtn = document.getElementById('giftListBtn');
  const closeGiftListBtn = document.getElementById('closeGiftListBtn');
  const giftListModal = document.getElementById('giftListModal');
  const giftListEntriesContainer = document.getElementById('giftListEntriesContainer');
  const giftListTotalCount = document.getElementById('giftListTotalCount');
  const gifterCountBadge = document.getElementById('gifterCountBadge');
  const regularCountBadge = document.getElementById('regularCountBadge');
  const transparencySlider = document.getElementById('transparencySlider');
  const transparencyValue = document.getElementById('transparencyValue');
  const floatingWindow = document.getElementById('floatingChatWindow');
  const logoToggleBtn = document.getElementById('logoToggleBtn');
  const settingsToggleBtn = document.getElementById('settingsToggleBtn');
  const settingsDropdown = document.getElementById('settingsDropdown');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const miniDock = document.getElementById('miniDock');
  const miniTickerContent = document.getElementById('miniTickerContent');
  const expandChatFromMiniBtn = document.getElementById('expandChatFromMiniBtn');
  const copyToast = document.getElementById('copyToast');
  const toastMessage = document.getElementById('toastMessage');
  const selectedStatusText = document.getElementById('selectedStatusText');
  const clearHighlightBtn = document.getElementById('clearHighlightBtn');
  const searchViewerToggleBtn = document.getElementById('searchViewerToggleBtn');
  const searchViewerIconPill = document.getElementById('searchViewerIconPill');
  const chatSearchFilterBar = document.getElementById('chatSearchFilterBar');
  const viewerSearchInput = document.getElementById('viewerSearchInput');
  const viewerSearchCountBadge = document.getElementById('viewerSearchCountBadge');
  const closeViewerSearchBtn = document.getElementById('closeViewerSearchBtn');
  let viewerFilterQuery = '';
  const sizeCompactBtn = document.getElementById('sizeCompactBtn');
  const sizeDefaultBtn = document.getElementById('sizeDefaultBtn');
  const sizeLargeBtn = document.getElementById('sizeLargeBtn');
  const serverUrlInput = document.getElementById('serverUrlInput');
  const serverBridgeStatus = document.getElementById('serverBridgeStatus');
  const resetPositionBtn = document.getElementById('resetPositionBtn');
  const streamerUsernameInput = document.getElementById('streamerUsernameInput');
  const saveStreamerUsernameBtn = document.getElementById('saveStreamerUsernameBtn');
  const connectSpinner = document.getElementById('connectSpinner');
  const saveStreamerBtnText = document.getElementById('saveStreamerBtnText');
  const usernameDetailText = document.getElementById('usernameDetailText');
  const currentAccountTag = document.getElementById('currentAccountTag');
  const usernameDot = document.getElementById('usernameDot');
  const usernameStatusText = document.getElementById('usernameStatusText');
  const headerStreamerHandle = document.getElementById('headerStreamerHandle');
  const previewStreamerTag = document.getElementById('previewStreamerTag');
  const footerStreamerTag = document.getElementById('footerStreamerTag');
  const chatDragHeader = document.getElementById('chatDragHeader');
  const chatHeaderBar = document.getElementById('chatHeaderBar');
  const bottomNavBar = document.getElementById('bottomNavBar');
  const cornerResizeHandle = document.getElementById('cornerResizeHandle');
  const autoScrollResumeBtn = document.getElementById('autoScrollResumeBtn');
  const autoScrollResumeText = document.getElementById('autoScrollResumeText');
  const nativeOverlayBtn = document.getElementById('nativeOverlayBtn');
  const landscapeStatus = document.getElementById('landscapeStatus');
  const orientationTag = document.getElementById('orientationTag');
  const giftAlertBanner = document.getElementById('giftAlertBanner');
  const giftAlertText = document.getElementById('giftAlertText');
  const giftAlertCoins = document.getElementById('giftAlertCoins');
  const totalGiftsValue = document.getElementById('totalGiftsValue');

  // Direct Live Streamer State
  let streamerUsername = '';
  let isAutoScrollPaused = false;
  let isUserTouchingChat = false;
  let touchReleaseTimer = null;
  let liveCumulativeLikes = 0;
  let pausedUnreadCount = 0;
  let isConnecting = false;
  let is100PercentConnected = false;
  let inAppStreamPollTimer = null;
  let currentLiveRoomId = null;
  const processedMessageIds = new Set();

  // Initialize View Visibility
  if (isOverlayMode) {
    if (controlCenterView) controlCenterView.classList.add('hidden');
    if (inAppPreviewView) inAppPreviewView.classList.remove('hidden');
  } else {
    if (controlCenterView) controlCenterView.classList.remove('hidden');
    if (inAppPreviewView) inAppPreviewView.classList.add('hidden');
  }

  // ==========================================
  // VIEW NAVIGATION & BACK ACTION
  // ==========================================
  let lastNavTab = 'navViewLive';

  function showControlCenter() {
    if (isOverlayMode) return;
    if (inAppPreviewView) inAppPreviewView.classList.add('hidden');
    if (controlCenterView) controlCenterView.classList.remove('hidden');
    if (typeof switchNavTab === 'function') {
      switchNavTab(lastNavTab || 'navViewSettings');
    }
  }

  function showInAppPreview(fromTab = 'navViewLive') {
    lastNavTab = fromTab;
    if (controlCenterView) controlCenterView.classList.add('hidden');
    if (inAppPreviewView) inAppPreviewView.classList.remove('hidden');
    if (regularChats.length === 0) {
      injectSamplePreviewChats();
    }
    renderChatMessages();
    setWindowPosition(16, 48);
  }

  function injectSamplePreviewChats() {
    window.addChatMessage('AkiStreamer', 'VIEWER', 'stream looks amazing!', false, null, 0);
    window.addChatMessage('TopSupporter', 'VIP', 'Sent Rose x1! (1 Coins)', true, 'Rose', 1);
  }

  if (openPreviewBtn) openPreviewBtn.addEventListener('click', () => showInAppPreview('navViewLive'));
  if (backToControlCenterBtn) backToControlCenterBtn.addEventListener('click', showControlCenter);

  // Close App Action (Force Closes Mobile App)
  if (closeAppBtn) {
    closeAppBtn.addEventListener('click', () => {
      if (window.AndroidNative && window.AndroidNative.forceCloseApp) {
        window.AndroidNative.forceCloseApp();
      } else {
        window.close();
      }
    });
  }

  // ==========================================
  // OVER-THE-AIR (OTA) HOT UPDATES
  // ==========================================
  function updateOtaVersionBadge() {
    if (window.AndroidNative && typeof window.AndroidNative.getOtaVersion === 'function') {
      const ver = window.AndroidNative.getOtaVersion();
      if (otaVersionBadge && ver) {
        otaVersionBadge.textContent = ver;
      }
    }
  }

  updateOtaVersionBadge();

  if (otaCheckBtn) {
    otaCheckBtn.addEventListener('click', () => {
      if (otaStatusText) {
        otaStatusText.textContent = 'CHECKING FOR UPDATES...';
        otaStatusText.className = 'text-white font-bold uppercase';
      }
      otaCheckBtn.disabled = true;
      otaCheckBtn.classList.add('opacity-50');

      if (window.AndroidNative && typeof window.AndroidNative.checkForOtaUpdate === 'function') {
        window.AndroidNative.checkForOtaUpdate();
      } else {
        setTimeout(() => {
          if (otaStatusText) {
            otaStatusText.textContent = 'APP IS UP TO DATE (BROWSER)';
            otaStatusText.className = 'text-zinc-200 font-bold uppercase';
          }
          otaCheckBtn.disabled = false;
          otaCheckBtn.classList.remove('opacity-50');
        }, 600);
      }
    });
  }

  if (otaReloadBtn) {
    otaReloadBtn.addEventListener('click', () => {
      showToast('Reloading HUD...');
      if (window.AndroidNative && typeof window.AndroidNative.reloadApp === 'function') {
        try {
          window.AndroidNative.reloadApp();
        } catch (_) {}
      }
      setTimeout(() => {
        try {
          const base = window.location.href.split('?')[0];
          window.location.replace(`${base}?_r=${Date.now()}`);
        } catch (_) {
          window.location.reload();
        }
      }, 150);
    });
  }

  window.onOtaStatusChanged = function(status, message, isNewVersion) {
    if (otaCheckBtn) {
      otaCheckBtn.disabled = false;
      otaCheckBtn.classList.remove('opacity-50');
    }

    if (otaStatusText) {
      if (status === 'updated') {
        otaStatusText.textContent = 'UPDATE READY - RELOAD TO APPLY';
        otaStatusText.className = 'text-white font-bold uppercase';
        if (otaReloadBtn) {
          otaReloadBtn.classList.add('bg-white', 'text-black', 'border-white');
          otaReloadBtn.classList.remove('bg-zinc-900', 'text-zinc-300');
        }
      } else if (status === 'error') {
        otaStatusText.textContent = 'CHECK FAILED';
        otaStatusText.className = 'text-zinc-400 font-bold uppercase';
      } else if (status === 'up_to_date') {
        otaStatusText.textContent = 'APP IS UP TO DATE';
        otaStatusText.className = 'text-zinc-200 font-bold uppercase';
      } else {
        otaStatusText.textContent = (message || status).toUpperCase();
      }
    }

    updateOtaVersionBadge();
    if (message) {
      showToast(message);
    }
  };

  // ==========================================
  // NATIVE ANDROID APK IN-APP UPDATE SYSTEM
  // ==========================================
  function checkNativeApkUpdateState() {
    if (!window.AndroidNative || typeof window.AndroidNative.getNativeUpdateDetails !== 'function') {
      return;
    }
    try {
      const detailsStr = window.AndroidNative.getNativeUpdateDetails();
      if (!detailsStr) return;
      const details = JSON.parse(detailsStr);

      if (details.available && nativeApkUpdateCard) {
        nativeApkUpdateCard.classList.remove('hidden');
        if (nativeApkVersionBadge) {
          nativeApkVersionBadge.textContent = 'v' + (details.versionName || '1.0.2');
        }
        if (nativeApkNotes) {
          const sizeMb = details.size ? (details.size / (1024 * 1024)).toFixed(1) + ' MB' : '5.4 MB';
          nativeApkNotes.textContent = (details.notes || 'Major native engine update available') + ' (' + sizeMb + ')';
        }
        if (installPermSettingsBtn) {
          if (!details.canInstall) {
            installPermSettingsBtn.classList.remove('hidden');
          } else {
            installPermSettingsBtn.classList.add('hidden');
          }
        }
      } else if (nativeApkUpdateCard) {
        nativeApkUpdateCard.classList.add('hidden');
      }
    } catch (_) {}
  }

  checkNativeApkUpdateState();

  if (downloadApkBtn) {
    downloadApkBtn.addEventListener('click', () => {
      if (window.AndroidNative) {
        if (typeof window.AndroidNative.canRequestPackageInstalls === 'function' && !window.AndroidNative.canRequestPackageInstalls()) {
          if (installPermSettingsBtn) installPermSettingsBtn.classList.remove('hidden');
          if (typeof window.AndroidNative.openInstallPermissionSettings === 'function') {
            window.AndroidNative.openInstallPermissionSettings();
          }
          showToast('Enable "Install unknown apps" to proceed');
          return;
        }

        downloadApkBtn.disabled = true;
        downloadApkBtn.classList.add('opacity-70');
        downloadApkBtn.textContent = 'DOWNLOADING APK (0%)...';
        if (apkProgressBarContainer) apkProgressBarContainer.classList.remove('hidden');
        if (apkProgressBar) apkProgressBar.style.width = '0%';

        if (typeof window.AndroidNative.startApkDownloadAndInstall === 'function') {
          window.AndroidNative.startApkDownloadAndInstall();
        }
      } else {
        showToast('Native APK installer only available in Android app');
      }
    });
  }

  if (installPermSettingsBtn) {
    installPermSettingsBtn.addEventListener('click', () => {
      if (window.AndroidNative && typeof window.AndroidNative.openInstallPermissionSettings === 'function') {
        window.AndroidNative.openInstallPermissionSettings();
      }
    });
  }

  window.onNativeUpdateAvailable = function(versionName, versionCode, sizeBytes, notes) {
    if (nativeApkUpdateCard) {
      nativeApkUpdateCard.classList.remove('hidden');
    }
    if (nativeApkVersionBadge) {
      nativeApkVersionBadge.textContent = 'v' + (versionName || '1.0.2');
    }
    if (nativeApkNotes) {
      const sizeMb = sizeBytes ? (sizeBytes / (1024 * 1024)).toFixed(1) + ' MB' : '5.4 MB';
      nativeApkNotes.textContent = (notes || 'Native Android update available') + ' (' + sizeMb + ')';
    }
    showToast('New native update v' + versionName + ' available');
  };

  window.onApkDownloadProgress = function(status, message, percent) {
    if (apkProgressBarContainer) {
      apkProgressBarContainer.classList.remove('hidden');
    }
    if (apkProgressBar && percent >= 0) {
      apkProgressBar.style.width = percent + '%';
    }

    if (downloadApkBtn) {
      if (status === 'downloading') {
        downloadApkBtn.textContent = 'DOWNLOADING: ' + percent + '%';
        downloadApkBtn.disabled = true;
      } else if (status === 'ready') {
        downloadApkBtn.textContent = 'LAUNCHING INSTALLER...';
        downloadApkBtn.disabled = false;
        downloadApkBtn.classList.remove('opacity-70');
      } else if (status === 'error') {
        downloadApkBtn.textContent = 'RETRY DOWNLOAD & INSTALL';
        downloadApkBtn.disabled = false;
        downloadApkBtn.classList.remove('opacity-70');
      }
    }

    if (message && status === 'error') {
      showToast(message);
    }
  };

  // Gift List Modal Handlers
  function openGiftListModal() {
    if (!giftListModal) return;
    renderGiftListEntries();
    giftListModal.classList.remove('hidden');
  }

  function closeGiftListModal() {
    if (!giftListModal) return;
    giftListModal.classList.add('hidden');
  }

  if (giftListBtn) giftListBtn.addEventListener('click', openGiftListModal);
  if (closeGiftListBtn) closeGiftListBtn.addEventListener('click', closeGiftListModal);

  function renderGiftListEntries() {
    if (!giftListEntriesContainer) return;
    giftListEntriesContainer.innerHTML = '';
    if (giftListTotalCount) {
      giftListTotalCount.textContent = `${sessionGiftList.length} gifts`;
    }

    if (sessionGiftList.length === 0) {
      giftListEntriesContainer.innerHTML = `
        <div class="p-4 text-center text-zinc-500 text-xs font-mono">
          No gifts received yet during this live stream.
        </div>
      `;
      return;
    }

    sessionGiftList.forEach(g => {
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between p-1.5 bg-zinc-950/80 border border-zinc-800 rounded-lg text-xs leading-tight';
      row.innerHTML = `
        <div class="flex items-center space-x-1.5 min-w-0">
          <span class="font-bold text-[10px] text-zinc-300 truncate">${g.user}</span>
          <span class="text-[9.5px] text-white font-mono shrink-0">${g.giftName}${g.count > 1 ? ` x${g.count}` : ''}</span>
        </div>
        <div class="flex items-center space-x-1.5 shrink-0 ml-2">
          <span class="text-[9px] font-mono font-bold text-zinc-400 bg-zinc-900 border border-zinc-800 px-1.5 py-0.2 rounded">${g.coins.toLocaleString()} coins</span>
          <span class="text-[8.5px] font-mono text-zinc-500">${g.time}</span>
        </div>
      `;
      giftListEntriesContainer.appendChild(row);
    });
  }

  window.handleBackAction = function() {
    if (giftListModal && !giftListModal.classList.contains('hidden')) {
      closeGiftListModal();
      return 'handled';
    }
    if (inAppPreviewView && !inAppPreviewView.classList.contains('hidden') && !isOverlayMode) {
      showControlCenter();
      return 'handled';
    }
    return 'unhandled';
  };

  // ==========================================
  // PERMISSION & OVERLAY SERVICE SYNCHRONIZATION
  // ==========================================
  const floatingPermModal = document.getElementById('floatingPermModal');
  const floatingPermSettingsBtn = document.getElementById('floatingPermSettingsBtn');
  const floatingPermLaterBtn = document.getElementById('floatingPermLaterBtn');

  function checkFloatingPermissionOnboarding() {
    if (isOverlayMode) return;
    if (window.AndroidNative && typeof window.AndroidNative.isOverlayPermissionGranted === 'function') {
      hasOverlayPermission = window.AndroidNative.isOverlayPermissionGranted();
    }
    if (!hasOverlayPermission) {
      if (floatingPermModal) floatingPermModal.classList.remove('hidden');
      if (authModal) authModal.classList.add('hidden');
    } else {
      if (floatingPermModal) floatingPermModal.classList.add('hidden');
    }
  }

  window.onOverlayStateUpdated = function(permissionGranted, serviceRunning) {
    hasOverlayPermission = !!permissionGranted;
    isOverlayRunning = !!serviceRunning;
    updateControlCenterUI();
    if (hasOverlayPermission && floatingPermModal) {
      floatingPermModal.classList.add('hidden');
      const auth = window.PurplezAuth ? window.PurplezAuth.getCurrentStatus() : null;
      if ((!auth || !auth.authenticated) && authModal && !isOverlayMode) {
        if (typeof window.applyAuthModeUI === 'function') window.applyAuthModeUI('signup');
        authModal.classList.remove('hidden');
      }
    }
  };

  function updateControlCenterUI() {
    // Permission Badge & Button
    if (permStatusBadge) {
      if (hasOverlayPermission) {
        permStatusBadge.textContent = 'PERMISSION GRANTED';
        permStatusBadge.className = 'text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white text-black';
        if (grantPermissionBtn) grantPermissionBtn.classList.add('hidden');
        if (floatingPermModal) floatingPermModal.classList.add('hidden');
      } else {
        permStatusBadge.textContent = 'PERMISSION NEEDED';
        permStatusBadge.className = 'text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300';
        if (grantPermissionBtn) grantPermissionBtn.classList.remove('hidden');
      }
    }

    // Overlay Running Indicator & Launcher Button
    if (overlayStatusDot && overlayStatusText && mainLaunchOverlayBtn) {
      if (isOverlayRunning) {
        overlayStatusDot.className = 'w-2 h-2 rounded-full bg-white animate-pulse';
        overlayStatusText.textContent = 'ACTIVE & FLOATING';
        overlayStatusText.className = 'text-xs font-mono font-bold uppercase text-white';

        mainLaunchOverlayBtn.textContent = 'CLOSE FLOATING OVERLAY';
        mainLaunchOverlayBtn.className = 'control-btn-secondary py-3 text-sm font-mono tracking-wider font-extrabold w-full text-white bg-zinc-900 border-zinc-700';
      } else {
        overlayStatusDot.className = 'w-2 h-2 rounded-full bg-zinc-600';
        overlayStatusText.textContent = 'INACTIVE';
        overlayStatusText.className = 'text-xs font-mono font-bold uppercase text-zinc-400';

        mainLaunchOverlayBtn.textContent = 'LAUNCH FLOATING OVERLAY';
        mainLaunchOverlayBtn.className = 'control-btn-primary py-3 text-sm font-mono tracking-wider font-extrabold w-full';
      }
    }
  }

  // Initial check from AndroidNative interface
  if (window.AndroidNative) {
    if (window.AndroidNative.isOverlayPermissionGranted) {
      hasOverlayPermission = window.AndroidNative.isOverlayPermissionGranted();
    }
    if (window.AndroidNative.isFloatingOverlayRunning) {
      isOverlayRunning = window.AndroidNative.isFloatingOverlayRunning();
    }
    updateControlCenterUI();
  }

  if (grantPermissionBtn) {
    grantPermissionBtn.addEventListener('click', () => {
      if (window.AndroidNative && window.AndroidNative.requestOverlayPermission) {
        window.AndroidNative.requestOverlayPermission();
      } else {
        showToast('Settings requested');
      }
    });
  }

  if (floatingPermSettingsBtn) {
    floatingPermSettingsBtn.addEventListener('click', () => {
      if (window.AndroidNative && typeof window.AndroidNative.requestOverlayPermission === 'function') {
        window.AndroidNative.requestOverlayPermission();
      } else {
        showToast('Settings requested');
      }
    });
  }

  if (floatingPermLaterBtn) {
    floatingPermLaterBtn.addEventListener('click', () => {
      if (floatingPermModal) floatingPermModal.classList.add('hidden');
      const auth = window.PurplezAuth ? window.PurplezAuth.getCurrentStatus() : null;
      if ((!auth || !auth.authenticated) && authModal && !isOverlayMode) {
        if (typeof window.applyAuthModeUI === 'function') window.applyAuthModeUI('signup');
        authModal.classList.remove('hidden');
      }
    });
  }

  checkFloatingPermissionOnboarding();

  if (mainLaunchOverlayBtn) {
    mainLaunchOverlayBtn.addEventListener('click', () => {
      if (isOverlayRunning) {
        if (window.AndroidNative && window.AndroidNative.stopFloatingOverlay) {
          window.AndroidNative.stopFloatingOverlay();
          isOverlayRunning = false;
          updateControlCenterUI();
        }
      } else {
        const auth = window.PurplezAuth ? window.PurplezAuth.getCurrentStatus() : { isAccessAllowed: true, authenticated: true };
        if (!auth.authenticated) {
          if (authModal) authModal.classList.remove('hidden');
          showToast('Please sign in with your Gmail first');
          return;
        }
        if (!auth.isAccessAllowed) {
          if (paywallModal) paywallModal.classList.remove('hidden');
          showToast('Active subscription or trial required');
          return;
        }

        if (!hasOverlayPermission && window.AndroidNative && window.AndroidNative.isOverlayPermissionGranted) {
          hasOverlayPermission = window.AndroidNative.isOverlayPermissionGranted();
        }
        if (!hasOverlayPermission) {
          if (window.AndroidNative && window.AndroidNative.requestOverlayPermission) {
            window.AndroidNative.requestOverlayPermission();
          }
          showToast('Grant "Display over other apps" permission');
          return;
        }
        if (window.AndroidNative && window.AndroidNative.startFloatingOverlay) {
          window.AndroidNative.startFloatingOverlay();
          isOverlayRunning = true;
          updateControlCenterUI();
        }
      }
    });
  }

  // Orientation Toggle in Control Center
  let isForcedLandscape = false;
  if (toggleOrientationBtn) {
    toggleOrientationBtn.addEventListener('click', () => {
      isForcedLandscape = !isForcedLandscape;
      if (orientationBtnText) {
        orientationBtnText.textContent = isForcedLandscape ? 'AUTO ORIENTATION' : 'FORCE LANDSCAPE';
      }
      if (window.AndroidNative && window.AndroidNative.toggleOrientation) {
        window.AndroidNative.toggleOrientation(isForcedLandscape);
      }
    });
  }

  // ==========================================
  // REAL-TIME TIKTOK LIVE SOCKET.IO BRIDGE
  // ==========================================
  let liveSocket = null;
  let isStudioConnected = false;
  let isTikTokLiveActive = false;
  let studioServerUrl = 'http://192.168.254.100:3000';

  // Load saved studio server URL from storage
  try {
    const savedServer = localStorage.getItem('purplez_studio_server');
    if (savedServer) {
      studioServerUrl = savedServer;
      if (serverUrlInput) serverUrlInput.value = studioServerUrl;
    }
  } catch (_) {}

  function updateBridgeUI(status, labelClass) {
    if (serverBridgeStatus) {
      serverBridgeStatus.textContent = status;
      serverBridgeStatus.className = `text-[9px] font-mono ${labelClass || 'text-zinc-500'}`;
    }
  }

  function connectToStudioServer(targetUrl, autoConnectTikTokUser) {
    const cleanUrl = (targetUrl || studioServerUrl || 'http://192.168.254.100:3000').trim().replace(/\/+$/, '');
    studioServerUrl = cleanUrl;
    try {
      localStorage.setItem('purplez_studio_server', cleanUrl);
    } catch (_) {}

    if (typeof io === 'undefined') {
      console.warn('[Bridge] Socket.IO client library not loaded');
      updateBridgeUI('SOCKET.IO OFFLINE', 'text-zinc-500');
      return;
    }

    if (liveSocket) {
      try {
        liveSocket.removeAllListeners();
        liveSocket.disconnect();
      } catch (_) {}
      liveSocket = null;
    }

    updateBridgeUI('CONNECTING...', 'text-zinc-400');

    try {
      liveSocket = io(cleanUrl, {
        reconnection: true,
        reconnectionAttempts: 25,
        reconnectionDelay: 2000,
        timeout: 6000,
        transports: ['websocket', 'polling']
      });

      liveSocket.on('connect', () => {
        isStudioConnected = true;
        updateBridgeUI('STUDIO CONNECTED', 'text-white font-bold');
        console.log(`[Bridge] Connected to Studio server at ${cleanUrl}`);

        const userToConnect = autoConnectTikTokUser || streamerUsername;
        if (userToConnect) {
          liveSocket.emit('connect_tiktok', { username: userToConnect });
          try {
            fetch(`${cleanUrl}/api/tiktok/connect`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username: userToConnect })
            }).catch(() => {});
          } catch (_) {}
        }
      });

      liveSocket.on('disconnect', () => {
        isStudioConnected = false;
        isTikTokLiveActive = false;
        updateBridgeUI('STUDIO OFFLINE', 'text-zinc-500');
        if (usernameDot) usernameDot.className = 'w-2 h-2 rounded-full bg-zinc-600';
      });

      liveSocket.on('connect_error', () => {
        isStudioConnected = false;
        updateBridgeUI('BRIDGE UNREACHABLE', 'text-zinc-500');
      });

      // Real-time auth state updates pushed directly from studio server
      liveSocket.on('purplez_auth_changed', (data) => {
        if (!data || !window.PurplezAuth) return;
        const current = window.PurplezAuth.getCurrentStatus();
        if (current && current.email && data.email && current.email.toLowerCase() === data.email.toLowerCase()) {
          console.log('[PurplezAuth] Real-time auth update received:', data);
          if (data.type === 'delete' || data.status?.status === 'unregistered' || data.status?.authenticated === false) {
            window.PurplezAuth.logout();
            const reset = window.PurplezAuth.getCurrentStatus();
            updateAuthUI(reset);
            if (window.AndroidNative && typeof window.AndroidNative.stopFloatingOverlay === 'function') {
              window.AndroidNative.stopFloatingOverlay();
            }
            showToast('Account was deleted by administrator');
            return;
          }
          if (data.status) {
            const updated = window.PurplezAuth.applyRemoteStatus(data.status);
            updateAuthUI(updated);
            if (updated.status === 'suspended') {
              showToast('Account suspended by administrator');
            } else if (updated.status === 'unverified') {
              showToast('Email verification required');
            } else if (updated.isAccessAllowed) {
              showToast(`Access updated: ${updated.badgeText} (${updated.remainingTimeText})`);
            }
          } else {
            window.PurplezAuth.refreshStatus().then(updateAuthUI).catch(() => {});
          }
        }
      });

      // Stream status updates from server
      liveSocket.on('tiktok_status', (data) => {
        if (!data) return;
        const currentStreamer = data.username || streamerUsername;
        if (data.connected === true) {
          isTikTokLiveActive = true;
          if (usernameDot) usernameDot.className = 'w-2 h-2 rounded-full bg-white animate-pulse';
          if (usernameStatusText) {
            usernameStatusText.textContent = `LIVE: Connected to @${currentStreamer}`;
            usernameStatusText.className = 'text-white font-bold';
          }
          if (headerStreamerHandle) headerStreamerHandle.textContent = `@${currentStreamer}`;
          if (previewStreamerTag) previewStreamerTag.textContent = `@${currentStreamer}`;
          if (footerStreamerTag) footerStreamerTag.textContent = `@${currentStreamer}`;
        } else if (data.status === 'CONNECTING') {
          if (usernameDot) usernameDot.className = 'w-2 h-2 rounded-full bg-zinc-400 animate-ping';
          if (usernameStatusText) {
            usernameStatusText.textContent = `Connecting to TikTok stream @${currentStreamer}...`;
          }
        } else if (data.status === 'WAITING_FOR_LIVE') {
          isTikTokLiveActive = false;
          if (usernameDot) usernameDot.className = 'w-2 h-2 rounded-full bg-zinc-500';
          if (usernameStatusText) {
            usernameStatusText.textContent = `@${currentStreamer} is offline. Auto-pinging for live...`;
          }
        } else {
          isTikTokLiveActive = false;
          if (usernameDot) usernameDot.className = 'w-2 h-2 rounded-full bg-zinc-600';
          if (usernameStatusText) {
            usernameStatusText.textContent = `Studio ready. Tap CONNECT to join @${streamerUsername || 'stream'}`;
          }
        }
      });

      // Real live chat message listener
      liveSocket.on('tiktok_chat_overlay', (data) => {
        handleIncomingRealChat(data);
      });

      liveSocket.on('tiktok_chat', (data) => {
        handleIncomingRealChat(data);
      });

      // Real live gift listener
      liveSocket.on('tiktok_gift', (data) => {
        handleIncomingRealGift(data);
      });

      // Real live like listener
      liveSocket.on('tiktok_like', (data) => {
        if (!data) return;
        const total = typeof data.totalLikeCount === 'number' ? data.totalLikeCount : (typeof data.totalLikes === 'number' ? data.totalLikes : 0);
        const count = typeof data.likeCount === 'number' ? data.likeCount : (typeof data.count === 'number' ? data.count : 1);
        if (typeof window.updateLiveLikeCount === 'function') {
          window.updateLiveLikeCount(total, count);
        }
      });

      // Real live follower listener
      liveSocket.on('tiktok_follow', (data) => {
        handleIncomingRealFollow(data);
      });

      // Real live member events with follow action
      liveSocket.on('tiktok_member', (data) => {
        if (!data) return;
        const isFollowDisplay = typeof data.displayType === 'string' && data.displayType.toLowerCase().includes('follow');
        if (data.action === 3 || data.displayType === 'follow' || isFollowDisplay || data.action === 'follow' || data.isFollower) {
          handleIncomingRealFollow(data);
        }
      });

    } catch (err) {
      console.error('[Bridge] Failed to initialize socket connection:', err);
      updateBridgeUI('ERROR', 'text-zinc-500');
    }
  }

  function handleIncomingRealFollow(data) {
    if (!data) return;
    const user = data.nickname || data.uniqueId || data.user || 'Viewer';
    const cleanUser = String(user).trim().replace(/^@+/, '');
    const avatarUrl = data.profilePictureUrl || data.avatarUrl || data.avatar || '';
    triggerFollowAlert(cleanUser, data.nickname || cleanUser, avatarUrl);
  }

  function handleIncomingRealChat(data) {
    if (!data) return;
    const user = data.nickname || data.uniqueId || data.user || 'Viewer';
    const text = data.comment || data.text || '';
    if (!text && !data.gift) return;

    const isGifter = !!(data.isGifter || (data.diamonds && data.diamonds > 0) || data.gift || data.isSpecial);
    const roleLabel = data.roleLabel || (data.role ? data.role.toUpperCase() : (isGifter ? 'GIFTER' : 'VIEWER'));
    const giftName = data.gift?.name || (typeof data.gift === 'string' ? data.gift : null);
    const coins = parseInt(data.diamonds || data.coins || 0, 10) || 0;

    window.addChatMessage(user, roleLabel, text, isGifter, giftName, coins);
  }

  function handleIncomingRealGift(data) {
    if (!data) return;
    const user = data.nickname || data.uniqueId || 'Supporter';
    const giftName = data.giftName || data.gift?.name || 'Gift';
    const count = parseInt(data.repeatCount || 1, 10) || 1;
    const diamondPerUnit = parseInt(data.diamondCount || data.diamonds || 1, 10) || 1;
    const totalCoins = diamondPerUnit * count;
    const badge = `LVL ${data.userLevel || 'VIP'}`;
    const text = `Sent ${giftName}${count > 1 ? ` x${count}` : ''}!`;

    window.addChatMessage(user, badge, text, true, `${giftName}${count > 1 ? ` x${count}` : ''} (${totalCoins.toLocaleString()} Coins)`, totalCoins);
  }

  function applyStreamerUsername(user, shouldSave = true) {
    const clean = (user || '').trim().replace(/^@+/, '');
    streamerUsername = clean;
    const displayTag = clean ? `@${clean}` : 'NOT SET';
    const activeTag = clean ? `@${clean}` : '@live';

    if (streamerUsernameInput) streamerUsernameInput.value = clean;
    if (currentAccountTag) {
      currentAccountTag.textContent = displayTag;
      if (clean) {
        currentAccountTag.className = 'text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white text-black';
      } else {
        currentAccountTag.className = 'text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300';
      }
    }
    if (headerStreamerHandle) headerStreamerHandle.textContent = activeTag;
    if (previewStreamerTag) previewStreamerTag.textContent = activeTag;
    if (footerStreamerTag) footerStreamerTag.textContent = activeTag;

    if (shouldSave) {
      if (window.AndroidNative && window.AndroidNative.saveStreamerUsername) {
        try {
          window.AndroidNative.saveStreamerUsername(clean);
        } catch (_) {}
      }
      try {
        localStorage.setItem('purplez_streamer_username', clean);
      } catch (_) {}
    }
  }

  function setConnectionState(state, detailMsg) {
    isConnecting = false;
    if (connectSpinner) connectSpinner.classList.add('hidden');
    if (saveStreamerUsernameBtn) saveStreamerUsernameBtn.disabled = false;

    if (state === 'CONNECTED') {
      is100PercentConnected = true;
      if (usernameDot) usernameDot.className = 'w-2 h-2 rounded-full bg-emerald-400';
      if (usernameStatusText) {
        usernameStatusText.textContent = '100% CONNECTED (LIVE)';
        usernameStatusText.className = 'font-bold text-white';
      }
      if (usernameDetailText) usernameDetailText.textContent = detailMsg || `Live with @${streamerUsername}`;
      if (saveStreamerBtnText) saveStreamerBtnText.textContent = 'DISCONNECT';
      if (currentAccountTag) {
        currentAccountTag.textContent = `@${streamerUsername}`;
        currentAccountTag.className = 'text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white text-black';
      }
      if (headerStreamerHandle) headerStreamerHandle.textContent = `@${streamerUsername}`;
      if (previewStreamerTag) previewStreamerTag.textContent = `@${streamerUsername}`;
      if (footerStreamerTag) footerStreamerTag.textContent = `@${streamerUsername}`;
    } else if (state === 'OFFLINE') {
      is100PercentConnected = false;
      if (usernameDot) usernameDot.className = 'w-2 h-2 rounded-full bg-zinc-500';
      if (usernameStatusText) {
        usernameStatusText.textContent = 'STREAMER IS OFFLINE';
        usernameStatusText.className = 'font-bold text-zinc-400';
      }
      if (usernameDetailText) usernameDetailText.textContent = detailMsg;
      if (saveStreamerBtnText) saveStreamerBtnText.textContent = 'CONNECT TO TIKTOK LIVE';
      showToast(`@${streamerUsername} is not live right now`);
    } else {
      is100PercentConnected = false;
      if (usernameDot) usernameDot.className = 'w-2 h-2 rounded-full bg-red-500';
      if (usernameStatusText) {
        usernameStatusText.textContent = 'CONNECTION FAILED';
        usernameStatusText.className = 'font-bold text-zinc-400';
      }
      if (usernameDetailText) usernameDetailText.textContent = detailMsg;
      if (saveStreamerBtnText) saveStreamerBtnText.textContent = 'CONNECT TO TIKTOK LIVE';
      showToast(detailMsg || 'Failed to connect to TikTok');
    }
  }

  // Streamer TikTok Profile Picture (Avatar) Updater
  let streamerAvatarUrl = '';

  window.updateStreamerAvatar = function(url) {
    if (!url) return;
    streamerAvatarUrl = url;
    try {
      localStorage.setItem('purplez_streamer_avatar', url);
    } catch (_) {}

    // Update Floating HUD Logo Button
    if (logoToggleBtn) {
      logoToggleBtn.innerHTML = `
        <span class="absolute -top-1 -right-1 flex h-2.5 w-2.5 z-10">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
        </span>
        <img src="${url}" class="w-full h-full object-cover rounded-xl" style="width: 100%; height: 100%; max-width: 36px; max-height: 36px; object-fit: cover;" alt="Streamer" onerror="this.onerror=null; this.src='';" />
      `;
    }

    // Update Control Center App Header Logo
    const headerLogo = document.getElementById('appHeaderLogo');
    if (headerLogo) {
      headerLogo.innerHTML = `
        <img src="${url}" class="w-full h-full object-cover rounded-xl" style="width: 100%; height: 100%; max-width: 44px; max-height: 44px; object-fit: cover;" alt="Streamer" onerror="this.onerror=null; this.src='';" />
      `;
    }
  };

  // Status Listener invoked from Android native TikTokLiveManager
  window.onTikTokLiveStatusChanged = function(status, detail, roomId) {
    if (status === 'CONNECTED') {
      currentLiveRoomId = roomId;
      setConnectionState('CONNECTED', detail);
      showToast(`100% Connected to @${streamerUsername} live stream!`);
    } else if (status === 'OFFLINE') {
      setConnectionState('OFFLINE', detail);
    } else if (status === 'ERROR') {
      setConnectionState('ERROR', detail);
    } else if (status === 'CONNECTING') {
      isConnecting = true;
      if (connectSpinner) connectSpinner.classList.remove('hidden');
      if (saveStreamerBtnText) saveStreamerBtnText.textContent = 'CONNECTING...';
      if (saveStreamerUsernameBtn) saveStreamerUsernameBtn.disabled = true;
      if (usernameDot) usernameDot.className = 'w-2 h-2 rounded-full bg-yellow-400 animate-pulse';
      if (usernameStatusText) {
        usernameStatusText.textContent = 'CONNECTING TO TIKTOK LIVE...';
        usernameStatusText.className = 'font-bold text-zinc-300';
      }
      if (usernameDetailText) usernameDetailText.textContent = detail;
    } else if (status === 'DISCONNECTED') {
      isConnecting = false;
      is100PercentConnected = false;
      liveCumulativeLikes = 0;
      const overlayLiveLikeCount = document.getElementById('overlayLiveLikeCount');
      if (overlayLiveLikeCount) overlayLiveLikeCount.textContent = '0';
      const previewLikeCount = document.getElementById('previewLikeCount');
      if (previewLikeCount) previewLikeCount.textContent = '0 likes';
      if (connectSpinner) connectSpinner.classList.add('hidden');
      if (saveStreamerUsernameBtn) saveStreamerUsernameBtn.disabled = false;
      if (usernameDot) usernameDot.className = 'w-2 h-2 rounded-full bg-zinc-600';
      if (usernameStatusText) {
        usernameStatusText.textContent = 'NOT CONNECTED';
        usernameStatusText.className = 'font-bold text-zinc-300';
      }
      if (usernameDetailText) usernameDetailText.textContent = detail || 'Disconnected from TikTok Live.';
      if (saveStreamerBtnText) saveStreamerBtnText.textContent = 'CONNECT TO TIKTOK LIVE';
    }
  };

  function disconnectTikTokLive() {
    isConnecting = false;
    is100PercentConnected = false;
    liveCumulativeLikes = 0;
    const overlayLiveLikeCount = document.getElementById('overlayLiveLikeCount');
    if (overlayLiveLikeCount) overlayLiveLikeCount.textContent = '0';
    const previewLikeCount = document.getElementById('previewLikeCount');
    if (previewLikeCount) previewLikeCount.textContent = '0 likes';
    if (inAppStreamPollTimer) {
      clearInterval(inAppStreamPollTimer);
      inAppStreamPollTimer = null;
    }
    currentLiveRoomId = null;
    if (window.AndroidNative && window.AndroidNative.disconnectTikTokLive) {
      try {
        window.AndroidNative.disconnectTikTokLive();
      } catch (_) {}
    }
    if (connectSpinner) connectSpinner.classList.add('hidden');
    if (saveStreamerUsernameBtn) saveStreamerUsernameBtn.disabled = false;
    if (usernameDot) usernameDot.className = 'w-2 h-2 rounded-full bg-zinc-600';
    if (usernameStatusText) {
      usernameStatusText.textContent = 'NOT CONNECTED';
      usernameStatusText.className = 'font-bold text-zinc-300';
    }
    if (usernameDetailText) usernameDetailText.textContent = 'Disconnected. Enter your username and tap CONNECT TO TIKTOK LIVE.';
    if (saveStreamerBtnText) saveStreamerBtnText.textContent = 'CONNECT TO TIKTOK LIVE';
    if (currentAccountTag) {
      currentAccountTag.textContent = 'NOT SET';
      currentAccountTag.className = 'text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300';
    }
    showToast('Disconnected from TikTok Live');
  }

  async function connectDirectTikTokLive(username) {
    const auth = window.PurplezAuth ? window.PurplezAuth.getCurrentStatus() : { isAccessAllowed: true, authenticated: true };
    if (!auth.authenticated) {
      if (authModal) authModal.classList.remove('hidden');
      showToast('Please sign in with your Gmail first');
      return;
    }
    if (!auth.isAccessAllowed) {
      if (paywallModal) paywallModal.classList.remove('hidden');
      showToast('Active subscription or trial required');
      return;
    }

    const clean = (username || '').trim().replace(/^@+/, '');
    if (!clean) {
      showToast('Please enter your TikTok username');
      return;
    }

    if (is100PercentConnected) {
      disconnectTikTokLive();
      return;
    }

    applyStreamerUsername(clean, true);

    isConnecting = true;
    if (connectSpinner) connectSpinner.classList.remove('hidden');
    if (saveStreamerBtnText) saveStreamerBtnText.textContent = 'CONNECTING...';
    if (saveStreamerUsernameBtn) saveStreamerUsernameBtn.disabled = true;

    if (usernameDot) usernameDot.className = 'w-2 h-2 rounded-full bg-yellow-400 animate-pulse';
    if (usernameStatusText) {
      usernameStatusText.textContent = 'CONNECTING TO TIKTOK LIVE...';
      usernameStatusText.className = 'font-bold text-zinc-300';
    }
    if (usernameDetailText) usernameDetailText.textContent = `Checking live room status for @${clean}...`;

    showToast(`Connecting to @${clean}...`);

    // Prioritize Native Android TikTokLiveManager for real live WebSocket streaming
    if (window.AndroidNative && window.AndroidNative.connectTikTokLive) {
      window.AndroidNative.connectTikTokLive(clean);
      return;
    }

    try {
      // Also notify local PC studio server if running on Wi-Fi
      const serverUrl = (serverUrlInput ? serverUrlInput.value : studioServerUrl) || 'http://192.168.254.100:3000';
      if (liveSocket && liveSocket.connected) {
        liveSocket.emit('connect_tiktok', { username: clean });
      }

      // Standalone direct in-app room verification
      let rawJson = null;
      if (window.AndroidNative && window.AndroidNative.fetchTikTokRoom) {
        try {
          rawJson = window.AndroidNative.fetchTikTokRoom(clean);
        } catch (e) {
          console.warn('[Standalone] Native room fetch error:', e);
        }
      }

      if (!rawJson || rawJson.startsWith('{"error"')) {
        try {
          const resp = await fetch(`https://www.tiktok.com/api-live/user/room/?aid=1988&app_name=tiktok_web&device_platform=web_pc&uniqueId=${clean}&sourceType=54`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Referer': 'https://www.tiktok.com/'
            }
          });
          if (resp.ok) {
            rawJson = await resp.text();
          }
        } catch (fe) {
          console.warn('[Standalone] Web fetch error:', fe);
        }
      }

      if (rawJson && !rawJson.startsWith('{"error"')) {
        let parsed = null;
        try { parsed = JSON.parse(rawJson); } catch (_) {}

        if (parsed && parsed.data && parsed.data.user) {
          const u = parsed.data.user;
          const avatar = u.avatarMedium || u.avatarThumb || u.avatarLarger;
          if (avatar) window.updateStreamerAvatar(avatar);
          const roomId = u.roomId;
          const status = u.status; // 2 = LIVE, 4 = OFFLINE

          if (status === 4 || !roomId || roomId === '0') {
            setConnectionState('OFFLINE', `@${clean} is not currently live on TikTok. Start your live stream, then tap Connect.`);
            return;
          }

          // User is verified live!
          currentLiveRoomId = roomId;
          startInAppLiveStreamPolling(roomId, clean, u);
          return;
        } else if (parsed && parsed.data === null) {
          setConnectionState('ERROR', `Could not find TikTok account @${clean}. Check the spelling.`);
          return;
        }
      }

      // Method 2: HTML Page Rehydration Check (Direct TikTok live page)
      let rawHtml = '';
      if (window.AndroidNative && window.AndroidNative.fetchTikTokHtml) {
        try {
          rawHtml = window.AndroidNative.fetchTikTokHtml(clean);
        } catch (_) {}
      }
      if (!rawHtml) {
        try {
          const htmlResp = await fetch(`https://www.tiktok.com/@${clean}/live`);
          if (htmlResp.ok) rawHtml = await htmlResp.text();
        } catch (_) {}
      }

      if (rawHtml) {
        const jsonMatch = rawHtml.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);
        if (jsonMatch && jsonMatch[1]) {
          try {
            const data = JSON.parse(jsonMatch[1]);
            const defaultScope = data?.['__DEFAULT_SCOPE__'];
            const liveRoom = defaultScope?.['webapp.live-detail']?.liveRoom || defaultScope?.['webapp.user-detail']?.userInfo?.liveRoom;
            if (liveRoom) {
              const ownerAvatar = liveRoom.owner?.avatarMedium || liveRoom.owner?.avatarThumb;
              if (ownerAvatar) window.updateStreamerAvatar(ownerAvatar);
              const status = liveRoom.status;
              const roomId = String(liveRoom.roomId || liveRoom.id || '');
              if (status === 2 || (roomId && roomId !== '0' && status !== 4)) {
                currentLiveRoomId = roomId;
                startInAppLiveStreamPolling(roomId, clean, { nickname: liveRoom.owner?.nickname || clean, roomId });
                return;
              } else if (status === 4) {
                setConnectionState('OFFLINE', `@${clean} is not currently live on TikTok. Start your live stream, then tap Connect.`);
                return;
              }
            }
          } catch (_) {}
        }
      }

      // Fallback timeout check
      setTimeout(() => {
        if (isConnecting && !is100PercentConnected) {
          setConnectionState('ERROR', `Could not verify live stream for @${clean}. Ensure you are live on TikTok.`);
        }
      }, 7000);

    } catch (err) {
      console.error('[Standalone] Connection error:', err);
      setConnectionState('ERROR', `Connection error: ${err.message || 'Unknown network error'}`);
    }
  }

  function startInAppLiveStreamPolling(roomId, clean, user) {
    if (inAppStreamPollTimer) clearInterval(inAppStreamPollTimer);

    setConnectionState('CONNECTED', `Live with @${clean} (${user?.nickname || clean}) • Room #${roomId}`);
    showToast(`100% Connected to @${clean} live stream!`);

    async function pollLiveFeed() {
      if (!is100PercentConnected) return;
      try {
        let base64 = null;
        if (window.AndroidNative && window.AndroidNative.fetchEulerStreamConnect) {
          try {
            base64 = window.AndroidNative.fetchEulerStreamConnect(roomId);
          } catch (_) {}
        }

        if (base64 && !base64.startsWith('{"error"')) {
          processRawStreamPayload(base64);
        } else {
          const res = await fetch(`https://api.eulerstream.com/webcast/rooms/${roomId}/connect?client=ttlive-node`, {
            headers: { 'User-Agent': 'tiktok-live-connector/2.4.3 win32' }
          });
          if (res.ok) {
            const buf = await res.arrayBuffer();
            processRawStreamBuffer(new Uint8Array(buf));
          }
        }
      } catch (err) {
        console.warn('[StreamPoll] Error:', err);
      }
    }

    pollLiveFeed();
    inAppStreamPollTimer = setInterval(pollLiveFeed, 2000);
  }

  // Lightweight Pure-JS Protobuf Decoder for Webcast Stream Payloads
  function parseProtoFields(buf, start = 0, end = buf.length) {
    const fields = [];
    let pos = start;
    while (pos < end) {
      let tag = 0, shift = 0, b;
      do {
        if (pos >= end) return fields;
        b = buf[pos++];
        tag += (b & 0x7f) * Math.pow(2, shift);
        shift += 7;
      } while (b & 0x80);

      const fieldNumber = tag >>> 3;
      const wireType = tag & 0x07;

      if (wireType === 0) { // Varint
        let val = 0, vShift = 0;
        do {
          if (pos >= end) break;
          b = buf[pos++];
          val += (b & 0x7f) * Math.pow(2, vShift);
          vShift += 7;
        } while (b & 0x80);
        fields.push({ fieldNumber, wireType, value: val });
      } else if (wireType === 2) { // Length-delimited (string, bytes, sub-message)
        let len = 0, lShift = 0;
        do {
          if (pos >= end) break;
          b = buf[pos++];
          len += (b & 0x7f) * Math.pow(2, lShift);
          lShift += 7;
        } while (b & 0x80);
        if (pos + len > end) len = end - pos;
        const data = buf.subarray(pos, pos + len);
        pos += len;
        fields.push({ fieldNumber, wireType, data });
      } else if (wireType === 1) { // 64-bit
        pos += 8;
      } else if (wireType === 5) { // 32-bit
        pos += 4;
      } else {
        break;
      }
    }
    return fields;
  }

  function decodeUtf8(bytes) {
    if (!bytes || bytes.length === 0) return '';
    if (typeof TextDecoder !== 'undefined') {
      try {
        return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      } catch (_) {}
    }
    let res = '';
    for (let i = 0; i < bytes.length; i++) {
      res += String.fromCharCode(bytes[i]);
    }
    return res;
  }

  function processRawStreamBuffer(bytes) {
    if (!bytes || bytes.length === 0) return;
    try {
      const rootFields = parseProtoFields(bytes);
      // messages is field 1 (repeated)
      const msgFields = rootFields.filter(f => f.fieldNumber === 1 && f.wireType === 2);
      for (const mf of msgFields) {
        const sub = parseProtoFields(mf.data);
        const methodField = sub.find(f => f.fieldNumber === 1 && f.wireType === 2);
        const payloadField = sub.find(f => f.fieldNumber === 2 && f.wireType === 2);
        if (!methodField || !payloadField) continue;

        const method = decodeUtf8(methodField.data);
        if (method === 'WebcastChatMessage') {
          parseWebcastChatMessageProto(payloadField.data);
        } else if (method === 'WebcastGiftMessage') {
          parseWebcastGiftMessageProto(payloadField.data);
        } else if (method === 'WebcastRoomUserSeqMessage') {
          parseWebcastRoomUserSeqProto(payloadField.data);
        } else if (method === 'WebcastLikeMessage') {
          parseWebcastLikeMessageProto(payloadField.data);
        }
      }
    } catch (e) {
      console.warn('[StreamProto] Decode error:', e);
    }
  }

  function parseWebcastRoomUserSeqProto(payloadBytes) {
    try {
      const fields = parseProtoFields(payloadBytes);
      let count = 0;
      const f3 = fields.find(f => f.fieldNumber === 3 && f.wireType === 0);
      if (f3 && f3.value > 0) count = f3.value;
      if (!count) {
        const f7 = fields.find(f => f.fieldNumber === 7 && f.wireType === 0);
        if (f7 && f7.value > 0) count = f7.value;
      }
      if (!count) {
        const f6 = fields.find(f => f.fieldNumber === 6 && f.wireType === 0);
        if (f6 && f6.value > 0) count = f6.value;
      }
      if (!count) {
        const f2 = fields.find(f => f.fieldNumber === 2 && f.wireType === 0);
        if (f2 && f2.value > 0) count = f2.value;
      }
      if (!count) {
        const anyV = fields.find(f => f.fieldNumber !== 1 && f.wireType === 0 && f.value > 0);
        if (anyV) count = anyV.value;
      }
      if (!count) {
        const ranks = fields.filter(f => f.fieldNumber === 2);
        if (ranks.length > 0) count = ranks.length;
      }
      if (count > 0) {
        if (typeof window.updateLiveViewerCount === 'function') {
          window.updateLiveViewerCount(count);
        }
      }
    } catch (_) {}
  }

  function parseWebcastLikeMessageProto(payloadBytes) {
    try {
      const fields = parseProtoFields(payloadBytes);
      const countField = fields.find(f => f.fieldNumber === 2 && f.wireType === 0);
      const count = countField ? Math.max(1, countField.value) : 1;
      const totalField = fields.find(f => f.fieldNumber === 3 && f.wireType === 0);
      const total = totalField ? totalField.value : 0;
      if (typeof window.updateLiveLikeCount === 'function') {
        window.updateLiveLikeCount(total, count);
      }
    } catch (_) {}
  }

  function parseWebcastChatMessageProto(payloadBytes) {
    try {
      const fields = parseProtoFields(payloadBytes);
      let content = '';
      let user = 'Viewer';
      let uniqueId = '';

      const contentField = fields.find(f => f.fieldNumber === 3 && f.wireType === 2);
      if (contentField) content = decodeUtf8(contentField.data);

      const userField = fields.find(f => f.fieldNumber === 2 && f.wireType === 2);
      if (userField) {
        const uFields = parseProtoFields(userField.data);
        const uId = uFields.find(f => f.fieldNumber === 3 && f.wireType === 2);
        const nick = uFields.find(f => f.fieldNumber === 4 && f.wireType === 2);
        if (nick) user = decodeUtf8(nick.data);
        if (uId) uniqueId = decodeUtf8(uId.data);
      }

      const displayUser = user || uniqueId || 'Viewer';
      if (!content) return;

      const commonField = fields.find(f => f.fieldNumber === 1 && f.wireType === 2);
      let msgId = '';
      if (commonField) {
        const cFields = parseProtoFields(commonField.data);
        const idField = cFields.find(f => f.fieldNumber === 1);
        if (idField) msgId = String(idField.value || '');
      }

      const dedupeKey = msgId ? `chat:msg:${msgId}` : `chat:${displayUser}:${content}:${Date.now()}_${Math.random()}`;
      if (processedMessageIds.has(dedupeKey)) return;
      processedMessageIds.add(dedupeKey);
      if (processedMessageIds.size > 250) {
        const first = processedMessageIds.values().next().value;
        processedMessageIds.delete(first);
      }

      window.addChatMessage(displayUser, 'VIEWER', content, false, null, 0);
    } catch (_) {}
  }

  function parseWebcastGiftMessageProto(payloadBytes) {
    try {
      const fields = parseProtoFields(payloadBytes);
      let user = 'Supporter';
      let giftName = 'Gift';
      let diamondCount = 1;
      let repeatCount = 1;

      const diamondField = fields.find(f => f.fieldNumber === 9 && f.wireType === 0);
      if (diamondField) diamondCount = diamondField.value || 1;

      const repeatField = fields.find(f => f.fieldNumber === 6 && f.wireType === 0);
      if (repeatField) repeatCount = repeatField.value || 1;

      const userField = fields.find(f => f.fieldNumber === 7 && f.wireType === 2);
      if (userField) {
        const uFields = parseProtoFields(userField.data);
        const uId = uFields.find(f => f.fieldNumber === 3 && f.wireType === 2);
        const nick = uFields.find(f => f.fieldNumber === 4 && f.wireType === 2);
        if (nick) user = decodeUtf8(nick.data);
        else if (uId) user = decodeUtf8(uId.data);
      }

      const giftObjField = fields.find(f => f.fieldNumber === 15 && f.wireType === 2);
      if (giftObjField) {
        const gFields = parseProtoFields(giftObjField.data);
        const nameField = gFields.find(f => f.fieldNumber === 2 && f.wireType === 2);
        if (nameField) giftName = decodeUtf8(nameField.data);
      }

      const totalCoins = diamondCount * repeatCount;
      const commonField = fields.find(f => f.fieldNumber === 1 && f.wireType === 2);
      let msgId = '';
      if (commonField) {
        const cFields = parseProtoFields(commonField.data);
        const idField = cFields.find(f => f.fieldNumber === 1);
        if (idField) msgId = String(idField.value || '');
      }

      const dedupeKey = msgId ? `gift:msg:${msgId}` : `gift:${user}:${giftName}:${repeatCount}:${totalCoins}:${Date.now()}_${Math.random()}`;
      if (processedMessageIds.has(dedupeKey)) return;
      processedMessageIds.add(dedupeKey);
      if (processedMessageIds.size > 250) {
        const first = processedMessageIds.values().next().value;
        processedMessageIds.delete(first);
      }

      const badge = `LVL VIP`;
      const text = `Sent ${giftName}${repeatCount > 1 ? ` x${repeatCount}` : ''}!`;
      window.addChatMessage(user, badge, text, true, `${giftName}${repeatCount > 1 ? ` x${repeatCount}` : ''} (${totalCoins.toLocaleString()} Coins)`, totalCoins);
    } catch (_) {}
  }

  function processRawStreamPayload(base64Str) {
    try {
      const binaryString = atob(base64Str);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      processRawStreamBuffer(bytes);
      processRawStreamString(binaryString);
    } catch (_) {}
  }

  function processRawStreamString(str) {
    if (!str) return;
    const chatRegex = /WebcastChatMessage[\s\S]{0,40}?([A-Za-z0-9_.\-]{3,24})[\s\S]{0,60}?([^\x00-\x1F\x7F-\x9F]{2,120})/g;
    let match;
    while ((match = chatRegex.exec(str)) !== null) {
      const user = match[1];
      const text = match[2];
      const key = `str:${user}:${text}:${Date.now()}_${Math.random()}`;
      if (!processedMessageIds.has(key)) {
        processedMessageIds.add(key);
        if (processedMessageIds.size > 250) {
          const firstKey = processedMessageIds.values().next().value;
          processedMessageIds.delete(firstKey);
        }
        window.addChatMessage(user, 'VIEWER', text, false, null, 0);
      }
    }
  }

  // Load saved streamer username on startup
  let initialUser = '';
  if (window.AndroidNative && window.AndroidNative.getStreamerUsername) {
    try {
      initialUser = window.AndroidNative.getStreamerUsername();
    } catch (_) {}
  }
  if (!initialUser) {
    try {
      initialUser = localStorage.getItem('purplez_streamer_username') || '';
    } catch (_) {}
  }
  if (initialUser) {
    applyStreamerUsername(initialUser, false);
  }

  // Load saved streamer avatar on startup
  let initialAvatar = '';
  if (window.AndroidNative && window.AndroidNative.getStreamerAvatarUrl) {
    try {
      initialAvatar = window.AndroidNative.getStreamerAvatarUrl();
    } catch (_) {}
  }
  if (!initialAvatar) {
    try {
      initialAvatar = localStorage.getItem('purplez_streamer_avatar') || '';
    } catch (_) {}
  }
  if (initialAvatar) {
    window.updateStreamerAvatar(initialAvatar);
  }

  if (saveStreamerUsernameBtn) {
    saveStreamerUsernameBtn.addEventListener('click', () => {
      const val = (streamerUsernameInput ? streamerUsernameInput.value : '').trim();
      connectDirectTikTokLive(val);
    });
  }

  if (streamerUsernameInput) {
    streamerUsernameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        saveStreamerUsernameBtn?.click();
      }
    });
  }
  if (settingsToggleBtn && settingsDropdown) {
    settingsToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      settingsDropdown.classList.toggle('hidden');
    });

    closeSettingsBtn?.addEventListener('click', () => {
      settingsDropdown.classList.add('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!settingsDropdown.contains(e.target) && !settingsToggleBtn.contains(e.target)) {
        settingsDropdown.classList.add('hidden');
      }
    });
  }

  document.querySelectorAll('.opacity-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-val');
      if (transparencySlider) transparencySlider.value = val;
      applyOpacity(val);
    });
  });

  function applyOpacity(val) {
    if (transparencyValue) transparencyValue.textContent = `${val}%`;
    const simOpacityDisplay = document.getElementById('simOpacityDisplay');
    if (simOpacityDisplay) simOpacityDisplay.textContent = `${val}%`;
    const simOpacitySlider = document.getElementById('simOpacitySlider');
    if (simOpacitySlider && simOpacitySlider.value !== String(val)) simOpacitySlider.value = val;
    if (transparencySlider && transparencySlider.value !== String(val)) transparencySlider.value = val;
    const alpha = (val / 100).toFixed(2);
    if (floatingWindow) {
      floatingWindow.style.backgroundColor = `rgba(0, 0, 0, ${alpha})`;
    }
    // Also sync to native overlay window if in overlay mode
    if (window.AndroidNative && window.AndroidNative.setOverlayAlpha) {
      window.AndroidNative.setOverlayAlpha(parseFloat(alpha));
    }
  }

  if (transparencySlider) {
    transparencySlider.addEventListener('input', (e) => {
      applyOpacity(e.target.value);
    });
  }

  // Native Floating Overlay Action from Settings
  if (nativeOverlayBtn) {
    nativeOverlayBtn.addEventListener('click', () => {
      if (settingsDropdown) settingsDropdown.classList.add('hidden');
      if (window.AndroidNative && window.AndroidNative.startFloatingOverlay) {
        window.AndroidNative.startFloatingOverlay();
      } else {
        showToast('System Overlay supported on Android device');
      }
    });
  }

  // Live Alerts Test Triggers (Simulate Follower & Gift Notifications)
  const testFollowAlertBtn = document.getElementById('testFollowAlertBtn');
  const testGiftAlertBtn = document.getElementById('testGiftAlertBtn');
  const controlTestFollowBtn = document.getElementById('controlTestFollowBtn');
  const controlTestGiftBtn = document.getElementById('controlTestGiftBtn');

  function triggerTestFollow() {
    const testNames = ['SuperFan_99', 'TikTok_Explorer', 'Purplez_VIP', 'StarGazer', 'GamerPro_PH'];
    const randomUser = testNames[Math.floor(Math.random() * testNames.length)];
    if (window.AndroidNative && typeof window.AndroidNative.simulateFollowAlert === 'function') {
      window.AndroidNative.simulateFollowAlert(randomUser);
    } else {
      triggerFollowAlert(randomUser, randomUser, '');
    }
  }

  function triggerTestGift() {
    const testGifts = [
      { name: 'Rose', count: 1, coins: 1 },
      { name: 'Heart Me', count: 5, coins: 5 },
      { name: 'Doughnut', count: 1, coins: 30 },
      { name: 'TikTok Corgi', count: 1, coins: 299 },
      { name: 'Lion', count: 1, coins: 29999 }
    ];
    const testUsers = ['LegendaryGifter', 'DragonKing', 'QueenBee', 'Whale_Supporter'];
    const randomGift = testGifts[Math.floor(Math.random() * testGifts.length)];
    const randomUser = testUsers[Math.floor(Math.random() * testUsers.length)];
    handleIncomingRealGift({
      nickname: randomUser,
      uniqueId: randomUser.toLowerCase(),
      giftName: randomGift.name,
      repeatCount: randomGift.count,
      diamondCount: Math.round(randomGift.coins / randomGift.count)
    });
  }

  if (testFollowAlertBtn) testFollowAlertBtn.addEventListener('click', triggerTestFollow);
  if (controlTestFollowBtn) controlTestFollowBtn.addEventListener('click', triggerTestFollow);
  if (testGiftAlertBtn) testGiftAlertBtn.addEventListener('click', triggerTestGift);
  if (controlTestGiftBtn) controlTestGiftBtn.addEventListener('click', triggerTestGift);

  // ==========================================
  // DRAGGABLE WINDOW SYSTEM WITH BOUNDS CLAMPING
  // ==========================================
  let isDragging = false;
  let startPointerX = 0;
  let startPointerY = 0;
  let startWindowLeft = 0;
  let startWindowTop = 0;

  function clampWindowPosition(x, y) {
    const bottomBarHeight = (bottomNavBar && !isOverlayMode) ? bottomNavBar.offsetHeight : 0;
    const margin = 8;
    const windowWidth = floatingWindow ? floatingWindow.offsetWidth : 330;
    const windowHeight = floatingWindow ? floatingWindow.offsetHeight : 230;

    const minX = margin;
    const maxX = Math.max(margin, window.innerWidth - windowWidth - margin);

    const minY = margin;
    const maxY = Math.max(margin, window.innerHeight - bottomBarHeight - windowHeight - margin);

    return {
      x: Math.min(Math.max(x, minX), maxX),
      y: Math.min(Math.max(y, minY), maxY)
    };
  }

  function setWindowPosition(x, y) {
    if (!floatingWindow || isOverlayMode) return;
    const clamped = clampWindowPosition(x, y);
    floatingWindow.style.left = `${clamped.x}px`;
    floatingWindow.style.top = `${clamped.y}px`;
  }

  function onDragStart(e) {
    if (isOverlayMode) return;
    if (e.button !== undefined && e.button !== 0) return;

    isDragging = true;
    document.body.classList.add('is-dragging');
    floatingWindow?.classList.add('window-dragging');

    startPointerX = e.clientX;
    startPointerY = e.clientY;

    if (floatingWindow) {
      const rect = floatingWindow.getBoundingClientRect();
      startWindowLeft = rect.left;
      startWindowTop = rect.top;
    }

    if (e.target.setPointerCapture && e.pointerId !== undefined) {
      try {
        e.target.setPointerCapture(e.pointerId);
      } catch (_) {}
    }

    e.preventDefault();
  }

  function onDragMove(e) {
    if (!isDragging || isOverlayMode) return;
    const deltaX = e.clientX - startPointerX;
    const deltaY = e.clientY - startPointerY;
    setWindowPosition(startWindowLeft + deltaX, startWindowTop + deltaY);
  }

  function onDragEnd(e) {
    if (!isDragging) return;
    isDragging = false;
    document.body.classList.remove('is-dragging');
    floatingWindow?.classList.remove('window-dragging');

    if (e.target.releasePointerCapture && e.pointerId !== undefined) {
      try {
        e.target.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  }

  [chatDragHeader, chatHeaderBar].forEach(handle => {
    if (handle) handle.addEventListener('pointerdown', onDragStart);
  });

  window.addEventListener('pointermove', onDragMove);
  window.addEventListener('pointerup', onDragEnd);
  window.addEventListener('pointercancel', onDragEnd);

  // ==========================================
  // TOUCH CORNER RESIZE ENGINE
  // ==========================================
  let isResizing = false;
  let resizeStartX = 0;
  let resizeStartY = 0;
  let resizeStartWidth = 0;
  let resizeStartHeight = 0;

  if (cornerResizeHandle) {
    cornerResizeHandle.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      e.preventDefault();
      isResizing = true;
      resizeStartX = e.clientX;
      resizeStartY = e.clientY;
      resizeStartWidth = floatingWindow ? floatingWindow.offsetWidth : 330;
      resizeStartHeight = floatingWindow ? floatingWindow.offsetHeight : 230;

      if (e.target.setPointerCapture && e.pointerId !== undefined) {
        try { e.target.setPointerCapture(e.pointerId); } catch (_) {}
      }
    });

    window.addEventListener('pointermove', (e) => {
      if (!isResizing || !floatingWindow) return;
      const bottomBarHeight = (bottomNavBar && !isOverlayMode) ? bottomNavBar.offsetHeight : 0;
      const maxWidth = Math.max(200, window.innerWidth - 20);
      const maxHeight = Math.max(140, window.innerHeight - bottomBarHeight - floatingWindow.offsetTop - 8);

      const newWidth = Math.max(200, Math.min(maxWidth, resizeStartWidth + (e.clientX - resizeStartX)));
      const newHeight = Math.max(140, Math.min(maxHeight, resizeStartHeight + (e.clientY - resizeStartY)));

      floatingWindow.style.width = `${newWidth}px`;
      floatingWindow.style.height = `${newHeight}px`;

      if (isOverlayMode && window.AndroidNative && window.AndroidNative.setOverlayWindowSize) {
        window.AndroidNative.setOverlayWindowSize(newWidth, newHeight);
      }
    });

    const stopResize = (e) => {
      if (!isResizing) return;
      isResizing = false;
      if (e.target.releasePointerCapture && e.pointerId !== undefined) {
        try { e.target.releasePointerCapture(e.pointerId); } catch (_) {}
      }
      if (floatingWindow && !isOverlayMode) {
        const rect = floatingWindow.getBoundingClientRect();
        setWindowPosition(rect.left, rect.top);
      }
    };

    window.addEventListener('pointerup', stopResize);
    window.addEventListener('pointercancel', stopResize);
  }

  // ==========================================
  // ORIENTATION CHANGE & SCREEN CONTAINMENT
  // ==========================================
  function enforceWindowScreenBounds() {
    if (!floatingWindow || isOverlayMode) return;
    const maxW = Math.max(200, window.innerWidth - 16);
    const maxH = Math.max(140, window.innerHeight - 56);
    if (floatingWindow.offsetWidth > maxW) {
      floatingWindow.style.width = `${maxW}px`;
    }
    if (floatingWindow.offsetHeight > maxH) {
      floatingWindow.style.height = `${maxH}px`;
    }
    const rect = floatingWindow.getBoundingClientRect();
    setWindowPosition(rect.left, rect.top);
  }

  window.addEventListener('resize', () => {
    handleOrientationChange();
    enforceWindowScreenBounds();
  });

  function handleOrientationChange() {
    isLandscape = window.innerWidth > window.innerHeight;
    const tag = isLandscape ? 'LANDSCAPE' : 'PORTRAIT';

    if (orientationTag) orientationTag.textContent = tag;
    if (deviceOrientationBadge) deviceOrientationBadge.textContent = tag;
    if (landscapeStatus) landscapeStatus.textContent = `${tag} HUD`;

    enforceWindowScreenBounds();
  }

  window.onAndroidOrientationChanged = function(isLand) {
    isLandscape = isLand;
    handleOrientationChange();
    if (floatingWindow && !isOverlayMode) {
      const rect = floatingWindow.getBoundingClientRect();
      setWindowPosition(rect.left, rect.top);
    }
  };

  if (resetPositionBtn) {
    resetPositionBtn.addEventListener('click', () => {
      setWindowPosition(16, 48);
      if (logoToggleBtn) {
        logoToggleBtn.style.position = '';
        logoToggleBtn.style.left = '';
        logoToggleBtn.style.top = '';
        logoToggleBtn.style.zIndex = '';
      }
      if (miniDock) {
        miniDock.style.position = '';
        miniDock.style.left = '';
        miniDock.style.top = '';
        miniDock.style.zIndex = '';
      }
      isSimAtEdge = false;
      if (isWindowHidden && miniDock) {
        miniDock.classList.remove('hidden');
      }
      showToast('Overlay & Bubble Position Reset');
    });
  }

  // ==========================================
  // CHAT RENDERING & AUTO-SCROLL ENGINE
  // ==========================================
  function createChatRowElement(msg) {
    const isHighlighted = (highlightedMessageId === msg.id);
    const row = document.createElement('div');
    row.id = `msg-${msg.id}`;
    row.className = `chat-row cursor-pointer rounded-lg p-1.5 border transition-all duration-150 select-text ${
      isHighlighted
        ? 'highlighted border-white'
        : 'bg-zinc-950/80 hover:bg-zinc-900/90 border-zinc-800'
    }`;

    if (activeTab === 'gifter' || msg.gift) {
      row.innerHTML = `
        <div class="flex items-center justify-between gap-1 leading-tight">
          <div class="flex items-center space-x-1.5 min-w-0">
            <span class="badge px-1 py-0.2 rounded text-[8.5px] font-mono font-bold shrink-0 ${
              msg.isSuperGifter
                ? 'bg-white text-black border border-white'
                : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
            }">${msg.badge}</span>
            <span class="chat-username font-bold text-[9.5px] text-zinc-400 truncate">${msg.user}</span>
            ${msg.gift ? `
              <span class="gift-badge text-[8.5px] font-mono font-bold px-1 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-700 truncate shrink-0">
                ${msg.gift}
              </span>
            ` : ''}
          </div>
          <span class="chat-time text-[8.5px] font-mono text-zinc-500 shrink-0 ml-1">${msg.time}</span>
        </div>
        <div class="chat-text text-[10px] leading-tight text-zinc-400 font-normal pl-0.5 break-words mt-0.5">
          ${msg.text}
        </div>
      `;
    } else {
      const isFollower = (msg.badge === 'FOLLOWER');
      if (isFollower && !isHighlighted) {
        row.className = 'chat-row cursor-pointer rounded-lg p-1.5 border transition-all duration-150 select-text bg-zinc-900 border-zinc-600 shadow-sm';
      }
      row.innerHTML = `
        <div class="flex items-center justify-between gap-1 leading-tight">
          <div class="flex items-center space-x-1.5 min-w-0">
            <span class="badge px-1 py-0.2 rounded text-[8px] font-mono font-bold shrink-0 ${
              isFollower
                ? 'bg-white text-black border border-white font-extrabold'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
            }">${msg.badge}</span>
            <span class="chat-username font-bold text-[9.5px] ${isFollower ? 'text-white' : 'text-zinc-400'} truncate">${msg.user}</span>
          </div>
          <span class="chat-time text-[8.5px] font-mono text-zinc-500 shrink-0 ml-1">${msg.time}</span>
        </div>
        <div class="chat-text text-[10px] leading-tight ${isFollower ? 'text-zinc-200 font-medium' : 'text-zinc-400'} pl-0.5 break-words mt-0.5">
          ${msg.text}
        </div>
      `;
    }

    row.dataset.user = (msg.user || '').toLowerCase();
    row.dataset.uniqueId = (msg.uniqueId || '').toLowerCase();
    row.dataset.isGifter = msg.isGifter ? 'true' : 'false';

    if (viewerFilterQuery) {
      const q = viewerFilterQuery;
      const matches = (row.dataset.user && row.dataset.user.includes(q)) || 
                      (row.dataset.uniqueId && row.dataset.uniqueId.includes(q));
      if (!matches) {
        row.classList.add('hidden');
      }
    }

    row.addEventListener('click', () => {
      copyAndHighlightMessage(msg);
    });

    return row;
  }

  function appendChatRowToDOM(msg) {
    if (!chatContainer) return;
    if (activeTab === 'gifter' && !msg.isGifter) return;

    const emptyPlaceholder = chatContainer.querySelector('.empty-chat-placeholder');
    if (emptyPlaceholder) {
      emptyPlaceholder.remove();
    }

    const row = createChatRowElement(msg);
    chatContainer.appendChild(row);

    while (chatContainer.children.length > 500) {
      const removedChild = chatContainer.firstElementChild;
      const removedHeight = removedChild ? removedChild.offsetHeight : 0;
      chatContainer.removeChild(removedChild);
      if (isAutoScrollPaused && removedHeight > 0) {
        chatContainer.scrollTop -= removedHeight;
      }
    }

    if (viewerFilterQuery) {
      applyViewerFilter();
    }

    if (!isAutoScrollPaused && !isUserTouchingChat) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    } else {
      pausedUnreadCount++;
      updateAutoScrollResumeBtn();
    }
  }

  function renderChatMessages() {
    if (!chatContainer) return;
    chatContainer.innerHTML = '';
    const list = activeTab === 'gifter' ? gifterChats : regularChats;

    if (gifterCountBadge) gifterCountBadge.textContent = gifterChats.length;
    if (regularCountBadge) {
      regularCountBadge.textContent = regularChats.length > 50 ? `${(regularChats.length / 1000).toFixed(1)}k` : regularChats.length;
    }

    if (list.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'empty-chat-placeholder h-full min-h-[140px] flex flex-col items-center justify-center p-4 text-center text-zinc-500 font-mono space-y-1.5 select-none';
      emptyDiv.innerHTML = `
        <div class="w-7 h-7 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-500 mb-1">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
        </div>
        <div class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
          ${activeTab === 'gifter' ? 'NO GIFTS RECEIVED YET' : 'AWAITING LIVE COMMENTS'}
        </div>
        <div class="text-[9px] text-zinc-600 max-w-xs leading-relaxed">
          ${activeTab === 'gifter' ? 'When viewers send gifts, they will appear here.' : 'Real stream comments will appear here automatically.'}
        </div>
      `;
      chatContainer.appendChild(emptyDiv);
      updateMiniTicker();
      updateTotalGiftsDisplay();
      return;
    }

    list.forEach((msg) => {
      const row = createChatRowElement(msg);
      chatContainer.appendChild(row);
    });

    if (viewerFilterQuery) {
      applyViewerFilter();
    }

    if (!isAutoScrollPaused && !isUserTouchingChat) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    updateMiniTicker();
    updateTotalGiftsDisplay();
  }

  function updateAutoScrollResumeBtn() {
    if (!autoScrollResumeBtn) return;
    if (isAutoScrollPaused) {
      autoScrollResumeBtn.classList.remove('hidden');
      if (autoScrollResumeText) {
        autoScrollResumeText.textContent = pausedUnreadCount > 0
          ? `RESUME AUTO-SCROLL (${pausedUnreadCount} NEW)`
          : 'RESUME AUTO-SCROLL';
      }
    } else {
      autoScrollResumeBtn.classList.add('hidden');
    }
  }

  let isProgrammaticScroll = false;

  if (autoScrollResumeBtn) {
    autoScrollResumeBtn.addEventListener('click', () => {
      isAutoScrollPaused = false;
      pausedUnreadCount = 0;
      highlightedMessageId = null;
      updateHighlightDOM(null);
      updateAutoScrollResumeBtn();
      isProgrammaticScroll = true;
      chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
      setTimeout(() => {
        isProgrammaticScroll = false;
        if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
      }, 350);
      showToast('Resumed Auto-Scroll');
    });
  }

  if (chatContainer) {
    chatContainer.addEventListener('touchstart', () => {
      isUserTouchingChat = true;
      isAutoScrollPaused = true;
      clearTimeout(touchReleaseTimer);
      updateAutoScrollResumeBtn();
    }, { passive: true });

    chatContainer.addEventListener('pointerdown', () => {
      isUserTouchingChat = true;
      isAutoScrollPaused = true;
      clearTimeout(touchReleaseTimer);
      updateAutoScrollResumeBtn();
    });

    chatContainer.addEventListener('touchmove', () => {
      isUserTouchingChat = true;
      isAutoScrollPaused = true;
    }, { passive: true });

    chatContainer.addEventListener('pointermove', () => {
      isUserTouchingChat = true;
      isAutoScrollPaused = true;
    });

    const onTouchEnd = () => {
      clearTimeout(touchReleaseTimer);
      touchReleaseTimer = setTimeout(() => {
        isUserTouchingChat = false;
      }, 600);
    };

    chatContainer.addEventListener('touchend', onTouchEnd, { passive: true });
    chatContainer.addEventListener('touchcancel', onTouchEnd, { passive: true });
    chatContainer.addEventListener('pointerup', onTouchEnd);
    chatContainer.addEventListener('pointercancel', onTouchEnd);

    chatContainer.addEventListener('wheel', () => {
      isAutoScrollPaused = true;
      updateAutoScrollResumeBtn();
    }, { passive: true });

    chatContainer.addEventListener('scroll', () => {
      if (isProgrammaticScroll) return;
      const distFromBottom = chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight;
      if (distFromBottom > 15) {
        if (!isAutoScrollPaused) {
          isAutoScrollPaused = true;
        }
        updateAutoScrollResumeBtn();
      } else {
        if (distFromBottom <= 5 && !isUserTouchingChat && !highlightedMessageId) {
          if (isAutoScrollPaused) {
            isAutoScrollPaused = false;
            pausedUnreadCount = 0;
            updateAutoScrollResumeBtn();
          }
        }
      }
    }, { passive: true });
  }

  function extractMlbbIdOrText(text) {
    if (!text || typeof text !== 'string') return '';
    const clean = text.trim();
    // Look for standard MLBB account ID: 5 to 12 consecutive digits
    // Examples: "ate pa flex 332701259" -> "332701259", "332701259 (3657)" -> "332701259"
    const match = clean.match(/\b\d{5,12}\b/);
    if (match) {
      return match[0];
    }
    return clean;
  }

  function copyAndHighlightMessage(msg) {
    if (highlightedMessageId === msg.id) {
      highlightedMessageId = null;
      if (selectedStatusText) {
        selectedStatusText.textContent = 'No message selected';
        selectedStatusText.classList.remove('text-white', 'underline');
        selectedStatusText.classList.add('text-zinc-400');
      }
      updateHighlightDOM(null);
      showToast('Highlight Deselected');

      const distFromBottom = chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight;
      if (distFromBottom <= 15 && !isUserTouchingChat) {
        isAutoScrollPaused = false;
        pausedUnreadCount = 0;
      }
      updateAutoScrollResumeBtn();
      return;
    }

    highlightedMessageId = msg.id;
    // Streamer is actively reading/inspecting this message: pause auto-scrolling
    isAutoScrollPaused = true;
    updateAutoScrollResumeBtn();

    const copyPayload = extractMlbbIdOrText(msg.text);
    const isMlbbId = (copyPayload !== msg.text) || /^\d{5,12}$/.test(copyPayload);

    let copiedSuccessfully = false;
    if (window.AndroidNative && window.AndroidNative.copyToClipboard) {
      window.AndroidNative.copyToClipboard(copyPayload, '');
      copiedSuccessfully = true;
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(copyPayload).catch(() => {});
      copiedSuccessfully = true;
    }

    if (!copiedSuccessfully) {
      try {
        const ta = document.createElement('textarea');
        ta.value = copyPayload;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      } catch (_) {}
    }

    showToast(isMlbbId ? `Copied ID: ${copyPayload}` : 'Chat message copied to clipboard');

    if (selectedStatusText) {
      selectedStatusText.textContent = `Selected: ${msg.user}`;
      selectedStatusText.classList.remove('text-zinc-400');
      selectedStatusText.classList.add('text-white', 'underline');
    }

    updateHighlightDOM(msg.id);

    const activeRow = document.getElementById(`msg-${msg.id}`);
    if (activeRow) {
      activeRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function updateHighlightDOM(selectedId) {
    document.querySelectorAll('.chat-row').forEach(row => {
      if (row.id === `msg-${selectedId}`) {
        row.classList.add('highlighted', 'border-white');
      } else {
        row.classList.remove('highlighted', 'border-white');
      }
    });
  }

  function applyViewerFilter() {
    if (!chatContainer) return;
    const rows = chatContainer.querySelectorAll('.chat-row');
    let matchCount = 0;
    const q = viewerFilterQuery;

    rows.forEach(row => {
      const u = (row.dataset.user || '');
      const uid = (row.dataset.uniqueId || '');
      const isGifter = row.dataset.isGifter === 'true';

      if (activeTab === 'gifter' && !isGifter) {
        row.classList.add('hidden');
        return;
      }

      if (!q) {
        row.classList.remove('hidden');
        matchCount++;
      } else {
        const matches = u.includes(q) || uid.includes(q);
        if (matches) {
          row.classList.remove('hidden');
          matchCount++;
        } else {
          row.classList.add('hidden');
        }
      }
    });

    if (q) {
      if (viewerSearchCountBadge) {
        viewerSearchCountBadge.textContent = `${matchCount} found`;
        viewerSearchCountBadge.classList.remove('hidden');
      }
      if (searchViewerIconPill) {
        searchViewerIconPill.classList.remove('bg-zinc-900/90', 'border-zinc-700', 'text-zinc-300');
        searchViewerIconPill.classList.add('bg-white', 'border-white', 'text-black');
      }
    } else {
      if (viewerSearchCountBadge) {
        viewerSearchCountBadge.classList.add('hidden');
      }
      if (searchViewerIconPill) {
        searchViewerIconPill.classList.remove('bg-white', 'border-white', 'text-black');
        searchViewerIconPill.classList.add('bg-zinc-900/90', 'border-zinc-700', 'text-zinc-300');
      }
    }
  }

  function setupViewerSearchFilter() {
    if (!searchViewerToggleBtn) return;

    searchViewerToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!chatSearchFilterBar) return;
      const isHidden = chatSearchFilterBar.classList.contains('hidden');
      if (isHidden) {
        chatSearchFilterBar.classList.remove('hidden');
        if (window.AndroidNative && typeof window.AndroidNative.requestOverlayKeyboard === 'function') {
          window.AndroidNative.requestOverlayKeyboard(true);
        }
        if (viewerSearchInput) {
          viewerSearchInput.focus();
          setTimeout(() => {
            try { viewerSearchInput.focus(); } catch (_) {}
          }, 60);
        }
      } else {
        if (window.AndroidNative && typeof window.AndroidNative.requestOverlayKeyboard === 'function') {
          window.AndroidNative.requestOverlayKeyboard(false);
        }
        if (viewerSearchInput && viewerSearchInput.value.trim().length > 0) {
          viewerSearchInput.value = '';
          viewerFilterQuery = '';
          applyViewerFilter();
        }
        chatSearchFilterBar.classList.add('hidden');
      }
    });

    if (closeViewerSearchBtn) {
      closeViewerSearchBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.AndroidNative && typeof window.AndroidNative.requestOverlayKeyboard === 'function') {
          window.AndroidNative.requestOverlayKeyboard(false);
        }
        if (viewerSearchInput) viewerSearchInput.value = '';
        viewerFilterQuery = '';
        applyViewerFilter();
        if (chatSearchFilterBar) chatSearchFilterBar.classList.add('hidden');
      });
    }

    if (viewerSearchInput) {
      viewerSearchInput.addEventListener('focus', () => {
        if (window.AndroidNative && typeof window.AndroidNative.requestOverlayKeyboard === 'function') {
          window.AndroidNative.requestOverlayKeyboard(true);
        }
      });

      viewerSearchInput.addEventListener('blur', () => {
        if (window.AndroidNative && typeof window.AndroidNative.requestOverlayKeyboard === 'function') {
          window.AndroidNative.requestOverlayKeyboard(false);
        }
      });

      viewerSearchInput.addEventListener('input', (e) => {
        viewerFilterQuery = e.target.value.trim().toLowerCase();
        applyViewerFilter();
      });

      viewerSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          if (window.AndroidNative && typeof window.AndroidNative.requestOverlayKeyboard === 'function') {
            window.AndroidNative.requestOverlayKeyboard(false);
          }
          viewerSearchInput.blur();
        } else if (e.key === 'Escape') {
          if (window.AndroidNative && typeof window.AndroidNative.requestOverlayKeyboard === 'function') {
            window.AndroidNative.requestOverlayKeyboard(false);
          }
          viewerSearchInput.blur();
          viewerSearchInput.value = '';
          viewerFilterQuery = '';
          applyViewerFilter();
          if (chatSearchFilterBar) chatSearchFilterBar.classList.add('hidden');
        }
      });
    }
  }

  function showToast(text) {
    if (!copyToast || !toastMessage) return;
    toastMessage.textContent = text;
    copyToast.classList.remove('-translate-y-16', 'opacity-0');
    copyToast.classList.add('translate-y-0', 'opacity-100');

    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => {
      copyToast.classList.add('-translate-y-16', 'opacity-0');
      copyToast.classList.remove('translate-y-0', 'opacity-100');
    }, 2200);
  }

  function updateMiniTicker() {
    const topList = activeTab === 'gifter' ? gifterChats : regularChats;
    const latest = topList[topList.length - 1];

    if (latest) {
      if (miniTickerContent) {
        miniTickerContent.innerHTML = `
          <div class="flex items-center space-x-1.5 text-zinc-300">
            <span class="bg-white text-black font-extrabold text-[9px] px-1 py-0.2 rounded font-mono">${latest.badge}</span>
            <span class="font-bold text-white">${latest.user}:</span>
            <span class="truncate">${latest.gift ? `[GIFT] ${latest.gift} - ` : ''}${latest.text}</span>
          </div>
          <div class="text-[9px] text-zinc-500 font-mono flex items-center justify-between">
            <span>Tap logo to restore chat</span>
            <span class="text-white">${latest.time}</span>
          </div>
        `;
      }
      if (isWindowHidden && miniDock) {
        if (!isSimAtEdge) {
          miniDock.classList.remove('hidden');
        } else {
          miniDock.classList.add('hidden');
        }
      }

      // Sync latest message to native Android ticker
      if (window.AndroidNative && window.AndroidNative.updateLatestChat) {
        const isGift = !!latest.gift;
        const textPayload = latest.gift ? `[GIFT] ${latest.gift}: ${latest.text}` : latest.text;
        window.AndroidNative.updateLatestChat(latest.user, textPayload, latest.badge, latest.time, isGift);
      }
    }
  }

  function triggerGiftAlert(gifterName, giftName, coins) {
    if (!giftAlertBanner || !giftAlertText || !giftAlertCoins) return;

    totalGiftCoins += coins;
    updateTotalGiftsDisplay();

    giftAlertText.textContent = `GIFT ALERT: @${gifterName} sent ${giftName}!`;
    giftAlertCoins.textContent = `${coins.toLocaleString()} COINS`;
    giftAlertBanner.classList.remove('hidden');

    clearTimeout(window.giftAlertTimer);
    window.giftAlertTimer = setTimeout(() => {
      giftAlertBanner.classList.add('hidden');
    }, 4000);
  }

  // ==========================================
  // FOLLOWER NOTIFICATION SOUND & ALERT ENGINE
  // ==========================================
  let cachedBlupAudio = null;

  function getFollowSoundConfig() {
    return {
      type: localStorage.getItem('purplez_follow_sound_type') || 'blup',
      customData: localStorage.getItem('purplez_follow_sound_custom_data') || '',
      customName: localStorage.getItem('purplez_follow_sound_custom_name') || ''
    };
  }

  function playBubblePopSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!window._followAudioCtx) {
        window._followAudioCtx = new AudioCtx();
      }
      const ctx = window._followAudioCtx;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(840, now + 0.08);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch (_) {}
  }

  function playFollowChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!window._followAudioCtx) {
        window._followAudioCtx = new AudioCtx();
      }
      const ctx = window._followAudioCtx;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime;
      // High-register crystal ascending chime
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1318.51, now + 0.12);
      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1760, now + 0.1);
      gain2.gain.setValueAtTime(0.25, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.6);
    } catch (_) {}
  }

  function playFollowNotificationSound() {
    const config = getFollowSoundConfig();

    if (config.type === 'custom' && config.customData) {
      try {
        const audio = new Audio(config.customData);
        audio.volume = 1.0;
        const p = audio.play();
        if (p !== undefined) {
          p.catch(() => playFollowChime());
        }
        return;
      } catch (_) {
        playFollowChime();
        return;
      }
    }

    if (config.type === 'crystal') {
      playFollowChime();
      return;
    }

    if (config.type === 'pop') {
      playBubblePopSound();
      return;
    }

    // Default: 'blup'
    // 1. Play native Android raw resource sound if available
    if (window.AndroidNative && typeof window.AndroidNative.playNotificationSound === 'function') {
      try {
        window.AndroidNative.playNotificationSound('blup');
        return;
      } catch (_) {}
    }

    // 2. Play bundled blup.mp3 via HTML5 Audio
    try {
      if (!cachedBlupAudio) {
        cachedBlupAudio = new Audio('blup.mp3');
      }
      cachedBlupAudio.currentTime = 0;
      cachedBlupAudio.volume = 1.0;
      const playPromise = cachedBlupAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          playFollowChime();
        });
      }
    } catch (_) {
      playFollowChime();
    }
  }

  function syncFollowSoundUi() {
    const config = getFollowSoundConfig();
    const select = document.getElementById('followSoundSelect');
    const dropdownSelect = document.getElementById('dropdownSoundSelect');
    const uploadRow = document.getElementById('customSoundUploadRow');
    const chosenNameSpan = document.getElementById('chosenSoundFileName');
    const currentSoundBadge = document.getElementById('currentSoundBadge');
    const dropdownSoundBadge = document.getElementById('dropdownSoundBadge');

    if (select) select.value = config.type;
    if (dropdownSelect) dropdownSelect.value = config.type;

    if (uploadRow) {
      if (config.type === 'custom') {
        uploadRow.classList.remove('hidden');
      } else {
        uploadRow.classList.add('hidden');
      }
    }

    let badgeText = 'BLUP (DEFAULT)';
    if (config.type === 'crystal') badgeText = 'CRYSTAL';
    else if (config.type === 'pop') badgeText = 'BUBBLE POP';
    else if (config.type === 'custom') {
      badgeText = config.customName ? config.customName.toUpperCase().slice(0, 16) : 'CUSTOM FILE';
    }

    if (currentSoundBadge) currentSoundBadge.textContent = badgeText;
    if (dropdownSoundBadge) dropdownSoundBadge.textContent = badgeText;
    if (chosenNameSpan) {
      chosenNameSpan.textContent = config.customName ? config.customName : 'CHOOSE AUDIO FILE (.MP3 / .WAV)';
    }
  }

  function setupFollowSoundControls() {
    const select = document.getElementById('followSoundSelect');
    const dropdownSelect = document.getElementById('dropdownSoundSelect');
    const customSoundFileInput = document.getElementById('customSoundFileInput');
    const chooseSoundFileBtn = document.getElementById('chooseSoundFileBtn');
    const testFollowSoundBtn = document.getElementById('testFollowSoundBtn');
    const resetFollowSoundBtn = document.getElementById('resetFollowSoundBtn');

    function handleTypeChange(val) {
      localStorage.setItem('purplez_follow_sound_type', val);
      syncFollowSoundUi();
      if (val === 'custom') {
        const config = getFollowSoundConfig();
        if (!config.customData && customSoundFileInput) {
          customSoundFileInput.click();
        } else {
          playFollowNotificationSound();
        }
      } else {
        playFollowNotificationSound();
      }
    }

    if (select) {
      select.addEventListener('change', () => handleTypeChange(select.value));
    }
    if (dropdownSelect) {
      dropdownSelect.addEventListener('change', () => handleTypeChange(dropdownSelect.value));
    }
    if (chooseSoundFileBtn && customSoundFileInput) {
      chooseSoundFileBtn.addEventListener('click', () => customSoundFileInput.click());
    }
    if (customSoundFileInput) {
      customSoundFileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        // Size guard: 5MB maximum
        if (file.size > 5 * 1024 * 1024) {
          alert('Audio file is too large. Please select a sound file under 5MB.');
          return;
        }

        const reader = new FileReader();
        reader.onload = function(evt) {
          try {
            const dataUrl = evt.target.result;
            localStorage.setItem('purplez_follow_sound_type', 'custom');
            localStorage.setItem('purplez_follow_sound_custom_data', dataUrl);
            localStorage.setItem('purplez_follow_sound_custom_name', file.name);
            syncFollowSoundUi();
            playFollowNotificationSound();
          } catch (err) {
            console.error('Failed to save custom audio:', err);
            alert('Failed to save audio file into app storage.');
          }
        };
        reader.readAsDataURL(file);
      });
    }
    if (testFollowSoundBtn) {
      testFollowSoundBtn.addEventListener('click', () => {
        playFollowNotificationSound();
      });
    }
    if (resetFollowSoundBtn) {
      resetFollowSoundBtn.addEventListener('click', () => {
        localStorage.setItem('purplez_follow_sound_type', 'blup');
        localStorage.removeItem('purplez_follow_sound_custom_data');
        localStorage.removeItem('purplez_follow_sound_custom_name');
        if (customSoundFileInput) customSoundFileInput.value = '';
        syncFollowSoundUi();
        playFollowNotificationSound();
      });
    }

    syncFollowSoundUi();
  }

  // Initialize sound settings after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupFollowSoundControls);
  } else {
    setupFollowSoundControls();
  }

  function triggerFollowAlert(followerName, nickname, avatarUrl) {
    const cleanUser = (followerName || nickname || 'Viewer').replace(/^@+/, '').trim();
    if (!cleanUser) return;

    // 1. Play follower notification sound (Default blup.mp3 or streamer-selected sound)
    playFollowNotificationSound();

    // 2. Physical haptic vibration
    if (window.AndroidNative) {
      if (typeof window.AndroidNative.triggerHapticFeedback === 'function') {
        window.AndroidNative.triggerHapticFeedback(120);
      } else if (typeof window.AndroidNative.vibrate === 'function') {
        window.AndroidNative.vibrate(120);
      }
    }

    // 3. Primary Follower Notification: Native System Floating Pill outside chat window
    if (window.AndroidNative && typeof window.AndroidNative.showNativeFollowerAlert === 'function') {
      window.AndroidNative.showNativeFollowerAlert(cleanUser);
    }

    // 4. Update mini-ticker for landscape/minimized HUD
    if (window.AndroidNative && typeof window.AndroidNative.updateLatestChat === 'function') {
      window.AndroidNative.updateLatestChat(cleanUser, 'Started following the streamer!', 'FOLLOWER', new Date().toLocaleTimeString(), false);
    }
  }
  window.triggerFollowAlert = triggerFollowAlert;

  function updateTotalGiftsDisplay() {
    if (!totalGiftsValue) return;
    if (totalGiftCoins >= 1000) {
      totalGiftsValue.textContent = `${(totalGiftCoins / 1000).toFixed(1)}K`;
    } else {
      totalGiftsValue.textContent = totalGiftCoins;
    }
  }

  // ==========================================
  // TAB SWITCHING (GIFTER vs ALL VIEWERS)
  // ==========================================
  function switchToGifterTab() {
    activeTab = 'gifter';
    if (tabGifter) {
      tabGifter.className = 'tab-btn flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold transition-all bg-white text-black shadow-sm cursor-pointer';
    }
    if (tabRegular) {
      tabRegular.className = 'tab-btn flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold transition-all text-zinc-400 cursor-pointer';
    }
    renderChatMessages();
  }

  function switchToRegularTab() {
    activeTab = 'regular';
    if (tabRegular) {
      tabRegular.className = 'tab-btn flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold transition-all bg-white text-black shadow-sm cursor-pointer';
    }
    if (tabGifter) {
      tabGifter.className = 'tab-btn flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold transition-all text-zinc-400 cursor-pointer';
    }
    renderChatMessages();
  }

  if (tabGifter) tabGifter.addEventListener('click', switchToGifterTab);
  if (tabRegular) tabRegular.addEventListener('click', switchToRegularTab);

  // Horizontal touch swipe gesture between tabs on mobile
  let touchStartX = 0;
  let touchStartY = 0;
  if (chatContainer) {
    chatContainer.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches[0]) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    chatContainer.addEventListener('touchend', (e) => {
      if (e.changedTouches && e.changedTouches[0]) {
        const diffX = e.changedTouches[0].clientX - touchStartX;
        const diffY = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(diffX) > 60 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
          if (diffX < 0 && activeTab === 'gifter') {
            switchToRegularTab();
            showToast('Switched to All');
          } else if (diffX > 0 && activeTab === 'regular') {
            switchToGifterTab();
            showToast('Switched to Gifter');
          }
        }
      }
    }, { passive: true });
  }

  // ==========================================
  // HIDE CHAT ON LOGO CLICK & SHOW MINI DOCK
  // ==========================================
  window.toggleChatVisibility = function() {
    if (isOverlayMode) return;
    isWindowHidden = !isWindowHidden;
    if (isWindowHidden) {
      if (floatingWindow) floatingWindow.classList.add('hidden');
      if (miniDock) {
        if (!isSimAtEdge) {
          miniDock.classList.remove('hidden');
        } else {
          miniDock.classList.add('hidden');
        }
      }
      showToast(isSimAtEdge ? 'Chat Hidden (Mini Mode 2: Edge Mode)' : 'Chat Minimized (Mini Mode 1: Ticker Active)');
    } else {
      if (floatingWindow) floatingWindow.classList.remove('hidden');
      if (miniDock) miniDock.classList.add('hidden');
      showToast('Chat Window Restored');
      if (floatingWindow) {
        const rect = floatingWindow.getBoundingClientRect();
        setWindowPosition(rect.left, rect.top);
      }
    }
  };

  if (expandChatFromMiniBtn) expandChatFromMiniBtn.addEventListener('click', window.toggleChatVisibility);

  // Clear Highlight
  if (clearHighlightBtn) {
    clearHighlightBtn.addEventListener('click', () => {
      highlightedMessageId = null;
      if (selectedStatusText) {
        selectedStatusText.textContent = 'No message selected';
        selectedStatusText.classList.remove('text-white', 'underline');
        selectedStatusText.classList.add('text-zinc-400');
      }
      updateHighlightDOM(null);

      const distFromBottom = chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight;
      if (distFromBottom <= 35) {
        isAutoScrollPaused = false;
        pausedUnreadCount = 0;
      }
      updateAutoScrollResumeBtn();
      showToast('Highlight Cleared');
    });
  }

  // Window Size Presets
  function setWindowDimensions(w, h, activeBtn) {
    const maxW = Math.max(200, Math.floor(window.innerWidth - 16));
    const maxH = Math.max(140, Math.floor(window.innerHeight - 56));
    const clampedW = Math.min(w, maxW);
    const clampedH = Math.min(h, maxH);

    if (floatingWindow && !isOverlayMode) {
      floatingWindow.style.width = `${clampedW}px`;
      floatingWindow.style.height = `${clampedH}px`;
      const rect = floatingWindow.getBoundingClientRect();
      setWindowPosition(rect.left, rect.top);
    }
    if (window.AndroidNative && window.AndroidNative.setOverlayWindowSize) {
      window.AndroidNative.setOverlayWindowSize(clampedW, clampedH);
    }
    updateSizeButtonStates(activeBtn);
  }

  if (sizeCompactBtn) {
    sizeCompactBtn.addEventListener('click', () => setWindowDimensions(280, 190, sizeCompactBtn));
  }
  if (sizeDefaultBtn) {
    sizeDefaultBtn.addEventListener('click', () => setWindowDimensions(330, 230, sizeDefaultBtn));
  }
  if (sizeLargeBtn) {
    sizeLargeBtn.addEventListener('click', () => setWindowDimensions(380, 260, sizeLargeBtn));
  }

  function updateSizeButtonStates(activeBtn) {
    [sizeCompactBtn, sizeDefaultBtn, sizeLargeBtn].forEach(b => {
      if (b) b.className = 'py-1 text-xs font-mono rounded bg-zinc-900 text-zinc-400 border border-zinc-800 cursor-pointer';
    });
    if (activeBtn) {
      activeBtn.className = 'py-1 text-xs font-mono rounded bg-white text-black font-bold border border-white cursor-pointer';
    }
  }

  // ==========================================
  // TYPOGRAPHY SCALING & LIVE VIEWER COUNT
  // ==========================================
  function applyFontSize(size) {
    const validSizes = ['compact', 'normal', 'medium'];
    const chosen = validSizes.includes(size) ? size : 'compact';
    if (floatingWindow) {
      floatingWindow.classList.remove('font-compact', 'font-normal', 'font-medium');
      floatingWindow.classList.add(`font-${chosen}`);
    }
    const simFontSizeDisplay = document.getElementById('simFontSizeDisplay');
    if (simFontSizeDisplay) {
      simFontSizeDisplay.textContent = chosen.toUpperCase();
    }
    document.querySelectorAll('.sim-font-btn').forEach(btn => {
      if (btn.getAttribute('data-size') === chosen) {
        btn.classList.add('bg-white', 'text-black');
        btn.classList.remove('bg-zinc-800', 'text-zinc-400');
      } else {
        btn.classList.remove('bg-white', 'text-black');
        btn.classList.add('bg-zinc-800', 'text-zinc-400');
      }
    });
    try {
      localStorage.setItem('purplez_font_size', chosen);
    } catch (_) {}
  }

  window.updateLiveViewerCount = function(count, formatted) {
    const numeric = typeof count === 'number' ? count : parseInt(count, 10) || 0;
    const formattedStr = formatted || Number(numeric).toLocaleString();
    const overlayLiveViewerCount = document.getElementById('overlayLiveViewerCount');
    if (overlayLiveViewerCount) {
      overlayLiveViewerCount.textContent = formattedStr;
    }
    const previewViewerCount = document.getElementById('previewViewerCount');
    if (previewViewerCount) {
      previewViewerCount.textContent = `${formattedStr} viewers`;
    }
  };

  function formatCompactLikes(num) {
    const n = typeof num === 'number' ? Math.max(0, num) : Math.max(0, parseInt(num, 10) || 0);
    if (n >= 1000000) {
      const v = (n / 1000000).toFixed(1);
      return v.endsWith('.0') ? `${Math.floor(n / 1000000)}M` : `${v}M`;
    }
    if (n >= 1000) {
      const v = (n / 1000).toFixed(1);
      return v.endsWith('.0') ? `${Math.floor(n / 1000)}K` : `${v}K`;
    }
    return String(n);
  }

  window.updateLiveLikeCount = function(totalLikes, count) {
    let numeric = typeof totalLikes === 'number' ? totalLikes : parseInt(totalLikes, 10);
    const inc = typeof count === 'number' ? count : parseInt(count, 10);

    if (numeric === 0 && (inc === 0 || isNaN(inc))) {
      liveCumulativeLikes = 0;
      numeric = 0;
    } else if (isNaN(numeric) || numeric <= 0) {
      const step = !isNaN(inc) && inc > 0 ? inc : 1;
      liveCumulativeLikes += step;
      numeric = liveCumulativeLikes;
    } else {
      liveCumulativeLikes = numeric;
    }

    const formattedStr = formatCompactLikes(numeric);
    const overlayLiveLikeCount = document.getElementById('overlayLiveLikeCount');
    if (overlayLiveLikeCount) {
      overlayLiveLikeCount.textContent = formattedStr;
    }
    const previewLikeCount = document.getElementById('previewLikeCount');
    if (previewLikeCount) {
      previewLikeCount.textContent = `${formattedStr} likes`;
    }
  };

  // Draggable & Edge-Snapping Logo Bubble in Simulator (Mini Mode 1 & Mini Mode 2)
  function setupLogoToggleDrag() {
    if (!logoToggleBtn) return;
    let isDragging = false;
    let hasMoved = false;
    let startX = 0;
    let startY = 0;
    let initLeft = 0;
    let initTop = 0;

    logoToggleBtn.addEventListener('pointerdown', (e) => {
      if (inAppPreviewView && inAppPreviewView.classList.contains('hidden')) return;
      isDragging = true;
      hasMoved = false;
      startX = e.clientX;
      startY = e.clientY;
      const rect = logoToggleBtn.getBoundingClientRect();
      initLeft = rect.left;
      initTop = rect.top;
      try { logoToggleBtn.setPointerCapture(e.pointerId); } catch (_) {}
    });

    window.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.hypot(dx, dy) > 8) {
        hasMoved = true;
      }
      if (!hasMoved) return;

      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const newLeft = Math.max(0, Math.min(screenWidth - 44, initLeft + dx));
      const newTop = Math.max(0, Math.min(screenHeight - 44, initTop + dy));

      logoToggleBtn.style.position = 'fixed';
      logoToggleBtn.style.left = `${newLeft}px`;
      logoToggleBtn.style.top = `${newTop}px`;
      logoToggleBtn.style.zIndex = '50';

      if (miniDock) {
        miniDock.style.position = 'fixed';
        miniDock.style.left = `${newLeft}px`;
        miniDock.style.top = `${newTop + 44}px`;
        miniDock.style.zIndex = '49';
      }

      // Edge proximity detection for Mini Mode 2 (left, right, top edges)
      const edgeThreshold = 32;
      const nearLeft = newLeft <= edgeThreshold;
      const nearRight = newLeft >= (screenWidth - 44 - edgeThreshold);
      const nearTop = newTop <= edgeThreshold;
      const edgeMode = (nearLeft || nearRight || nearTop);

      if (edgeMode !== isSimAtEdge) {
        isSimAtEdge = edgeMode;
        if (isWindowHidden && miniDock) {
          if (isSimAtEdge) {
            miniDock.classList.add('hidden');
          } else {
            miniDock.classList.remove('hidden');
          }
        }
      }
    });

    const onLogoDragEnd = (e) => {
      if (!isDragging) return;
      isDragging = false;
      try { logoToggleBtn.releasePointerCapture(e.pointerId); } catch (_) {}

      if (!hasMoved) return;

      const rect = logoToggleBtn.getBoundingClientRect();
      const edgeThreshold = 32;
      const screenWidth = window.innerWidth;
      const nearLeft = rect.left <= edgeThreshold;
      const nearRight = rect.left >= (screenWidth - 44 - edgeThreshold);
      const nearTop = rect.top <= edgeThreshold;

      let finalLeft = rect.left;
      let finalTop = rect.top;

      if (nearLeft) {
        finalLeft = 8;
        isSimAtEdge = true;
      } else if (nearRight) {
        finalLeft = screenWidth - 44 - 8;
        isSimAtEdge = true;
      } else if (nearTop) {
        finalTop = 8;
        isSimAtEdge = true;
      } else {
        isSimAtEdge = false;
      }

      logoToggleBtn.style.left = `${finalLeft}px`;
      logoToggleBtn.style.top = `${finalTop}px`;
      if (miniDock) {
        miniDock.style.left = `${finalLeft}px`;
        miniDock.style.top = `${finalTop + 44}px`;
      }

      if (isWindowHidden && miniDock) {
        if (isSimAtEdge) {
          miniDock.classList.add('hidden');
          showToast('Mini Mode 2 (Edge Mode: Hidden)');
        } else {
          miniDock.classList.remove('hidden');
          showToast('Mini Mode 1 (Ticker Active)');
        }
      }
    };

    window.addEventListener('pointerup', onLogoDragEnd);
    window.addEventListener('pointercancel', onLogoDragEnd);

    logoToggleBtn.addEventListener('click', (e) => {
      if (hasMoved) {
        e.stopPropagation();
        e.preventDefault();
        hasMoved = false;
        return;
      }
      window.toggleChatVisibility();
    });
  }

  // Real-Time Simulator Dock Controls
  function setupOverlaySimulatorControls() {
    const openOverlaySimulatorBtn = document.getElementById('openOverlaySimulatorBtn');
    if (openOverlaySimulatorBtn) {
      openOverlaySimulatorBtn.addEventListener('click', () => {
        showInAppPreview('navViewSettings');
      });
    }

    const simulatorDoneBtn = document.getElementById('simulatorDoneBtn');
    if (simulatorDoneBtn) {
      simulatorDoneBtn.addEventListener('click', () => {
        showControlCenter();
      });
    }

    const simOpacitySlider = document.getElementById('simOpacitySlider');
    if (simOpacitySlider) {
      simOpacitySlider.addEventListener('input', (e) => {
        applyOpacity(e.target.value);
      });
    }

    document.querySelectorAll('.sim-font-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const s = btn.getAttribute('data-size');
        if (s) applyFontSize(s);
      });
    });

    const simTestChatBtn = document.getElementById('simTestChatBtn');
    if (simTestChatBtn) {
      simTestChatBtn.addEventListener('click', () => {
        window.addChatMessage('AkiStreamer', 'VIEWER', 'Testing compact chat overlay!', false, null, 0);
      });
    }

    const simTestGiftBtn = document.getElementById('simTestGiftBtn');
    if (simTestGiftBtn) {
      simTestGiftBtn.addEventListener('click', () => {
        window.addChatMessage('StarSupporter', 'VIP', 'Sent Rose x1! (1 Coins)', true, 'Rose', 1);
      });
    }
  }

  // Live Stream Real-Time Chat Injection (Real events from TikTok Live)
  window.addChatMessage = function(user, badge, text, isGifter, gift, coins) {
    const timestamp = new Date().toLocaleTimeString();
    const cleanUser = (user || 'Viewer').replace(/^@+/, '');
    const cleanBadge = badge || (isGifter ? 'Gifter' : 'Viewer');
    const msgCoins = parseInt(coins || 0, 10) || 0;

    const msg = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      user: cleanUser,
      badge: cleanBadge,
      text: text || '',
      gift: gift || null,
      coins: msgCoins,
      isGifter: isGifter || msgCoins > 0 || !!gift,
      isSuperGifter: msgCoins >= 10000,
      time: timestamp,
      _addedAt: Date.now()
    };

    // Every stream comment is visible in ALL VIEWERS tab
    regularChats.push(msg);
    if (regularChats.length > 500) regularChats.shift();

    // Gifters and super fans are also tracked in GIFTER CHAT tab
    if (msg.isGifter) {
      gifterChats.push(msg);
      if (gifterChats.length > 500) gifterChats.shift();
      if (gift) {
        triggerGiftAlert(cleanUser, gift, msgCoins);
        sessionGiftList.unshift({
          id: msg.id,
          user: cleanUser,
          giftName: gift,
          count: 1,
          coins: msgCoins,
          time: timestamp
        });
        if (sessionGiftList.length > 300) sessionGiftList.pop();
        if (giftListTotalCount) {
          giftListTotalCount.textContent = `${sessionGiftList.length} gifts`;
        }
        if (giftListModal && !giftListModal.classList.contains('hidden')) {
          renderGiftListEntries();
        }
      }
    }

    if (gifterCountBadge) gifterCountBadge.textContent = gifterChats.length;
    if (regularCountBadge) {
      regularCountBadge.textContent = regularChats.length > 50 ? `${(regularChats.length / 1000).toFixed(1)}k` : regularChats.length;
    }

    appendChatRowToDOM(msg);
    updateMiniTicker();
  };

  // Glowing White Particle Background Engine
  function initParticleCanvas() {
    try {
      const canvas = document.getElementById('particleCanvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let width = 0;
      let height = 0;
      let particles = [];
      let animId = null;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      }

      function createParticle(randomY = true) {
        return {
          x: Math.random() * width,
          y: randomY ? Math.random() * height : height + Math.random() * 20,
          radius: Math.random() * 1.0 + 0.8,
          vx: (Math.random() - 0.5) * 0.3,
          vy: -Math.random() * 0.4 - 0.15,
          baseAlpha: Math.random() * 0.45 + 0.4,
          pulseSpeed: Math.random() * 0.02 + 0.01,
          pulseOffset: Math.random() * Math.PI * 2
        };
      }

      function initParticles() {
        resize();
        particles = [];
        const count = Math.max(35, Math.min(60, Math.floor((width * height) / 16000)));
        for (let i = 0; i < count; i++) {
          particles.push(createParticle(true));
        }
      }

      let tick = 0;
      function render() {
        if (document.body.classList.contains('overlay-mode') || document.visibilityState === 'hidden') {
          animId = requestAnimationFrame(render);
          return;
        }

        ctx.clearRect(0, 0, width, height);
        tick += 1;

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
          if (p.y < -15) {
            particles[i] = createParticle(false);
            continue;
          }

          const currentAlpha = p.baseAlpha + Math.sin(tick * p.pulseSpeed + p.pulseOffset) * 0.25;
          const clampedAlpha = Math.max(0.2, Math.min(0.95, currentAlpha));

          ctx.save();
          ctx.shadowBlur = 8 + p.radius * 3;
          ctx.shadowColor = `rgba(255, 255, 255, ${clampedAlpha * 0.9})`;
          ctx.fillStyle = `rgba(255, 255, 255, ${clampedAlpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        animId = requestAnimationFrame(render);
      }

      window.addEventListener('resize', resize);
      initParticles();
      render();
    } catch (_) {}
  }

  initParticleCanvas();

  // ==========================================
  // PURPLEZCHAT AUTHENTICATION & PAYWALL CONTROLLER
  // ==========================================
  const authModal = document.getElementById('authModal');
  const tabSignIn = document.getElementById('tabSignIn');
  const tabSignUp = document.getElementById('tabSignUp');
  const authEmailInput = document.getElementById('authEmailInput');
  const authPasswordInput = document.getElementById('authPasswordInput');
  const authErrorText = document.getElementById('authErrorText');
  const authSubmitBtn = document.getElementById('authSubmitBtn');

  const accountStatusPill = document.getElementById('accountStatusPill');
  const authStatusDot = document.getElementById('authStatusDot');
  const authPlanBadge = document.getElementById('authPlanBadge');
  const authRemainingTimeText = document.getElementById('authRemainingTimeText');

  const accountDetailsModal = document.getElementById('accountDetailsModal');
  const accountDetailEmail = document.getElementById('accountDetailEmail');
  const accountDetailPlan = document.getElementById('accountDetailPlan');
  const accountDetailRemaining = document.getElementById('accountDetailRemaining');
  const accountDetailDevice = document.getElementById('accountDetailDevice');
  const closeAccountModalBtn = document.getElementById('closeAccountModalBtn');
  const refreshAccountStatusBtn = document.getElementById('refreshAccountStatusBtn');
  const signOutBtn = document.getElementById('signOutBtn');

  const paywallModal = document.getElementById('paywallModal');
  const paywallSyncBtn = document.getElementById('paywallSyncBtn');

  let currentAuthMode = 'signup';
  let cachedAuthStatus = null;

  function updateAuthUI(status) {
    cachedAuthStatus = status;

    if (!status || !status.authenticated) {
      if (authPlanBadge) authPlanBadge.textContent = 'SIGN IN';
      if (authRemainingTimeText) authRemainingTimeText.textContent = '';
      if (authStatusDot) authStatusDot.className = 'w-1.5 h-1.5 rounded-full bg-zinc-600';
      if (paywallModal) paywallModal.classList.add('hidden');
      if (!isOverlayMode) {
        const hasPerm = (window.AndroidNative && typeof window.AndroidNative.isOverlayPermissionGranted === 'function')
          ? window.AndroidNative.isOverlayPermissionGranted()
          : true;
        if (!hasPerm) {
          if (floatingPermModal) floatingPermModal.classList.remove('hidden');
          if (authModal) authModal.classList.add('hidden');
        } else {
          if (floatingPermModal) floatingPermModal.classList.add('hidden');
          if (authModal) authModal.classList.remove('hidden');
        }
      }
      return;
    }

    if (authModal) authModal.classList.add('hidden');
    if (floatingPermModal) floatingPermModal.classList.add('hidden');

    // Update Status Pill
    if (authPlanBadge) authPlanBadge.textContent = status.badgeText || (status.plan ? status.plan.toUpperCase() : 'PRO');
    if (authRemainingTimeText) authRemainingTimeText.textContent = status.remainingTimeText || '';

    if (authStatusDot) {
      if (status.role === 'admin' || status.status === 'pro') {
        authStatusDot.className = 'w-1.5 h-1.5 rounded-full bg-purple-400';
      } else if (status.status === 'trial') {
        authStatusDot.className = 'w-1.5 h-1.5 rounded-full bg-blue-400';
      } else if (status.status === 'suspended') {
        authStatusDot.className = 'w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse';
      } else if (status.status === 'unverified') {
        authStatusDot.className = 'w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse';
      } else {
        authStatusDot.className = 'w-1.5 h-1.5 rounded-full bg-red-400';
      }
    }

    // Update Details Modal
    if (accountDetailEmail) accountDetailEmail.textContent = status.email || '';
    if (accountDetailPlan) accountDetailPlan.textContent = (status.status === 'suspended' ? 'SUSPENDED' : (status.status === 'unverified' ? 'UNVERIFIED' : (status.plan || 'NONE'))).toUpperCase();
    if (accountDetailRemaining) {
      accountDetailRemaining.textContent = status.status === 'suspended' ? 'Locked (Suspended)' : (status.status === 'unverified' ? 'Verify Email' : (status.remainingTimeText || 'Expired'));
      accountDetailRemaining.className = status.status === 'suspended' ? 'text-red-400 font-bold' : (status.status === 'unverified' ? 'text-amber-400 font-bold' : (status.isAccessAllowed ? 'text-blue-400 font-bold' : 'text-red-400 font-bold'));
    }
    if (accountDetailDevice) accountDetailDevice.textContent = status.boundDeviceId || 'This Device';

    // Update Settings Tab Account Card
    const settingsPlanBadge = document.getElementById('settingsPlanBadge');
    const settingsAccountEmail = document.getElementById('settingsAccountEmail');
    const settingsAccountRemaining = document.getElementById('settingsAccountRemaining');
    if (settingsPlanBadge) {
      settingsPlanBadge.textContent = (status.status === 'suspended' ? 'SUSPENDED' : (status.status === 'unverified' ? 'UNVERIFIED' : (status.badgeText || status.plan || 'NONE'))).toUpperCase();
    }
    if (settingsAccountEmail) settingsAccountEmail.textContent = status.email || 'Not signed in';
    if (settingsAccountRemaining) {
      settingsAccountRemaining.textContent = status.status === 'suspended' ? 'Suspended' : (status.status === 'unverified' ? 'Verify Email' : (status.remainingTimeText || 'Expired'));
    }

    // Update Paywall Modal text based on suspended vs unverified vs expired
    const paywallTitle = document.getElementById('paywallTitle');
    const paywallDesc = document.getElementById('paywallDesc');
    const paywallResendEmailBtn = document.getElementById('paywallResendEmailBtn');
    const paywallSubscribeBox = document.getElementById('paywallSubscribeBox');
    const paywallSignOutBtn = document.getElementById('paywallSignOutBtn');

    if (paywallSignOutBtn) {
      paywallSignOutBtn.textContent = 'CANCEL';
    }

    if (paywallTitle) {
      if (status.status === 'unverified') {
        paywallTitle.textContent = 'EMAIL VERIFICATION REQUIRED';
      } else {
        paywallTitle.textContent = status.status === 'suspended' ? 'ACCOUNT SUSPENDED' : 'ACCESS EXPIRED';
      }
    }
    if (paywallDesc) {
      if (status.status === 'suspended') {
        paywallDesc.textContent = 'This account has been suspended by the administrator. Contact admin to appeal or restore access.';
      } else if (status.status === 'unverified') {
        paywallDesc.textContent = 'A verification link was sent to ' + (status.email || 'your Gmail inbox') + '. Check your inbox and spam folder, then tap CHECK ACCESS / SYNC.';
      } else {
        paywallDesc.textContent = 'Your free trial or subscription has ended. Contact the admin to renew Weekly or Monthly access.';
      }
    }
    if (paywallSubscribeBox) {
      if (status.status === 'unverified' || status.status === 'suspended') {
        paywallSubscribeBox.classList.add('hidden');
      } else {
        paywallSubscribeBox.classList.remove('hidden');
      }
    }
    if (paywallResendEmailBtn) {
      if (status.status === 'unverified') {
        paywallResendEmailBtn.classList.remove('hidden');
        paywallResendEmailBtn.textContent = 'RESEND EMAIL';
      } else {
        paywallResendEmailBtn.classList.add('hidden');
      }
    }

    // Show Paywall if access is not allowed
    if (!status.isAccessAllowed) {
      if (isOverlayMode) {
        if (window.AndroidNative && typeof window.AndroidNative.stopFloatingOverlay === 'function') {
          window.AndroidNative.stopFloatingOverlay();
        }
      } else {
        if (paywallModal) paywallModal.classList.remove('hidden');
      }
    } else {
      if (paywallModal) paywallModal.classList.add('hidden');
    }
  }

  function setupAuthEventListeners() {
    const deviceTrialWarningBanner = document.getElementById('deviceTrialWarningBanner');
    const deviceTrialConfirmModal = document.getElementById('deviceTrialConfirmModal');
    const proceedWithoutTrialBtn = document.getElementById('proceedWithoutTrialBtn');
    const switchSignInBtn = document.getElementById('switchSignInBtn');
    const cancelTrialModalBtn = document.getElementById('cancelTrialModalBtn');

    const promptRegisterToSignIn = document.getElementById('promptRegisterToSignIn');
    const promptSignInToRegister = document.getElementById('promptSignInToRegister');
    const switchToSignInBtn = document.getElementById('switchToSignInBtn');
    const switchToSignUpBtn = document.getElementById('switchToSignUpBtn');
    const forgotPasswordContainer = document.getElementById('forgotPasswordContainer');

    let trialWarningConfirmed = false;

    const updateTrialBanner = () => {
      const isUsed = window.PurplezAuth && window.PurplezAuth.isDeviceTrialUsed();
      if (deviceTrialWarningBanner) {
        if (isUsed && currentAuthMode === 'signup') deviceTrialWarningBanner.classList.remove('hidden');
        else deviceTrialWarningBanner.classList.add('hidden');
      }
    };

    function applyAuthModeUI(mode) {
      currentAuthMode = mode;
      trialWarningConfirmed = false;
      if (authErrorText) authErrorText.classList.add('hidden');
      if (mode === 'signup') {
        if (tabSignUp) tabSignUp.className = 'flex-1 py-1.5 rounded-lg text-black bg-white transition-all cursor-pointer';
        if (tabSignIn) tabSignIn.className = 'flex-1 py-1.5 rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer';
        if (authSubmitBtn) authSubmitBtn.textContent = 'CREATE ACCOUNT';
        if (forgotPasswordContainer) forgotPasswordContainer.classList.add('hidden');
        if (promptRegisterToSignIn) promptRegisterToSignIn.classList.remove('hidden');
        if (promptSignInToRegister) promptSignInToRegister.classList.add('hidden');
        updateTrialBanner();
        if (window.PurplezAuth && typeof window.PurplezAuth.checkDeviceTrialStatus === 'function') {
          window.PurplezAuth.checkDeviceTrialStatus().then(updateTrialBanner).catch(() => {});
        }
      } else {
        if (tabSignIn) tabSignIn.className = 'flex-1 py-1.5 rounded-lg text-black bg-white transition-all cursor-pointer';
        if (tabSignUp) tabSignUp.className = 'flex-1 py-1.5 rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer';
        if (authSubmitBtn) authSubmitBtn.textContent = 'SIGN IN';
        if (forgotPasswordContainer) forgotPasswordContainer.classList.remove('hidden');
        if (promptRegisterToSignIn) promptRegisterToSignIn.classList.add('hidden');
        if (promptSignInToRegister) promptSignInToRegister.classList.remove('hidden');
        if (deviceTrialWarningBanner) deviceTrialWarningBanner.classList.add('hidden');
      }
    }

    window.applyAuthModeUI = applyAuthModeUI;

    if (tabSignIn && tabSignUp) {
      tabSignIn.addEventListener('click', () => applyAuthModeUI('signin'));
      tabSignUp.addEventListener('click', () => applyAuthModeUI('signup'));
    }

    if (switchToSignInBtn) {
      switchToSignInBtn.addEventListener('click', () => applyAuthModeUI('signin'));
    }

    if (switchToSignUpBtn) {
      switchToSignUpBtn.addEventListener('click', () => applyAuthModeUI('signup'));
    }

    applyAuthModeUI('signup');

    if (proceedWithoutTrialBtn) {
      proceedWithoutTrialBtn.addEventListener('click', () => {
        trialWarningConfirmed = true;
        if (deviceTrialConfirmModal) deviceTrialConfirmModal.classList.add('hidden');
        if (authSubmitBtn) authSubmitBtn.click();
      });
    }

    if (switchSignInBtn) {
      switchSignInBtn.addEventListener('click', () => {
        trialWarningConfirmed = false;
        if (deviceTrialConfirmModal) deviceTrialConfirmModal.classList.add('hidden');
        applyAuthModeUI('signin');
      });
    }

    if (cancelTrialModalBtn) {
      cancelTrialModalBtn.addEventListener('click', () => {
        trialWarningConfirmed = false;
        if (deviceTrialConfirmModal) deviceTrialConfirmModal.classList.add('hidden');
      });
    }

    const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
    const backToSignInBtn = document.getElementById('backToSignInBtn');
    const sendResetBtn = document.getElementById('sendResetBtn');
    const forgotPasswordView = document.getElementById('forgotPasswordView');
    const forgotEmailInput = document.getElementById('forgotEmailInput');
    const forgotErrorText = document.getElementById('forgotErrorText');
    const forgotSuccessText = document.getElementById('forgotSuccessText');
    const authSubmitContainer = document.getElementById('authSubmitContainer');

    if (forgotPasswordBtn && forgotPasswordView) {
      forgotPasswordBtn.addEventListener('click', () => {
        forgotPasswordView.classList.remove('hidden');
        if (authSubmitContainer) authSubmitContainer.classList.add('hidden');
        if (authErrorText) authErrorText.classList.add('hidden');
        if (forgotErrorText) forgotErrorText.classList.add('hidden');
        if (forgotSuccessText) forgotSuccessText.classList.add('hidden');
        if (forgotEmailInput && authEmailInput) forgotEmailInput.value = authEmailInput.value;
      });
    }

    if (backToSignInBtn && forgotPasswordView) {
      backToSignInBtn.addEventListener('click', () => {
        forgotPasswordView.classList.add('hidden');
        if (authSubmitContainer) authSubmitContainer.classList.remove('hidden');
      });
    }

    if (sendResetBtn) {
      sendResetBtn.addEventListener('click', async () => {
        const email = (forgotEmailInput ? forgotEmailInput.value : '').trim();
        if (forgotErrorText) forgotErrorText.classList.add('hidden');
        if (forgotSuccessText) forgotSuccessText.classList.add('hidden');

        if (!window.PurplezAuth || !window.PurplezAuth.isValidGmail(email)) {
          if (forgotErrorText) {
            forgotErrorText.textContent = 'Please enter a valid Gmail address (@gmail.com).';
            forgotErrorText.classList.remove('hidden');
          }
          return;
        }

        sendResetBtn.disabled = true;
        sendResetBtn.textContent = 'SENDING...';

        try {
          const res = await window.PurplezAuth.sendPasswordReset(email);
          if (forgotSuccessText) {
            forgotSuccessText.textContent = res.message || 'Password reset link sent to your Gmail inbox.';
            forgotSuccessText.classList.remove('hidden');
          }
          showToast('Reset email sent! Check your inbox.');
        } catch (err) {
          if (forgotErrorText) {
            forgotErrorText.textContent = err.message || 'Failed to send password reset email.';
            forgotErrorText.classList.remove('hidden');
          }
        } finally {
          sendResetBtn.disabled = false;
          sendResetBtn.textContent = 'SEND PASSWORD RESET LINK';
        }
      });
    }

    if (authSubmitBtn) {
      authSubmitBtn.addEventListener('click', async () => {
        const email = (authEmailInput ? authEmailInput.value : '').trim();
        const pass = (authPasswordInput ? authPasswordInput.value : '').trim();

        if (authErrorText) authErrorText.classList.add('hidden');

        if (!window.PurplezAuth || !window.PurplezAuth.isValidGmail(email)) {
          if (authErrorText) {
            authErrorText.textContent = 'Please enter a valid Gmail address (@gmail.com).';
            authErrorText.classList.remove('hidden');
          }
          return;
        }

        if (!pass || pass.length < 6) {
          if (authErrorText) {
            authErrorText.textContent = 'Password must be at least 6 characters.';
            authErrorText.classList.remove('hidden');
          }
          return;
        }

        // Intercept registration if device trial was already consumed and user has not confirmed modal
        if (currentAuthMode === 'signup') {
          const isTrialUsed = window.PurplezAuth && window.PurplezAuth.isDeviceTrialUsed();
          if (isTrialUsed && !trialWarningConfirmed) {
            if (deviceTrialConfirmModal) deviceTrialConfirmModal.classList.remove('hidden');
            return;
          }
        }

        authSubmitBtn.disabled = true;
        authSubmitBtn.textContent = 'CONNECTING...';

        try {
          let status;
          if (currentAuthMode === 'signup') {
            status = await window.PurplezAuth.register(email, pass);
            trialWarningConfirmed = false;
            if (status.status === 'unverified') {
              showToast('Account created! Verification link sent to ' + email);
            } else if (status.status === 'expired') {
              showToast('Account created. Device trial previously consumed (0 days). Upgrade to PRO.');
            } else {
              showToast('Account created! 48h Free Trial activated.');
            }
          } else {
            status = await window.PurplezAuth.login(email, pass);
            try {
              const fresh = await window.PurplezAuth.refreshStatus();
              if (fresh && fresh.authenticated) status = fresh;
            } catch (_) {}
            showToast('Signed in successfully.');
          }
          cachedAuthStatus = status;
          updateAuthUI(status);
        } catch (err) {
          trialWarningConfirmed = false;
          if (authErrorText) {
            authErrorText.textContent = err.message || 'Authentication failed.';
            authErrorText.classList.remove('hidden');
          }
        } finally {
          authSubmitBtn.disabled = false;
          authSubmitBtn.textContent = currentAuthMode === 'signup' ? 'CREATE ACCOUNT' : 'SIGN IN';
        }
      });
    }

    if (accountStatusPill) {
      accountStatusPill.addEventListener('click', () => {
        if (!cachedAuthStatus || !cachedAuthStatus.authenticated) {
          if (authModal) authModal.classList.remove('hidden');
        } else {
          // Immediately refresh local countdown calculation and open modal
          updateAuthUI(window.PurplezAuth ? window.PurplezAuth.getCurrentStatus() : cachedAuthStatus);
          if (accountDetailsModal) accountDetailsModal.classList.remove('hidden');

          // Auto-sync in background so fresh days/hours and admin updates appear without pressing SYNC STATUS
          if (window.PurplezAuth) {
            if (refreshAccountStatusBtn) {
              refreshAccountStatusBtn.textContent = 'SYNCING...';
              refreshAccountStatusBtn.disabled = true;
            }
            window.PurplezAuth.refreshStatus()
              .then(fresh => {
                updateAuthUI(fresh);
              })
              .catch(() => {})
              .finally(() => {
                if (refreshAccountStatusBtn) {
                  refreshAccountStatusBtn.textContent = 'SYNC STATUS';
                  refreshAccountStatusBtn.disabled = false;
                }
              });
          }
        }
      });
    }

    if (closeAccountModalBtn) {
      closeAccountModalBtn.addEventListener('click', () => {
        if (accountDetailsModal) accountDetailsModal.classList.add('hidden');
      });
    }

    if (refreshAccountStatusBtn) {
      refreshAccountStatusBtn.addEventListener('click', async () => {
        showToast('Syncing status with server...');
        if (window.PurplezAuth) {
          const status = await window.PurplezAuth.refreshStatus();
          updateAuthUI(status);
          showToast(`Synced: ${status.badgeText} (${status.remainingTimeText})`);
        }
      });
    }

    if (signOutBtn) {
      signOutBtn.addEventListener('click', () => {
        if (window.PurplezAuth) {
          window.PurplezAuth.logout();
        }
        cachedAuthStatus = null;
        if (accountDetailsModal) accountDetailsModal.classList.add('hidden');
        if (authEmailInput) authEmailInput.value = '';
        if (authPasswordInput) authPasswordInput.value = '';
        if (authErrorText) authErrorText.classList.add('hidden');
        applyAuthModeUI('signin');
        updateAuthUI(window.PurplezAuth ? window.PurplezAuth.getCurrentStatus() : null);
        showToast('Signed out of PurplezChat');
      });
    }

    if (paywallSyncBtn) {
      paywallSyncBtn.addEventListener('click', async () => {
        paywallSyncBtn.disabled = true;
        paywallSyncBtn.textContent = 'CHECKING STATUS...';
        try {
          if (window.PurplezAuth) {
            const status = await window.PurplezAuth.refreshStatus();
            updateAuthUI(status);
            if (status.isAccessAllowed) {
              showToast('Access renewed! Welcome back.');
            } else if (status.status === 'unverified') {
              showToast('Please click the verification link in your Gmail inbox first.');
            } else {
              showToast('Account is still expired. Contact admin to renew.');
            }
          }
        } finally {
          paywallSyncBtn.disabled = false;
          paywallSyncBtn.textContent = 'CHECK ACCESS / SYNC';
        }
      });
    }

    const paywallResendEmailBtn = document.getElementById('paywallResendEmailBtn');
    if (paywallResendEmailBtn) {
      paywallResendEmailBtn.addEventListener('click', async () => {
        paywallResendEmailBtn.disabled = true;
        paywallResendEmailBtn.textContent = 'SENDING EMAIL...';
        try {
          if (window.PurplezAuth && typeof window.PurplezAuth.resendVerificationEmail === 'function') {
            const res = await window.PurplezAuth.resendVerificationEmail();
            showToast(res.message || 'Verification email resent! Check your inbox.');
          }
        } catch (err) {
          showToast(err.message || 'Failed to resend email');
        } finally {
          paywallResendEmailBtn.disabled = false;
          paywallResendEmailBtn.textContent = 'RESEND EMAIL';
        }
      });
    }

    const paywallSignOutBtn = document.getElementById('paywallSignOutBtn');
    if (paywallSignOutBtn) {
      paywallSignOutBtn.addEventListener('click', () => {
        if (window.PurplezAuth) {
          window.PurplezAuth.logout();
        }
        cachedAuthStatus = null;
        if (paywallModal) paywallModal.classList.add('hidden');
        if (authEmailInput) authEmailInput.value = '';
        if (authPasswordInput) authPasswordInput.value = '';
        if (authErrorText) authErrorText.classList.add('hidden');
        applyAuthModeUI('signin');
        updateAuthUI(window.PurplezAuth ? window.PurplezAuth.getCurrentStatus() : null);
        showToast('Cancelled');
      });
    }
  }

  // Initialize Auth
  setupAuthEventListeners();
  if (window.PurplezAuth) {
    // 1. Immediate local session render
    updateAuthUI(window.PurplezAuth.getCurrentStatus());

    // 2. Immediate startup background sync without waiting
    window.PurplezAuth.refreshStatus().then(updateAuthUI).catch(() => {});

    // 3. Real-time background sync interval (every 5 seconds) to catch admin updates without clicking
    let isSyncingStatus = false;
    const syncStatusInBackground = async () => {
      if (isSyncingStatus) return;
      isSyncingStatus = true;
      try {
        const fresh = await window.PurplezAuth.refreshStatus();
        updateAuthUI(fresh);
      } catch (_) {
      } finally {
        isSyncingStatus = false;
      }
    };
    setInterval(syncStatusInBackground, 5000);

    // 4. Fast local countdown timer every 10 seconds:
    // Keeps days/hours remaining dynamically counting down in real time and triggers paywall immediately when expired
    setInterval(() => {
      updateAuthUI(window.PurplezAuth.getCurrentStatus());
    }, 10000);
  }

  // Lifecycle resume hooks
  const handleAppResumed = () => {
    if (window.PurplezAuth) {
      updateAuthUI(window.PurplezAuth.getCurrentStatus());
      window.PurplezAuth.refreshStatus().then(updateAuthUI).catch(() => {});
    }
  };

  window.onNativeAppResumed = handleAppResumed;

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      handleAppResumed();
    }
  });

  window.addEventListener('focus', () => {
    handleAppResumed();
  });

  // Floating Bottom Navigation & Settings Handlers
  function switchNavTab(targetId) {
    const views = {
      navViewLive: document.getElementById('navViewLive'),
      navViewAlerts: document.getElementById('navViewAlerts'),
      navViewSettings: document.getElementById('navViewSettings')
    };
    if (!targetId || !views[targetId]) targetId = 'navViewLive';
    const navItems = document.querySelectorAll('.bottom-nav-item');
    navItems.forEach(b => {
      if (b.getAttribute('data-target') === targetId) {
        b.classList.add('active');
        b.classList.remove('text-zinc-400');
      } else {
        b.classList.remove('active');
        b.classList.add('text-zinc-400');
      }
    });
    Object.keys(views).forEach(vKey => {
      if (views[vKey]) {
        if (vKey === targetId) {
          views[vKey].classList.remove('hidden');
        } else {
          views[vKey].classList.add('hidden');
        }
      }
    });
  }

  function setupBottomNavigation() {
    const navItems = document.querySelectorAll('.bottom-nav-item');
    navItems.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        switchNavTab(targetId);
      });
    });

    const settingsSyncBtn = document.getElementById('settingsSyncBtn');
    if (settingsSyncBtn) {
      settingsSyncBtn.addEventListener('click', async () => {
        const origText = settingsSyncBtn.textContent;
        settingsSyncBtn.textContent = 'SYNCING...';
        try {
          if (window.PurplezAuth && typeof window.PurplezAuth.refreshStatus === 'function') {
            const fresh = await window.PurplezAuth.refreshStatus();
            updateAuthUI(fresh);
            showToast('Account status synced');
          }
        } catch (e) {
          showToast('Sync error: ' + (e.message || 'Failed'));
        } finally {
          settingsSyncBtn.textContent = origText;
        }
      });
    }

    const settingsSignOutBtn = document.getElementById('settingsSignOutBtn');
    if (settingsSignOutBtn) {
      settingsSignOutBtn.addEventListener('click', () => {
        const signOutTarget = document.getElementById('signOutBtn');
        if (signOutTarget) {
          signOutTarget.click();
        } else if (window.PurplezAuth && typeof window.PurplezAuth.logout === 'function') {
          window.PurplezAuth.logout();
          updateAuthUI(window.PurplezAuth.getCurrentStatus());
        }
      });
    }
  }

  // Initial Setup
  handleOrientationChange();
  applyFontSize(localStorage.getItem('purplez_font_size') || 'compact');
  renderChatMessages();
  setupBottomNavigation();
  setupLogoToggleDrag();
  setupOverlaySimulatorControls();
  setupViewerSearchFilter();
  if (window.AndroidNative && typeof window.AndroidNative.getLiveViewerCount === 'function') {
    const initialViewers = window.AndroidNative.getLiveViewerCount();
    if (initialViewers > 0) {
      window.updateLiveViewerCount(initialViewers);
    }
  }
  if (window.AndroidNative && typeof window.AndroidNative.getLiveLikeCount === 'function') {
    const initialLikes = window.AndroidNative.getLiveLikeCount();
    if (initialLikes > 0) {
      window.updateLiveLikeCount(initialLikes);
    }
  }
  if (!isOverlayMode) {
    setWindowPosition(16, 48);
  }

  window.extractMlbbIdOrText = extractMlbbIdOrText;
  window.applyViewerFilter = applyViewerFilter;
  window.setupViewerSearchFilter = setupViewerSearchFilter;

})();
