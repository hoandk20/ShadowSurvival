export const CHARACTER_LEVEL_GROWTH_CONFIG = Object.freeze({
    knight: Object.freeze({
        hpPerLevel: 10,
        armorPerLevel: 0.5
    }),
    werewolf: Object.freeze({
        hpPerLevel: 5,
        moveSpeedPerLevel: 2,
        damagePerLevel: 2,
        skillKey: 'claw'
    }),
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
