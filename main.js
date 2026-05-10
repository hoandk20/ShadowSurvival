import BootScene from './scenes/BootScene.js';
import MainMenuScene from './scenes/MainMenuScene.js';
import MainScene from './scenes/MainScene.js';
import HudScene from './scenes/HudScene.js';
import PauseMenuScene from './scenes/PauseMenuScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import VictoryScene from './scenes/VictoryScene.js';

const DEBUG_MENU_UNLOCK_STORAGE_KEY = 'rps_debug_menu_unlocked';
const DEBUG_MENU_UNLOCK_CODE = 'RPS_DEBUG_2026';

function isMobileDevice() {
    return /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(navigator.userAgent ?? '');
}

function getRenderResolution() {
    const rawDpr = Number(globalThis?.devicePixelRatio ?? 1);
    if (!Number.isFinite(rawDpr) || rawDpr <= 0) return 1;
    // Keep the game crisp on HiDPI screens without blowing up fill-rate on very high DPR devices.
    return Math.min(rawDpr, 3);
}

function isDebugMenuUnlocked() {
    if (globalThis.__RPS_DEBUG_MENU_UNLOCKED__ === true) return true;
    try {
        return globalThis.localStorage?.getItem(DEBUG_MENU_UNLOCK_STORAGE_KEY) === '1';
    } catch (_error) {
        return false;
    }
}

function setDebugMenuUnlocked(enabled) {
    const nextEnabled = enabled === true;
    globalThis.__RPS_DEBUG_MENU_UNLOCKED__ = nextEnabled;
    try {
        if (nextEnabled) {
            globalThis.localStorage?.setItem(DEBUG_MENU_UNLOCK_STORAGE_KEY, '1');
        } else {
            globalThis.localStorage?.removeItem(DEBUG_MENU_UNLOCK_STORAGE_KEY);
        }
    } catch (_error) {
        // Ignore storage failures.
    }
    globalThis.dispatchEvent?.(new CustomEvent('rps-debug-menu-changed', {
        detail: { enabled: nextEnabled }
    }));
    return nextEnabled;
}

function installConsoleDebugMenuAccess() {
    const variant = String(globalThis?.__APP_BUILD_VARIANT__ ?? '').toLowerCase();
    if (variant === 'release') {
        globalThis.__RPS_DEBUG_MENU_UNLOCKED__ = false;
        try {
            globalThis.localStorage?.removeItem(DEBUG_MENU_UNLOCK_STORAGE_KEY);
        } catch (_error) {
            // Ignore storage failures.
        }
        delete globalThis.rpsUnlockDebugMenu;
        delete globalThis.rpsLockDebugMenu;
        delete globalThis.rpsIsDebugMenuUnlocked;
        return;
    }

    globalThis.__RPS_DEBUG_MENU_UNLOCKED__ = isDebugMenuUnlocked();
    globalThis.rpsUnlockDebugMenu = (code) => {
        const normalizedCode = String(code ?? '').trim();
        if (normalizedCode !== DEBUG_MENU_UNLOCK_CODE) {
            console.warn('Invalid debug code.');
            return false;
        }
        setDebugMenuUnlocked(true);
        console.info('Debug menu unlocked. Return to the main menu if needed.');
        return true;
    };
    globalThis.rpsLockDebugMenu = () => {
        setDebugMenuUnlocked(false);
        console.info('Debug menu locked.');
        return true;
    };
    globalThis.rpsIsDebugMenuUnlocked = () => isDebugMenuUnlocked();
    console.info(`Console debug hook ready: rpsUnlockDebugMenu('${DEBUG_MENU_UNLOCK_CODE}')`);
}

