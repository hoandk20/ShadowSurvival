// utils/metaProgress.js
//
// Meta-progress is "out of run" data (currencies, unlocks, etc).
// Today we persist to localStorage, but the API is provider-based so we can
// swap to an account-backed provider later without touching game logic.

export const DEFAULT_META_PROGRESS = Object.freeze({
    dynamon: 0,
    totalDynamonEarned: 0,
    totalWavesCleared: 0
});

const REGISTRY_KEY = 'metaProgress';
const STORAGE_KEY = 'shadow_survivors_meta_v1';

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
        totalWavesCleared: clampInt(safe.totalWavesCleared, 0)
    };
}

export class LocalStorageMetaProgressProvider {
    async load() {
        try {
            const raw = globalThis?.localStorage?.getItem?.(STORAGE_KEY);
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

