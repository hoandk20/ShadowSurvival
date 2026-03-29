const itemCard = ({
    key,
    name,
    description,
    assetPath,
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

export const CARD_CONFIG = [
    itemCard({
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
    itemCard({
        key: 'heart',
        name: 'Heart',
        description: '+30% Max HP',
        assetPath: 'assets/items/heart.png',
        rarity: 'rare',
        weight: 4,
        stackLimit: 8,
        effects: [{ type: 'maxHealthPercent', value: 0.3 }]
    }),
    itemCard({
        key: 'plant',
        name: 'Plant',
        description: '+10% skill area, orbit radius, and projectile hitbox',
        assetPath: 'assets/items/plant.png',
        rarity: 'rare',
        weight: 4,
        stackLimit: 8,
        effects: [{ type: 'allSkillAreaPercent', value: 0.1 }]
    }),
    itemCard({
        key: 'leaf',
        name: 'Leaf',
        description: '+0.5 HP regen per second',
        assetPath: 'assets/items/leaf.png',
        rarity: 'common',
        weight: 5,
        stackLimit: 8,
        effects: [{ type: 'healthRegenPerSecond', value: 0.5 }]
    }),
    itemCard({
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
    itemCard({
        key: 'shoe',
        name: 'Shoe',
        description: '+10% move speed',
        assetPath: 'assets/items/shoe.png',
        rarity: 'common',
        weight: 6,
        stackLimit: 8,
        effects: [{ type: 'speedPercent', value: 0.1 }]
    }),
    itemCard({
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
    ...createSkillUpgradeCards({
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
    common: { border: 0x5d78a6, glow: 0x2a3f66, badge: 0x6f8bc2, text: '#d7e4ff' },
    rare: { border: 0x9b6bcc, glow: 0x4c2f6a, badge: 0xb089eb, text: '#f0ddff' },
    legendary: { border: 0xc99c4b, glow: 0x6a4b1b, badge: 0xe0b86a, text: '#fff0c6' }
};
