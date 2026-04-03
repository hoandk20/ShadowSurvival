export const CHARACTER_LEVEL_GROWTH_CONFIG = Object.freeze({
    lumina: Object.freeze({
        hpPerLevel: 1,
        damagePerLevel: 2,
        skillKey: 'shooting_star'
    })
});

export function getCharacterLevelGrowth(characterKey) {
    if (!characterKey) return null;
    return CHARACTER_LEVEL_GROWTH_CONFIG[characterKey] ?? null;
}
