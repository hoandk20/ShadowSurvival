const itemCard = ({
    key,
    name,
    description,
    assetPath,
    cardType = 'item',
    rarity = 'rare',
    weight = 4,
    stackLimit = 8,
    effects = [],
    group,
    requirements = {},
    inventoryKey,
    inventoryName,
    inventoryMaxLevel = 8
}) => ({
    key,
    name,
    description,
    assetPath,
    cardType,
    rarity,
    group: group ?? key,
    effects,
    weight,
    stackLimit,
    requirements,
    inventoryKey: inventoryKey ?? key,
    inventoryName: inventoryName ?? name,
    inventoryMaxLevel
});

const passiveItemCard = (config) => itemCard({
    ...config,
    cardType: 'passive'
});

const createSkillUpgradeCards = ({
    baseKey,
    name,
    assetPath,
    skillKey,
    rarity = 'rare',
    unlockWeight = 5,
    damageWeight = 4,
    objectWeight = 4,
    cooldownWeight = 4,
    areaWeight = 4,
    damageValue = 0.1,
    cooldownValue = -150,
    areaValue = 0.1
}) => {
    const cards = [
        itemCard({
            key: `${baseKey}_unlock`,
            name: `${name} Unlock`,
            description: `Unlock ${name}`,
            assetPath,
            cardType: 'skill',
            rarity,
            weight: unlockWeight,
            stackLimit: 1,
            group: `${baseKey}_unlock`,
            effects: [{ type: 'skillUnlock', skillKey }],
            inventoryKey: baseKey,
            inventoryName: name,
            requirements: {
                skillLocked: skillKey
            }
        }),
        itemCard({
            key: `${baseKey}_damage`,
            name: `${name} Damage`,
            description: `+10% damage for ${name}`,
            assetPath,
            cardType: 'skill',
            rarity,
            weight: damageWeight,
            stackLimit: 10,
            group: `${baseKey}_damage`,
            effects: [{ type: 'skillDamagePercent', skillKey, value: damageValue }],
            inventoryKey: baseKey,
            inventoryName: name,
            requirements: {
                skillUnlocked: skillKey
            }
        }),
        itemCard({
            key: `${baseKey}_cooldown`,
            name: `${name} Cooldown`,
            description: `-0.15s cooldown for ${name}`,
            assetPath,
            cardType: 'skill',
            rarity,
            weight: cooldownWeight,
            stackLimit: 10,
            group: `${baseKey}_cooldown`,
            effects: [{ type: 'skillCooldownFor', skillKey, value: cooldownValue }],
            inventoryKey: baseKey,
            inventoryName: name,
            requirements: {
                skillUnlocked: skillKey
            }
        }),
        itemCard({
            key: `${baseKey}_area`,
            name: `${name} Area`,
            description: `Increase ${name} area by 10%`,
            assetPath,
            cardType: 'skill',
            rarity,
            weight: areaWeight,
            stackLimit: 10,
            group: `${baseKey}_area`,
            effects: [{ type: 'skillAreaPercent', skillKey, value: areaValue }],
            inventoryKey: baseKey,
            inventoryName: name,
            requirements: {
                skillUnlocked: skillKey,
                supportsArea: skillKey
            }
        }),
        itemCard({
            key: `${baseKey}_object`,
            name: `${name} Object`,
            description: `+1 object for ${name}`,
            assetPath,
            cardType: 'skill',
            rarity,
            weight: objectWeight,
            stackLimit: 10,
            group: `${baseKey}_object`,
            effects: [{ type: 'skillObject', skillKey, value: 1 }],
            inventoryKey: baseKey,
            inventoryName: name,
            requirements: {
                skillUnlocked: skillKey,
                supportsMultipleObject: skillKey
            }
        })
    ];

    return cards;
};

