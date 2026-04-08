export const CHARACTER_LEVEL_GROWTH_CONFIG = Object.freeze({
    knight: Object.freeze({
        hpPerLevel: 10,
        armorPerLevel: 0.5
    }),
    aqua: Object.freeze({
        hpPerLevel: 6,
        areaSizePerLevel: 0.015,
        projectileSpeedPerLevel: 0.015
    }),
    radian: Object.freeze({
        hpPerLevel: 5,
        damagePerLevel: 1,
        skillKey: 'ghost_summon'
    }),
    frost: Object.freeze({
        hpPerLevel: 5,
        effectChancePerLevel: 0.015,
        damagePerLevel: 1,
        skillKey: 'frost_zone'
    }),
    witch: Object.freeze({
        hpPerLevel: 4,
        effectDamagePerLevel: 0.015,
        critChancePerLevel: 0.01
    }),
    asian_dragon: Object.freeze({
        hpPerLevel: 4,
        damagePerLevel: 1,
        skillKey: 'flame',
        effectDamagePerLevel: 0.01
    }),
    bodoi: Object.freeze({
        hpPerLevel: 4,
        damagePerLevel: 1,
        skillKey: 'mu_coi',
        projectileSpeedPerLevel: 0.015
    }),
    gambler: Object.freeze({
        hpPerLevel: 4,
        damagePerLevel: 1,
        skillKey: 'card_toss',
        critChancePerLevel: 0.01
    }),
    raiji: Object.freeze({
        hpPerLevel: 4,
        damagePerLevel: 1,
        skillKey: 'thunder',
        critChancePerLevel: 0.01
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
