export const PLAYER_BASE_STATS = Object.freeze({
    hp: 100,
    armor: 1,
    armorPierce: 0,
    skillRange: 0,
    moveSpeed: 105,
    knockbackMultiplier: 1,
    damageMultiplier: 1,
    attackSpeed: 1,
    critChance: 0.1,
    critMultiplier: 1.5,
    areaSizeMultiplier: 1,
    projectileCount: 1,
    effectChance: 0,
    effectDamageMultiplier: 1,
    effectDurationMultiplier: 1,
    shockChainCount: 0,
    pickupRangeMultiplier: 1,
    xpGainMultiplier: 1,
    goldGainMultiplier: 1,
    healthRegenPerSecond: 0,
    lifesteal: 0,
    shield: 0,
    dodge: 0
});

export const ENEMY_BASE_STATS = Object.freeze({
    maxHealth: 10,
    damage: 15,
    moveSpeed: 60,
    armor: 2,
    effectResist: 0,
    attackCooldown: 500,
    attackRange: 10,
    knockbackResist: 1,
    stunResist: 1,
    ghostDuration: 900,
    scale: 1
});

export function mergeNumericStats(baseStats = {}, bonusStats = {}) {
    const merged = {};
    const keys = new Set([...Object.keys(baseStats), ...Object.keys(bonusStats)]);

    keys.forEach((key) => {
        const baseValue = baseStats[key];
        const bonusValue = bonusStats[key];

        if (typeof baseValue === 'number' || typeof bonusValue === 'number') {
            merged[key] = (baseValue ?? 0) + (bonusValue ?? 0);
            return;
        }

        merged[key] = bonusValue ?? baseValue;
    });

    return merged;
}

export function createCharacterConfig(config = {}) {
    const statsBonus = { ...(config.statsBonus ?? {}) };
    const stats = mergeNumericStats(PLAYER_BASE_STATS, statsBonus);

    return {
        ...config,
        statsBonus,
        stats,
        hp: stats.hp,
        armor: stats.armor,
        speed: stats.moveSpeed,
        knockbackMultiplier: stats.knockbackMultiplier
    };
}

export function createEnemyConfig(config = {}) {
    const statsBonus = { ...(config.statsBonus ?? {}) };
    const stats = mergeNumericStats(ENEMY_BASE_STATS, statsBonus);

    return {
        ...config,
        statsBonus,
        stats,
        health: stats.maxHealth,
        speed: stats.moveSpeed,
        damage: stats.damage,
        armor: stats.armor,
        effectResist: stats.effectResist,
        attackCooldown: stats.attackCooldown,
        attackRange: stats.attackRange,
        knockbackResist: stats.knockbackResist,
        stunResist: stats.stunResist,
        ghostDuration: stats.ghostDuration,
        scale: stats.scale
    };
}

export function getCharacterStats(characterConfig = null) {
    return characterConfig?.stats ?? PLAYER_BASE_STATS;
}

export function getEnemyStats(enemyConfig = null) {
    return enemyConfig?.stats ?? ENEMY_BASE_STATS;
}
