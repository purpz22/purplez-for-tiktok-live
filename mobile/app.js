// purplez for tiktok live - Streamer Control Center & Floating HUD Logic

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
  function showControlCenter() {
    if (isOverlayMode) return;
    if (inAppPreviewView) inAppPreviewView.classList.add('hidden');
    if (controlCenterView) controlCenterView.classList.remove('hidden');
  }

  function showInAppPreview() {
    if (controlCenterView) controlCenterView.classList.add('hidden');
    if (inAppPreviewView) inAppPreviewView.classList.remove('hidden');
    renderChatMessages();
    setWindowPosition(16, 48);
  }

  if (openPreviewBtn) openPreviewBtn.addEventListener('click', showInAppPreview);
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
      if (window.AndroidNative && typeof window.AndroidNative.reloadApp === 'function') {
        window.AndroidNative.reloadApp();
      } else {
        window.location.reload();
      }
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
  window.onOverlayStateUpdated = function(permissionGranted, serviceRunning) {
    hasOverlayPermission = !!permissionGranted;
    isOverlayRunning = !!serviceRunning;
    updateControlCenterUI();
  };

  function updateControlCenterUI() {
    // Permission Badge & Button
    if (permStatusBadge) {
      if (hasOverlayPermission) {
        permStatusBadge.textContent = 'PERMISSION GRANTED';
        permStatusBadge.className = 'text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white text-black';
        if (grantPermissionBtn) grantPermissionBtn.classList.add('hidden');
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

  if (mainLaunchOverlayBtn) {
    mainLaunchOverlayBtn.addEventListener('click', () => {
      if (isOverlayRunning) {
        if (window.AndroidNative && window.AndroidNative.stopFloatingOverlay) {
          window.AndroidNative.stopFloatingOverlay();
          isOverlayRunning = false;
          updateControlCenterUI();
        }
      } else {
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

    } catch (err) {
      console.error('[Bridge] Failed to initialize socket connection:', err);
      updateBridgeUI('ERROR', 'text-zinc-500');
    }
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
        <img src="${url}" class="w-full h-full object-cover rounded-xl" alt="Streamer" onerror="this.onerror=null; this.src='';" />
      `;
    }

    // Update Control Center App Header Logo
    const headerLogo = document.getElementById('appHeaderLogo');
    if (headerLogo) {
      headerLogo.innerHTML = `
        <img src="${url}" class="w-full h-full object-cover rounded-xl" alt="Streamer" onerror="this.onerror=null; this.src='';" />
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
        }
      }
    } catch (e) {
      console.warn('[StreamProto] Decode error:', e);
    }
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

      const dedupeKey = `chat:${displayUser}:${content}`;
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
      const dedupeKey = `gift:${user}:${giftName}:${repeatCount}:${totalCoins}`;
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
      const key = `str:${user}:${text}`;
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
    const windowWidth = floatingWindow ? floatingWindow.offsetWidth : 380;
    const windowHeight = floatingWindow ? floatingWindow.offsetHeight : 260;

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
      resizeStartWidth = floatingWindow ? floatingWindow.offsetWidth : 380;
      resizeStartHeight = floatingWindow ? floatingWindow.offsetHeight : 260;

      if (e.target.setPointerCapture && e.pointerId !== undefined) {
        try { e.target.setPointerCapture(e.pointerId); } catch (_) {}
      }
    });

    window.addEventListener('pointermove', (e) => {
      if (!isResizing || !floatingWindow) return;
      const bottomBarHeight = (bottomNavBar && !isOverlayMode) ? bottomNavBar.offsetHeight : 0;
      const maxWidth = window.innerWidth - 24;
      const maxHeight = window.innerHeight - bottomBarHeight - floatingWindow.offsetTop - 8;

      const newWidth = Math.max(260, Math.min(maxWidth, resizeStartWidth + (e.clientX - resizeStartX)));
      const newHeight = Math.max(180, Math.min(maxHeight, resizeStartHeight + (e.clientY - resizeStartY)));

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
  // ORIENTATION CHANGE & LANDSCAPE OPTIMIZATION
  // ==========================================
  window.addEventListener('resize', () => {
    handleOrientationChange();
    if (floatingWindow && !isOverlayMode) {
      const rect = floatingWindow.getBoundingClientRect();
      setWindowPosition(rect.left, rect.top);
    }
  });

  function handleOrientationChange() {
    isLandscape = window.innerWidth > window.innerHeight;
    const tag = isLandscape ? 'LANDSCAPE' : 'PORTRAIT';

    if (orientationTag) orientationTag.textContent = tag;
    if (deviceOrientationBadge) deviceOrientationBadge.textContent = tag;
    if (landscapeStatus) landscapeStatus.textContent = `${tag} HUD`;

    if (floatingWindow && isLandscape && !isOverlayMode) {
      const maxH = window.innerHeight - 56;
      if (floatingWindow.offsetHeight > maxH) {
        floatingWindow.style.height = `${Math.max(220, maxH)}px`;
      }
    }
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
      showToast('Window Position Reset');
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
            <span class="font-bold text-[9.5px] text-zinc-400 truncate">${msg.user}</span>
            ${msg.gift ? `
              <span class="gift-badge text-[8.5px] font-mono font-bold px-1 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-700 truncate shrink-0">
                ${msg.gift}
              </span>
            ` : ''}
          </div>
          <span class="text-[8.5px] font-mono text-zinc-500 shrink-0 ml-1">${msg.time}</span>
        </div>
        <div class="text-[10px] leading-tight text-zinc-400 font-normal pl-0.5 break-words mt-0.5">
          ${msg.text}
        </div>
      `;
    } else {
      row.innerHTML = `
        <div class="flex items-center justify-between gap-1 leading-tight">
          <div class="flex items-center space-x-1.5 min-w-0">
            <span class="badge px-1 py-0.2 rounded text-[8px] font-mono font-bold bg-zinc-800 text-zinc-400 border border-zinc-700 shrink-0">${msg.badge}</span>
            <span class="font-bold text-[9.5px] text-zinc-400 truncate">${msg.user}</span>
          </div>
          <span class="text-[8.5px] font-mono text-zinc-500 shrink-0 ml-1">${msg.time}</span>
        </div>
        <div class="text-[10px] leading-tight text-zinc-400 pl-0.5 break-words mt-0.5">
          ${msg.text}
        </div>
      `;
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

    while (chatContainer.children.length > 150) {
      chatContainer.removeChild(chatContainer.firstElementChild);
    }

    if (!isAutoScrollPaused) {
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

    if (!isAutoScrollPaused) {
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

  if (autoScrollResumeBtn) {
    autoScrollResumeBtn.addEventListener('click', () => {
      isAutoScrollPaused = false;
      pausedUnreadCount = 0;
      highlightedMessageId = null;
      updateHighlightDOM(null);
      updateAutoScrollResumeBtn();
      chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
      showToast('Resumed Auto-Scroll');
    });
  }

  if (chatContainer) {
    chatContainer.addEventListener('scroll', () => {
      const distFromBottom = chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight;
      if (distFromBottom > 35) {
        if (!isAutoScrollPaused) {
          isAutoScrollPaused = true;
          updateAutoScrollResumeBtn();
        }
      } else {
        if (isAutoScrollPaused && !highlightedMessageId) {
          isAutoScrollPaused = false;
          pausedUnreadCount = 0;
          updateAutoScrollResumeBtn();
        }
      }
    });
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
      if (distFromBottom <= 35) {
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

    const copyPayload = msg.text;

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

    showToast('Chat message copied to clipboard');

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
      if (miniDock) miniDock.classList.remove('hidden');
      showToast('Chat Window Hidden (Docked at logo)');
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

  if (logoToggleBtn) logoToggleBtn.addEventListener('click', window.toggleChatVisibility);
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
    if (floatingWindow && !isOverlayMode) {
      floatingWindow.style.width = `${w}px`;
      floatingWindow.style.height = `${h}px`;
      const rect = floatingWindow.getBoundingClientRect();
      setWindowPosition(rect.left, rect.top);
    }
    if (window.AndroidNative && window.AndroidNative.setOverlayWindowSize) {
      window.AndroidNative.setOverlayWindowSize(w, h);
    }
    updateSizeButtonStates(activeBtn);
  }

  if (sizeCompactBtn) {
    sizeCompactBtn.addEventListener('click', () => setWindowDimensions(320, 210, sizeCompactBtn));
  }
  if (sizeDefaultBtn) {
    sizeDefaultBtn.addEventListener('click', () => setWindowDimensions(380, 260, sizeDefaultBtn));
  }
  if (sizeLargeBtn) {
    sizeLargeBtn.addEventListener('click', () => setWindowDimensions(460, 300, sizeLargeBtn));
  }

  function updateSizeButtonStates(activeBtn) {
    [sizeCompactBtn, sizeDefaultBtn, sizeLargeBtn].forEach(b => {
      if (b) b.className = 'py-1 text-xs font-mono rounded bg-zinc-900 text-zinc-400 border border-zinc-800 cursor-pointer';
    });
    if (activeBtn) {
      activeBtn.className = 'py-1 text-xs font-mono rounded bg-white text-black font-bold border border-white cursor-pointer';
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
      time: timestamp
    };

    // Every stream comment is visible in ALL VIEWERS tab
    regularChats.push(msg);
    if (regularChats.length > 200) regularChats.shift();

    // Gifters and super fans are also tracked in GIFTER CHAT tab
    if (msg.isGifter) {
      gifterChats.push(msg);
      if (gifterChats.length > 100) gifterChats.shift();
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

  // Initial Setup
  handleOrientationChange();
  renderChatMessages();
  if (!isOverlayMode) {
    setWindowPosition(16, 48);
  }

})();
