import { BADGES } from '../config/badges.js';

const STORAGE_KEY = 'rps_badges_v1';

function safeParseJson(text, fallback) {
    try {
        const parsed = JSON.parse(text);
        return parsed ?? fallback;
    } catch (_error) {
        return fallback;
    }
}

function loadRawState() {
    if (typeof localStorage === 'undefined') return { unlocked: {} };
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { unlocked: {}, progress: {} };
    const parsed = safeParseJson(raw, { unlocked: {}, progress: {} });
    if (!parsed || typeof parsed !== 'object') return { unlocked: {} };
    const unlocked = parsed.unlocked && typeof parsed.unlocked === 'object' ? parsed.unlocked : {};
    const progress = parsed.progress && typeof parsed.progress === 'object' ? parsed.progress : {};
    return { unlocked, progress };
}

function saveRawState(state) {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getUnlockedBadgeMap() {
    const state = loadRawState();
    return { ...(state.unlocked ?? {}) };
}

export function isBadgeUnlocked(badgeId) {
    const unlocked = getUnlockedBadgeMap();
    return Boolean(unlocked[badgeId]);
}

export function unlockBadge(badgeId) {
    if (!badgeId) return false;
    const badgeExists = BADGES.some((badge) => badge.id === badgeId);
    if (!badgeExists) return false;
    const state = loadRawState();
    const unlocked = state.unlocked ?? {};
    if (unlocked[badgeId]) return false;
    unlocked[badgeId] = Date.now();
    state.unlocked = unlocked;
    saveRawState(state);
    return true;
}

export function setBadgeProgress(badgeId, current, target = 1) {
    if (!badgeId) return false;
    const badgeExists = BADGES.some((badge) => badge.id === badgeId);
    if (!badgeExists) return false;
    const numericCurrent = Number(current);
    const numericTarget = Math.max(1, Number(target));
    if (!Number.isFinite(numericCurrent) || !Number.isFinite(numericTarget)) return false;

    const clampedCurrent = Math.max(0, Math.min(numericCurrent, numericTarget));
    const state = loadRawState();
    const progress = state.progress ?? {};
    const prev = progress[badgeId] ?? null;
    const prevCurrent = Number(prev?.current ?? -1);
    const prevTarget = Number(prev?.target ?? -1);
    const changed = prevCurrent !== clampedCurrent || prevTarget !== numericTarget;
    if (!changed) return false;

    progress[badgeId] = { current: clampedCurrent, target: numericTarget, updatedAt: Date.now() };
    if (clampedCurrent >= numericTarget) {
        const unlocked = state.unlocked ?? {};
        if (!unlocked[badgeId]) {
            unlocked[badgeId] = Date.now();
            state.unlocked = unlocked;
        }
    }
    state.progress = progress;
    saveRawState(state);
    return true;
}

export function getBadgeProgress(badgeId) {
    const state = loadRawState();
    const progress = state.progress ?? {};
    const entry = progress[badgeId] ?? null;
    const unlocked = Boolean((state.unlocked ?? {})[badgeId]);

    if (entry && typeof entry === 'object') {
        const target = Math.max(1, Number(entry.target ?? 1));
        const current = unlocked
            ? target
            : Math.max(0, Number(entry.current ?? 0));
        const percent = Math.max(0, Math.min(1, current / target));
        return { current, target, percent, completed: unlocked || current >= target };
    }

    const current = unlocked ? 1 : 0;
    return { current, target: 1, percent: current, completed: unlocked };
}

export function getBadgeProgressSummary() {
    const unlocked = getUnlockedBadgeMap();
    const total = BADGES.length;
    const unlockedCount = BADGES.reduce((sum, badge) => sum + (unlocked[badge.id] ? 1 : 0), 0);
    return { total, unlocked: unlockedCount };
}

export function getBadgesWithState() {
    const unlocked = getUnlockedBadgeMap();
    return BADGES.map((badge) => ({
        ...badge,
        unlockedAt: unlocked[badge.id] ?? null,
        unlocked: Boolean(unlocked[badge.id]),
        progress: getBadgeProgress(badge.id)
    }));
}
