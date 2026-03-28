export const DEFAULT_AUDIO_SETTINGS = {
    musicEnabled: true,
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

export function playSfx(scene, key, config = {}) {
    if (!scene?.sound || !key || !isSfxEnabled(scene)) return null;
    return scene.sound.play(key, config);
}
