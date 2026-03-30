export const HIDDEN_SKILL_UNLOCK_CONFIG = [
    {
        key: 'charm_to_ghost',
        kind: 'replaceSkill',
        sourceSkillKey: 'charm',
        targetSkillKey: 'ghost',
        inventoryKey: 'charm',
        requiredItemLevel: 8,
        requiredMovedDistance: 50000
    },
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
        key: 'aqua_stream_unlock_aqua_shield',
        kind: 'unlockSkill',
        targetSkillKey: 'aqua_shield',
        requiredSkillHits: 10000,
        requiredHitsFromSkillKey: 'aqua_stream',
        requiredSkillKey: 'aqua_stream',
        inventoryKey: 'shield_item',
        requiredItemLevel: 1,
        ignoreCap: true
    },
    {
        key: 'sky_fall_explosion_mastery',
        kind: 'unlockFeature',
        skillKey: 'sky_fall',
        inventoryKey: 'shotingstar',
        requiredItemLevel: 12,
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
