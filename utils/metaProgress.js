// utils/metaProgress.js
//
// Meta-progress is "out of run" data (currencies, unlocks, etc).
// Today we persist to localStorage, but the API is provider-based so we can
// swap to an account-backed provider later without touching game logic.
import { DEFAULT_UNLOCKED_CHARACTER_KEYS } from '../config/characters/characters.js';

export const DEFAULT_META_PROGRESS = Object.freeze({
    dynamon: 10000,
    totalDynamonEarned: 0,
    totalWavesCleared: 0,
    upgrades: Object.freeze({}),
    unlockedCharacters: Object.freeze([...DEFAULT_UNLOCKED_CHARACTER_KEYS])
});

const REGISTRY_KEY = 'metaProgress';
const STORAGE_KEY = 'rune_pixel_survivors_meta_v1';
const LEGACY_STORAGE_KEY = 'shadow_survivors_meta_v1';

function clampInt(value, min = 0, max = Number.POSITIVE_INFINITY) {
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n)) return min;
    return Math.min(max, Math.max(min, n));
}

function sanitizeMetaProgress(raw) {
    const safe = raw && typeof raw === 'object' ? raw : {};
    return {
        dynamon: clampInt(safe.dynamon, 0),
        totalDynamonEarned: clampInt(safe.totalDynamonEarned, 0),
        totalWavesCleared: clampInt(safe.totalWavesCleared, 0),
        upgrades: sanitizeUpgradeLevels(safe.upgrades),
        unlockedCharacters: sanitizeUnlockedCharacters(safe.unlockedCharacters)
    };
}

function sanitizeUpgradeLevels(raw) {
    const source = raw && typeof raw === 'object' ? raw : {};
    return Object.fromEntries(
        Object.entries(source)
            .map(([key, value]) => [String(key), clampInt(value, 0, 99)])
            .filter(([key]) => Boolean(key))
    );
}

function sanitizeUnlockedCharacters(raw) {
    const values = Array.isArray(raw) ? raw : [];
    const safe = new Set(DEFAULT_UNLOCKED_CHARACTER_KEYS);
    values.forEach((value) => {
        const key = String(value ?? '').trim();
        if (key) safe.add(key);
    });
    return [...safe];
}

export class LocalStorageMetaProgressProvider {
    async load() {
        try {
            const raw = globalThis?.localStorage?.getItem?.(STORAGE_KEY)
                ?? globalThis?.localStorage?.getItem?.(LEGACY_STORAGE_KEY);
            if (!raw) return { ...DEFAULT_META_PROGRESS };
            const parsed = JSON.parse(raw);
            return { ...DEFAULT_META_PROGRESS, ...sanitizeMetaProgress(parsed) };
        } catch (_error) {
            return { ...DEFAULT_META_PROGRESS };
        }
    }

    async save(metaProgress) {
        try {
            const payload = sanitizeMetaProgress(metaProgress);
            globalThis?.localStorage?.setItem?.(STORAGE_KEY, JSON.stringify(payload));
            return true;
        } catch (_error) {
            return false;
        }
    }
}

let activeProvider = new LocalStorageMetaProgressProvider();

// Allow future swap to an account-backed provider.
export function setMetaProgressProvider(provider) {
    if (provider?.load && provider?.save) {
        activeProvider = provider;
    }
}

export function getMetaProgress(scene) {
    const registry = scene?.registry ?? null;
    const current = registry?.get?.(REGISTRY_KEY);
    return { ...DEFAULT_META_PROGRESS, ...sanitizeMetaProgress(current) };
}

export function setMetaProgress(scene, next) {
    const registry = scene?.registry ?? null;
    if (!registry) return getMetaProgress(scene);
    const value = { ...DEFAULT_META_PROGRESS, ...sanitizeMetaProgress(next) };
    registry.set(REGISTRY_KEY, value);
    scene?.events?.emit?.('metaProgressChanged', value);
    return value;
}

export function ensureMetaProgress(scene) {
    // Set default immediately so reads are stable even before async load returns.
    const current = getMetaProgress(scene);
    setMetaProgress(scene, current);
    return current;
}

export function bootstrapMetaProgress(scene) {
    ensureMetaProgress(scene);
    // Async load for provider-based design (account storage later).
    activeProvider.load().then((loaded) => {
        // Don't clobber if scene is already destroyed.
        if (!scene?.registry) return;
        setMetaProgress(scene, loaded);
    });
}

export function saveMetaProgress(scene) {
    const current = getMetaProgress(scene);
    return activeProvider.save(current);
}

export function getMetaUpgradeLevels(scene) {
    return { ...(getMetaProgress(scene).upgrades ?? {}) };
}

export function setMetaUpgradeLevels(scene, upgrades) {
    const current = getMetaProgress(scene);
    const next = {
        ...current,
        upgrades: sanitizeUpgradeLevels(upgrades)
    };
    setMetaProgress(scene, next);
    saveMetaProgress(scene);
    return next;
}

export function getUnlockedCharacterKeys(scene) {
    return [...(getMetaProgress(scene).unlockedCharacters ?? DEFAULT_UNLOCKED_CHARACTER_KEYS)];
}

export function isCharacterUnlocked(scene, characterKey) {
    return new Set(getUnlockedCharacterKeys(scene)).has(characterKey);
}

export function unlockCharacter(scene, characterKey) {
    const key = String(characterKey ?? '').trim();
    if (!key) return getMetaProgress(scene);
    const current = getMetaProgress(scene);
    const unlocked = new Set(current.unlockedCharacters ?? DEFAULT_UNLOCKED_CHARACTER_KEYS);
    unlocked.add(key);
    const next = {
        ...current,
        unlockedCharacters: [...unlocked]
    };
    setMetaProgress(scene, next);
    saveMetaProgress(scene);
    return next;
}

export function spendDynamon(scene, amount) {
    const cost = clampInt(amount, 0);
    if (cost <= 0) return getMetaProgress(scene);
    const current = getMetaProgress(scene);
    if ((current.dynamon ?? 0) < cost) return current;
    const next = {
        ...current,
        dynamon: clampInt((current.dynamon ?? 0) - cost, 0)
    };
    setMetaProgress(scene, next);
    saveMetaProgress(scene);
    return next;
}

export function addDynamon(scene, amount, options = {}) {
    const delta = clampInt(amount, 0);
    if (delta <= 0) return getMetaProgress(scene);
    const current = getMetaProgress(scene);
    const next = {
        ...current,
        dynamon: clampInt((current.dynamon ?? 0) + delta, 0),
        totalDynamonEarned: clampInt((current.totalDynamonEarned ?? 0) + delta, 0),
        totalWavesCleared: clampInt((current.totalWavesCleared ?? 0) + (options.countWaveClear ? 1 : 0), 0)
    };
    setMetaProgress(scene, next);
    saveMetaProgress(scene);
    return next;
}