const createEffectSkillUpgradeCards = ({
    baseKey,
    name,
    assetPath,
    skillKey,
    rarity = 'rare',
    unlockWeight = 5,
    objectWeight = 4,
    cooldownWeight = 4,
    effectDurationWeight = 4,
    cooldownValue = -150,
    effectDurationMs = 500
}) => {
    const cards = [
        itemCard({
            key: `${baseKey}_unlock`,
            name: `${name} Unlock`,
            description: `Unlock ${name}`,
            assetPath,
            cardType: 'skill',
            rarity,
            weight: unlockWeight,
            stackLimit: 1,
            group: `${baseKey}_unlock`,
            effects: [{ type: 'skillUnlock', skillKey }],
            inventoryKey: baseKey,
            inventoryName: name,
            requirements: {
                skillLocked: skillKey
            }
        }),
        itemCard({
            key: `${baseKey}_cooldown`,
            name: `${name} Cooldown`,
            description: `-0.15s cooldown for ${name}`,
            assetPath,
            cardType: 'skill',
            rarity,
            weight: cooldownWeight,
            stackLimit: 10,
            group: `${baseKey}_cooldown`,
            effects: [{ type: 'skillCooldownFor', skillKey, value: cooldownValue }],
            inventoryKey: baseKey,
            inventoryName: name,
            requirements: {
                skillUnlocked: skillKey
            }
        }),
        itemCard({
            key: `${baseKey}_effect_duration`,
            name: `${name} Effect`,
            description: `+0.5s effect duration for ${name}`,
            assetPath,
            cardType: 'skill',
            rarity,
            weight: effectDurationWeight,
            stackLimit: 10,
            group: `${baseKey}_effect_duration`,
            effects: [{ type: 'skillEffectDurationMs', skillKey, value: effectDurationMs }],
            inventoryKey: baseKey,
            inventoryName: name,
            requirements: {
                skillUnlocked: skillKey,
                supportsEffectDuration: skillKey
            }
        }),
        itemCard({
            key: `${baseKey}_object`,
            name: `${name} Object`,
            description: `+1 object for ${name}`,
            assetPath,
            cardType: 'skill',
            rarity,
            weight: objectWeight,
            stackLimit: 10,
            group: `${baseKey}_object`,
            effects: [{ type: 'skillObject', skillKey, value: 1 }],
            inventoryKey: baseKey,
            inventoryName: name,
            requirements: {
                skillUnlocked: skillKey,
                supportsMultipleObject: skillKey
            }
        })
    ];

    return cards;
};

const createExplosionSkillUpgradeCards = ({
    baseKey,
    name,
    inventoryName = name,
    assetPath,
    skillKey,
    rarity = 'rare',
    unlockWeight = 5,
    damageWeight = 4,
    objectWeight = 4,
    explosionRadiusWeight = 4,
    damageValue = 0.1,
    explosionRadiusValue = 0.15
}) => {
    const cards = [
        itemCard({
            key: `${baseKey}_unlock`,
            name: `${name} Unlock`,
            description: `Unlock ${name}`,
            assetPath,
            cardType: 'skill',
            rarity,
            weight: unlockWeight,
            stackLimit: 1,
            group: `${baseKey}_unlock`,
            effects: [{ type: 'skillUnlock', skillKey }],
            inventoryKey: baseKey,
            inventoryName,
            requirements: {
                skillLocked: skillKey
            }
        }),
        itemCard({
            key: `${baseKey}_damage`,
            name: `${name} Damage`,
            description: `+10% damage for ${name}`,
            assetPath,
            cardType: 'skill',
            rarity,
            weight: damageWeight,
            stackLimit: 10,
            group: `${baseKey}_damage`,
            effects: [{ type: 'skillDamagePercent', skillKey, value: damageValue }],
            inventoryKey: baseKey,
            inventoryName,
            requirements: {
                skillUnlocked: skillKey
            }
        }),
        itemCard({
            key: `${baseKey}_explosion`,
            name: `${name} Blast`,
            description: `+15% explosion radius for ${name}`,
            assetPath,
            cardType: 'skill',
            rarity,
            weight: explosionRadiusWeight,
            stackLimit: 10,
            group: `${baseKey}_explosion`,
            effects: [{ type: 'skillExplosionRadiusPercent', skillKey, value: explosionRadiusValue }],
            inventoryKey: baseKey,
            inventoryName,
            requirements: {
                skillUnlocked: skillKey,
                supportsExplosionRadius: skillKey
            }
        }),
        itemCard({
            key: `${baseKey}_object`,
            name: `${name} Object`,
            description: `+1 object for ${name}`,
            assetPath,
            cardType: 'skill',
            rarity,
            weight: objectWeight,
            stackLimit: 10,
            group: `${baseKey}_object`,
            effects: [{ type: 'skillObject', skillKey, value: 1 }],
            inventoryKey: baseKey,
            inventoryName,
            requirements: {
                skillUnlocked: skillKey,
                supportsMultipleObject: skillKey
            }
        })
    ];

    return cards;
};

