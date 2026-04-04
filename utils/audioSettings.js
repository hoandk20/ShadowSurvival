export const DEFAULT_AUDIO_SETTINGS = {
    musicEnabled: false,
    sfxEnabled: true
};

export function ensureAudioSettings(registry) {
    if (!registry) return { ...DEFAULT_AUDIO_SETTINGS };
    const current = registry.get('audioSettings');
    const next = { ...DEFAULT_AUDIO_SETTINGS, ...(current ?? {}) };
    registry.set('audioSettings', next);
    return next;
}

export function getAudioSettings(scene) {
    return ensureAudioSettings(scene?.registry);
}

export function updateAudioSetting(scene, key, value) {
    const settings = getAudioSettings(scene);
    const next = { ...settings, [key]: Boolean(value) };
    scene?.registry?.set('audioSettings', next);
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
