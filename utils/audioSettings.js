export const DEFAULT_AUDIO_SETTINGS = {
    musicEnabled: false,
    sfxEnabled: true
};

const AUDIO_SETTINGS_STORAGE_KEY = 'rune_pixel_survivors_audio_settings_v1';
const LEGACY_AUDIO_SETTINGS_STORAGE_KEY = 'shadow_survivors_audio_settings_v1';

function sanitizeAudioSettings(raw) {
    const source = raw && typeof raw === 'object' ? raw : {};
    return {
        musicEnabled: typeof source.musicEnabled === 'boolean'
            ? source.musicEnabled
            : DEFAULT_AUDIO_SETTINGS.musicEnabled,
        sfxEnabled: typeof source.sfxEnabled === 'boolean'
            ? source.sfxEnabled
            : DEFAULT_AUDIO_SETTINGS.sfxEnabled
    };
}

function loadStoredAudioSettings() {
    try {
        const raw = globalThis?.localStorage?.getItem?.(AUDIO_SETTINGS_STORAGE_KEY)
            ?? globalThis?.localStorage?.getItem?.(LEGACY_AUDIO_SETTINGS_STORAGE_KEY);
        if (!raw) return { ...DEFAULT_AUDIO_SETTINGS };
        return { ...DEFAULT_AUDIO_SETTINGS, ...sanitizeAudioSettings(JSON.parse(raw)) };
    } catch (_error) {
        return { ...DEFAULT_AUDIO_SETTINGS };
    }
}

function saveStoredAudioSettings(settings) {
    try {
        globalThis?.localStorage?.setItem?.(
            AUDIO_SETTINGS_STORAGE_KEY,
            JSON.stringify(sanitizeAudioSettings(settings))
        );
    } catch (_error) {
        // Ignore storage failures and keep runtime settings alive in registry.
    }
}

export function ensureAudioSettings(registry) {
    if (!registry) return loadStoredAudioSettings();
    const current = registry.get('audioSettings');
    const stored = loadStoredAudioSettings();
    const next = sanitizeAudioSettings({ ...DEFAULT_AUDIO_SETTINGS, ...stored, ...(current ?? {}) });
    if (
        current?.musicEnabled !== next.musicEnabled ||
        current?.sfxEnabled !== next.sfxEnabled
    ) {
        registry.set('audioSettings', next);
    }
    saveStoredAudioSettings(next);
    return next;
}

export function getAudioSettings(scene) {
    return ensureAudioSettings(scene?.registry);
}

export function updateAudioSetting(scene, key, value) {
    const settings = getAudioSettings(scene);
    const next = sanitizeAudioSettings({ ...settings, [key]: Boolean(value) });
    scene?.registry?.set('audioSettings', next);
    saveStoredAudioSettings(next);
    return next;
}

export function isMusicEnabled(scene) {
    return getAudioSettings(scene).musicEnabled !== false;
}

export function isSfxEnabled(scene) {
    return getAudioSettings(scene).sfxEnabled !== false;
}

export function isAudioUnlocked(scene) {
    if (!scene?.sound) return false;
    if (scene.sound.locked === true) return false;
    const contextState = scene.sound.context?.state;
    return !contextState || contextState === 'running';
}

export async function resumeAudioContext(scene) {
    if (!scene?.sound) return false;
    const context = scene.sound.context;
    if (context?.state === 'suspended') {
        try {
            await context.resume();
        } catch (_error) {
            return false;
        }
    }
    return isAudioUnlocked(scene);
}

export function installAudioUnlock(scene, onUnlocked) {
    if (!scene?.sound || !scene.input) return () => {};
    const game = scene.game;
    if (!game) return () => {};

    if (!game.__audioUnlockCallbacks) {
        game.__audioUnlockCallbacks = new Set();
    }
    if (typeof onUnlocked === 'function') {
        game.__audioUnlockCallbacks.add(onUnlocked);
    }

    if (game.__audioUnlockInstalled) {
        if (isAudioUnlocked(scene) && typeof onUnlocked === 'function') {
            onUnlocked();
        }
        return () => {
            game.__audioUnlockCallbacks?.delete(onUnlocked);
        };
    }

    game.__audioUnlockInstalled = true;
    const attemptUnlock = async () => {
        const unlocked = await resumeAudioContext(scene);
        if (!unlocked) return;
        const callbacks = Array.from(game.__audioUnlockCallbacks ?? []);
        callbacks.forEach((callback) => {
            try {
                callback();
            } catch (_error) {
                // Ignore callback errors so audio unlock can continue.
            }
        });
        game.__audioUnlockCallbacks?.clear?.();
    };

    scene.input.on('pointerdown', attemptUnlock);
    scene.input.keyboard?.on?.('keydown', attemptUnlock);

    return () => {
        game.__audioUnlockCallbacks?.delete(onUnlocked);
        scene.input.off('pointerdown', attemptUnlock);
        scene.input.keyboard?.off?.('keydown', attemptUnlock);
        game.__audioUnlockInstalled = false;
    };
}

export function playSfx(scene, key, config = {}) {
    if (!scene?.sound || !key || !isSfxEnabled(scene) || !isAudioUnlocked(scene)) return null;
    return scene.sound.play(key, config);
}