export const CARD_CONFIG = [
    passiveItemCard({
        key: 'armo',
        name: 'Armo',
        description: '+1 Armor',
        assetPath: 'assets/items/armo.png',
        rarity: 'common',
        weight: 6,
        stackLimit: 8,
        effects: [{ type: 'armor', value: 1 }]
    }),
    itemCard({
        key: 'clock',
        name: 'Clock',
        description: '-0.15s cooldown to all skills',
        assetPath: 'assets/items/clock.png',
        rarity: 'common',
        weight: 6,
        stackLimit: 8,
        effects: [{ type: 'skillCooldown', value: -150 }]
    }),
    itemCard({
        key: 'candle',
        name: 'Candle',
        description: '+1s duration to all skills',
        assetPath: 'assets/items/candle.png',
        rarity: 'rare',
        weight: 4,
        stackLimit: 8,
        effects: [{ type: 'allSkillDurationMs', value: 1000 }]
    }),
    passiveItemCard({
        key: 'clownmask',
        name: 'Clown Mask',
        description: '+10% XP gained',
        assetPath: 'assets/items/clownmask.png',
        rarity: 'rare',
        weight: 4,
        stackLimit: 8,
        effects: [{ type: 'xpGainPercent', value: 0.1 }]
    }),
    itemCard({
        key: 'dinamonring',
        name: 'Dinamon Ring',
        description: '+5% crit chance for all skills',
        assetPath: 'assets/items/dinamonring.png',
        rarity: 'legendary',
        weight: 3,
        stackLimit: 8,
        effects: [{ type: 'critChance', value: 0.05 }]
    }),
    itemCard({
        key: 'doublemask',
        name: 'Double Mask',
        description: '+1 object for all multi-object skills',
        assetPath: 'assets/items/doublemask.png',
        rarity: 'legendary',
        weight: 3,
        stackLimit: 8,
        effects: [{ type: 'allSkillObjects', value: 1 }]
    }),
    itemCard({
        key: 'flame_item',
        name: 'Flame',
        description: '+10% damage for all skills',
        assetPath: 'assets/items/flame.png',
        rarity: 'rare',
        weight: 5,
        stackLimit: 8,
        effects: [{ type: 'damage', value: 0.1 }]
    }),
    itemCard({
        key: 'gun',
        name: 'Gun',
        description: '+10% projectile speed',
        assetPath: 'assets/items/gun.png',
        rarity: 'common',
        weight: 5,
        stackLimit: 8,
        effects: [{ type: 'projectileSpeedPercent', value: 0.1 }]
    }),
    passiveItemCard({
        key: 'heart',
        name: 'Heart',
        description: '+30% Max HP',
        assetPath: 'assets/items/heart.png',
        rarity: 'rare',
        weight: 4,
        stackLimit: 8,
        effects: [{ type: 'maxHealthPercent', value: 0.3 }]
    }),
    passiveItemCard({
        key: 'plant',
        name: 'Plant',
        description: '+10% skill area, orbit radius, and projectile hitbox',
        assetPath: 'assets/items/plant.png',
        rarity: 'rare',
        weight: 4,
        stackLimit: 8,
        effects: [{ type: 'allSkillAreaPercent', value: 0.1 }]
    }),
    passiveItemCard({
        key: 'leaf',
        name: 'Leaf',
        description: '+0.5 HP regen per second',
        assetPath: 'assets/items/leaf.png',
        rarity: 'common',
        weight: 5,
        stackLimit: 8,
        effects: [{ type: 'healthRegenPerSecond', value: 0.5 }]
    }),
    passiveItemCard({
        key: 'shield_item',
        name: 'Shield',
        description: 'Gain 30 shield now, +10 shield every level up, and recover shield every 30s',
        assetPath: 'assets/items/shield.png',
        rarity: 'legendary',
        weight: 3,
        stackLimit: 8,
        effects: [
            { type: 'shieldGrant', value: 30 },
            { type: 'shieldOnLevelUp', value: 10 },
            { type: 'shieldRegen', value: 30, intervalMs: 30000 }
        ]
    }),
    passiveItemCard({
        key: 'shoe',
        name: 'Shoe',
        description: '+10% move speed',
        assetPath: 'assets/items/shoe.png',
        rarity: 'common',
        weight: 6,
        stackLimit: 8,
        effects: [{ type: 'speedPercent', value: 0.1 }]
    }),
    passiveItemCard({
        key: 'sunflower',
        name: 'Sunflower',
        description: '+10% pickup radius',
        assetPath: 'assets/items/sunflower.png',
        rarity: 'common',
        weight: 5,
        stackLimit: 8,
        effects: [{ type: 'lootMagnetRadiusPercent', value: 0.1 }]
    }),
    ...createSkillUpgradeCards({
        baseKey: 'card',
        name: 'Card Toss',
        assetPath: 'assets/items/card.png',
        skillKey: 'card_toss',
        rarity: 'rare',
        damageValue: 0.1,
        cooldownValue: -150
    }),
    ...createSkillUpgradeCards({
        baseKey: 'cross',
        name: 'Aura',
        assetPath: 'assets/items/cross.png',
        skillKey: 'aura',
        rarity: 'rare'
    }),
    ...createExplosionSkillUpgradeCards({
        baseKey: 'dragon_scale',
        name: 'Flame',
        inventoryName: 'Dragon Scale',
        assetPath: 'assets/items/dragon_scale.png',
        skillKey: 'flame',
        rarity: 'legendary',
        unlockWeight: 5,
        damageWeight: 4,
        objectWeight: 4,
        explosionRadiusWeight: 4,
        damageValue: 0.15,
        explosionRadiusValue: 0.2
    }),
    ...createEffectSkillUpgradeCards({
        baseKey: 'icewarn',
        name: 'Ice',
        assetPath: 'assets/items/icewarn.png',
        skillKey: 'ice',
        rarity: 'rare'
    }),
    ...createSkillUpgradeCards({
        baseKey: 'knuck',
        name: 'Iron Fist',
        assetPath: 'assets/items/knuck.png',
        skillKey: 'iron_fist',
        rarity: 'rare'
    }),
    ...createSkillUpgradeCards({
        baseKey: 'lantern',
        name: 'Fire',
        assetPath: 'assets/items/lantern.png',
        skillKey: 'fire',
        rarity: 'rare'
    }),
    ...createSkillUpgradeCards({
        baseKey: 'lightning',
        name: 'Thunder',
        assetPath: 'assets/items/lightning.png',
        skillKey: 'thunder',
        rarity: 'rare'
    }),
    ...createSkillUpgradeCards({
        baseKey: 'mucoi',
        name: 'Mu Coi',
        assetPath: 'assets/items/mucoi.png',
        skillKey: 'mu_coi',
        rarity: 'rare'
    }),
    ...createSkillUpgradeCards({
        baseKey: 'shotingstar',
        name: 'Heaven Fall',
        assetPath: 'assets/items/shotingstar.png',
        skillKey: 'heavenfall',
        rarity: 'legendary'
    }),
    ...createSkillUpgradeCards({
        baseKey: 'waterwarn',
        name: 'Waterwarn',
        assetPath: 'assets/items/waterwarn.png',
        skillKey: 'waterwarn',
        rarity: 'rare'
    }),
    ...createSkillUpgradeCards({
        baseKey: 'woodwarn',
        name: 'Avada',
        assetPath: 'assets/items/woodwarn.png',
        skillKey: 'avada',
        rarity: 'rare'
    }),
    ...createSkillUpgradeCards({
        baseKey: 'charm',
        name: 'Charm',
        assetPath: 'assets/items/charm.png',
        skillKey: 'charm',
        rarity: 'rare'
    })
];

export const CARD_RARITY_STYLES = {
    common: {
        border: 0x9b9074,
        glow: 0x4b3a2a,
        badge: 0xb6ab90,
        text: '#efe6c8',
        panel: 0x241b14,
        accent: 0x4f4438,
        shadow: 0x120d09,
        outer: 0xd8c8a0
    },
    rare: {
        border: 0x6fc8d8,
        glow: 0x183742,
        badge: 0x9fe8f2,
        text: '#dcfaff',
        panel: 0x16242b,
        accent: 0x274450,
        shadow: 0x091217,
        outer: 0xc4fbff
    },
    legendary: {
        border: 0xe3bb59,
        glow: 0x523313,
        badge: 0xf6d680,
        text: '#fff2bf',
        panel: 0x2b1c0d,
        accent: 0x5b3d18,
        shadow: 0x140d05,
        outer: 0xffefad
    }
};
