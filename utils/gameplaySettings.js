export const DEFAULT_GAMEPLAY_SETTINGS = {
    // full: normal damage numbers
    // reduced: still shows, but intended for lower noise (cap/merge still applies)
    // off: disables damage numbers
    damageNumbersMode: 'full',
    // merge: cap live texts at 60 and merge nearby hits
    // replace: cap live texts at 60 and recycle the oldest (no merge)
    // unlimited: always spawn a new text (can get noisy / more CPU)
    damageTextCapMode: 'merge'
};

const GAMEPLAY_SETTINGS_STORAGE_KEY = 'rune_pixel_survivors_gameplay_settings_v1';
const LEGACY_GAMEPLAY_SETTINGS_STORAGE_KEY = 'shadow_survivors_gameplay_settings_v1';

function sanitizeGameplaySettings(raw) {
    const source = raw && typeof raw === 'object' ? raw : {};
    const next = { ...DEFAULT_GAMEPLAY_SETTINGS, ...source };
    const mode = String(next.damageNumbersMode ?? 'full');
    next.damageNumbersMode = (mode === 'off' || mode === 'reduced') ? mode : 'full';
    const capMode = String(next.damageTextCapMode ?? 'merge');
    next.damageTextCapMode = (capMode === 'replace' || capMode === 'unlimited') ? capMode : 'merge';
    return next;
}

function loadStoredGameplaySettings() {
    try {
        const raw = globalThis?.localStorage?.getItem?.(GAMEPLAY_SETTINGS_STORAGE_KEY)
            ?? globalThis?.localStorage?.getItem?.(LEGACY_GAMEPLAY_SETTINGS_STORAGE_KEY);
        if (!raw) return { ...DEFAULT_GAMEPLAY_SETTINGS };
        return sanitizeGameplaySettings(JSON.parse(raw));
    } catch (_error) {
        return { ...DEFAULT_GAMEPLAY_SETTINGS };
    }
}

function saveStoredGameplaySettings(settings) {
    try {
        globalThis?.localStorage?.setItem?.(
            GAMEPLAY_SETTINGS_STORAGE_KEY,
            JSON.stringify(sanitizeGameplaySettings(settings))
        );
    } catch (_error) {
        // Ignore storage failures and keep runtime settings alive in registry.
    }
}

export function ensureGameplaySettings(registry) {
    if (!registry) return loadStoredGameplaySettings();
    const current = registry.get('gameplaySettings');
    const stored = loadStoredGameplaySettings();
    const next = sanitizeGameplaySettings({ ...DEFAULT_GAMEPLAY_SETTINGS, ...stored, ...(current ?? {}) });
    if (
        current?.damageNumbersMode !== next.damageNumbersMode ||
        current?.damageTextCapMode !== next.damageTextCapMode
    ) {
        registry.set('gameplaySettings', next);
    }
    return next;
}

export function getGameplaySettings(scene) {
    return ensureGameplaySettings(scene?.registry);
}

export function updateGameplaySetting(scene, key, value) {
    const settings = getGameplaySettings(scene);
    const next = sanitizeGameplaySettings({ ...settings, [key]: value });
    scene?.registry?.set('gameplaySettings', next);
    saveStoredGameplaySettings(next);
    return next;
}

export function getDamageNumbersMode(scene) {
    return getGameplaySettings(scene).damageNumbersMode ?? 'full';
}

export function getDamageTextCapMode(scene) {
    return getGameplaySettings(scene).damageTextCapMode ?? 'merge';
}
