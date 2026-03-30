export const HIDDEN_SKILL_UNLOCK_CONFIG = [
    {
        key: 'asian_dragon_flame_to_blueflame',
        kind: 'replaceSkill',
        sourceSkillKey: 'flame',
        targetSkillKey: 'blueflame',
        requiredKills: 2000,
        requiredKillsFromSkillKey: 'flame',
        inventoryKey: 'dragon_scale',
        requiredItemLevel: 8
    },
    {
        key: 'asian_dragon_unlock_astral',
        kind: 'unlockSkill',
        targetSkillKey: 'astral',
        requiredKills: 6666,
        requiredKillsFromSkillKey: 'blueflame',
        requiredSkillKey: 'blueflame',
        ignoreCap: true
    },
    {
        key: 'sky_fall_explosion_mastery',
        kind: 'unlockFeature',
        skillKey: 'sky_fall',
        requiredLevel: 30,
        label: 'Sky Fall Explosion',
        lockedOverrides: {
            explosionOnHit: false,
            explosionRadius: 0,
            explosionDamageMultiplier: 0,
            explosionKnockbackMultiplier: 0,
            disabledBehaviorTypes: ['explosionOnHit']
        }
    }
];