function ensureFatalErrorOverlay() {
    let overlay = document.getElementById('fatal-error-overlay');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'fatal-error-overlay';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.display = 'none';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.background = 'rgba(5, 8, 10, 0.88)';
    overlay.style.zIndex = '99999';
    overlay.style.padding = '24px';

    const panel = document.createElement('div');
    panel.style.maxWidth = '520px';
    panel.style.width = '100%';
    panel.style.background = '#151d22';
    panel.style.border = '2px solid #8fb7ca';
    panel.style.boxShadow = '0 0 0 4px #000';
    panel.style.color = '#e7f4ff';
    panel.style.fontFamily = 'monospace';
    panel.style.padding = '20px';
    panel.style.textAlign = 'center';

    const title = document.createElement('div');
    title.textContent = 'AN ERROR OCCURRED';
    title.style.fontSize = '20px';
    title.style.fontWeight = '700';
    title.style.marginBottom = '12px';

    const message = document.createElement('div');
    message.id = 'fatal-error-message';
    message.textContent = 'The game hit an unexpected error. Please reload the page.';
    message.style.fontSize = '14px';
    message.style.lineHeight = '1.5';
    message.style.marginBottom = '16px';

    const reloadButton = document.createElement('button');
    reloadButton.type = 'button';
    reloadButton.textContent = 'RELOAD';
    reloadButton.style.background = '#30454f';
    reloadButton.style.color = '#e7f4ff';
    reloadButton.style.border = '2px solid #8fb7ca';
    reloadButton.style.padding = '10px 18px';
    reloadButton.style.cursor = 'pointer';
    reloadButton.style.fontFamily = 'monospace';
    reloadButton.style.fontSize = '14px';
    reloadButton.addEventListener('click', () => {
        window.location.reload();
    });

    panel.append(title, message, reloadButton);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    return overlay;
}

function showFatalErrorOverlay(errorLike) {
    const overlay = ensureFatalErrorOverlay();
    const messageNode = document.getElementById('fatal-error-message');
    const rawMessage = typeof errorLike === 'string'
        ? errorLike
        : (errorLike?.message || errorLike?.reason?.message || errorLike?.reason || 'The game hit an unexpected error.');
    if (messageNode) {
        messageNode.textContent = `${String(rawMessage)} Reload the page to continue.`;
    }
    overlay.style.display = 'flex';
}

window.addEventListener('error', (event) => {
    console.error('Global error:', event.error || event.message || event);
    showFatalErrorOverlay(event.error || event.message || event);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason || event);
    showFatalErrorOverlay(event.reason || event);
});

async function lockPortraitOrientation() {
    try {
        if (screen.orientation?.lock) {
            await screen.orientation.lock('portrait');
        }
    } catch (_error) {
        // Some browsers/webviews require fullscreen or may reject programmatic orientation lock.
    }
}

async function requestElementFullscreen(element) {
    if (!element) return false;
    try {
        if (typeof element.requestFullscreen === 'function') {
            await element.requestFullscreen({ navigationUI: 'hide' });
            return true;
        }
    } catch (_error) {
        // Fall through to prefixed APIs.
    }
    try {
        if (typeof element.webkitRequestFullscreen === 'function') {
            element.webkitRequestFullscreen();
            return true;
        }
    } catch (_error) {
        // Ignore and continue.
    }
    return false;
}

async function ensureMobileFullscreenAndPortrait() {
    if (!isMobileDevice()) return false;
    const target = document.getElementById('game-container') ?? document.documentElement;
    let enteredFullscreen = false;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        enteredFullscreen = await requestElementFullscreen(target);
    }
    await lockPortraitOrientation();
    return enteredFullscreen;
}

function installMobileDisplayMode() {
    if (!isMobileDevice()) return;
    const retryInteractiveDisplayMode = async () => {
        await ensureMobileFullscreenAndPortrait();
    };
    window.addEventListener('pointerdown', retryInteractiveDisplayMode, { passive: true });
    window.addEventListener('touchend', retryInteractiveDisplayMode, { passive: true });
    ensureMobileFullscreenAndPortrait();
}

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    resolution: getRenderResolution(),
    parent: 'game-container',
    pixelArt: true,
    antialias: false,
    antialiasGL: false,
    roundPixels: true,
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: [BootScene, MainMenuScene, MainScene, HudScene, PauseMenuScene, GameOverScene, VictoryScene]
};

try {
    installMobileDisplayMode();
    installConsoleDebugMenuAccess();
    new Phaser.Game(config);
} catch (error) {
    console.error('Failed to start Phaser game:', error);
    showFatalErrorOverlay(error);
}
