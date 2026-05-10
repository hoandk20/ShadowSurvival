import { CHARACTER_CONFIG, CHARACTER_KEYS } from '../config/characters/characters.js';
import { META_UPGRADE_CONFIG, getMetaUpgradeMaxLevel } from '../config/metaUpgrades.js';
import { setBadgeProgress, unlockBadge } from './badges.js';

const BADGE_IDS = Object.freeze({
    rosterExpansion: 'bronze_roster_expansion',
    upgradeInitiation: 'bronze_upgrade_initiation',
    dynamonDrip: 'meta_dynamon_drip',
    maxedOut: 'meta_maxed_out',
    veteranSurvivor: 'meta_veteran_survivor',
    completionist: 'meta_completionist_rune'
});

function countPlayableCharacters() {
    return CHARACTER_KEYS.filter((key) => Boolean(CHARACTER_CONFIG[key])).length;
}

export function syncMetaBadges(scene, metaProgress) {
    if (!scene || !metaProgress) return;

    const unlockedCharacters = Array.isArray(metaProgress.unlockedCharacters) ? metaProgress.unlockedCharacters : [];
    const unlockedCount = unlockedCharacters.length;
    const totalCharacters = Math.max(1, countPlayableCharacters());

    setBadgeProgress(BADGE_IDS.rosterExpansion, unlockedCount, 5);
    if (unlockedCount >= 5) unlockBadge(BADGE_IDS.rosterExpansion);

    setBadgeProgress(BADGE_IDS.completionist, unlockedCount, totalCharacters);
    if (unlockedCount >= totalCharacters) unlockBadge(BADGE_IDS.completionist);

    const upgrades = metaProgress.upgrades && typeof metaProgress.upgrades === 'object' ? metaProgress.upgrades : {};
    const hasAnyUpgrade = Object.values(upgrades).some((value) => (Number(value) || 0) > 0);
    setBadgeProgress(BADGE_IDS.upgradeInitiation, hasAnyUpgrade ? 1 : 0, 1);
    if (hasAnyUpgrade) unlockBadge(BADGE_IDS.upgradeInitiation);

    const hasMaxedUpgrade = META_UPGRADE_CONFIG.some((upgrade) => {
        const current = Math.max(0, Math.floor(Number(upgrades[upgrade.key]) || 0));
        const max = getMetaUpgradeMaxLevel(upgrade);
        return current >= max && max > 0;
    });
    setBadgeProgress(BADGE_IDS.maxedOut, hasMaxedUpgrade ? 1 : 0, 1);
    if (hasMaxedUpgrade) unlockBadge(BADGE_IDS.maxedOut);

    const totalDynamonEarned = Math.max(0, Math.floor(Number(metaProgress.totalDynamonEarned) || 0));
    setBadgeProgress(BADGE_IDS.dynamonDrip, totalDynamonEarned, 100);
    if (totalDynamonEarned >= 100) unlockBadge(BADGE_IDS.dynamonDrip);

    const totalRunsCompleted = Math.max(0, Math.floor(Number(metaProgress.totalRunsCompleted) || 0));
    setBadgeProgress(BADGE_IDS.veteranSurvivor, totalRunsCompleted, 10);
    if (totalRunsCompleted >= 10) unlockBadge(BADGE_IDS.veteranSurvivor);
}

