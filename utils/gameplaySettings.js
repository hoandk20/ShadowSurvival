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

export function ensureGameplaySettings(registry) {
    if (!registry) return { ...DEFAULT_GAMEPLAY_SETTINGS };
    const current = registry.get('gameplaySettings');
    const next = { ...DEFAULT_GAMEPLAY_SETTINGS, ...(current ?? {}) };
    const mode = String(next.damageNumbersMode ?? 'full');
    next.damageNumbersMode = (mode === 'off' || mode === 'reduced') ? mode : 'full';
    const capMode = String(next.damageTextCapMode ?? 'merge');
    next.damageTextCapMode = (capMode === 'replace' || capMode === 'unlimited') ? capMode : 'merge';
    registry.set('gameplaySettings', next);
    return next;
}

export function getGameplaySettings(scene) {
    return ensureGameplaySettings(scene?.registry);
}

export function updateGameplaySetting(scene, key, value) {
    const settings = getGameplaySettings(scene);
    const next = { ...settings, [key]: value };
    scene?.registry?.set('gameplaySettings', next);
    return ensureGameplaySettings(scene?.registry);
}

export function getDamageNumbersMode(scene) {
    return getGameplaySettings(scene).damageNumbersMode ?? 'full';
}

export function getDamageTextCapMode(scene) {
    return getGameplaySettings(scene).damageTextCapMode ?? 'merge';
}
