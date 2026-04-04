const CARD_RARITY_ORDER = ['normal', 'epic', 'legendary'];

export const PRE_SHOP_CARD_RARITIES = Object.freeze({
    normal: Object.freeze({
        key: 'normal',
        label: 'Normal',
        color: 0xa3a3a3,
        accentColor: 0xd9d9d9,
        weight: 60,
        unlockWave: 1
    }),
    epic: Object.freeze({
        key: 'epic',
        label: 'Epic',
        color: 0x3e9b54,
        accentColor: 0x92ef8a,
        weight: 30,
        unlockWave: 5
    }),
    legendary: Object.freeze({
        key: 'legendary',
        label: 'Legendary',
        color: 0xc96b21,
        accentColor: 0xffc36b,
        weight: 10,
        unlockWave: 10
    })
});

const PRE_SHOP_CARD_DEFINITIONS = Object.freeze([
    Object.freeze({
        key: 'hp',
        label: 'Vitality',
        effectType: 'maxHealth',
        unit: '',
        values: Object.freeze({
            normal: 10,
            epic: 20,
            legendary: 30
        })
    }),
    Object.freeze({
        key: 'armor',
        label: 'Armor',
        effectType: 'armor',
        unit: '',
        values: Object.freeze({
            normal: 1,
            epic: 2,
            legendary: 3
        })
    }),
    Object.freeze({
        key: 'damage',
        label: 'Damage',
        effectType: 'damage',
        unit: '%',
        values: Object.freeze({
            normal: 0.03,
            epic: 0.07,
            legendary: 0.10
        })
    }),
    Object.freeze({
        key: 'effect_damage',
        label: 'Effect Damage',
        effectType: 'effectDamageMultiplier',
        unit: '%',
        values: Object.freeze({
            normal: 0.05,
            epic: 0.07,
            legendary: 0.10
        })
    }),
    Object.freeze({
        key: 'attack_speed',
        label: 'Attack Speed',
        effectType: 'attackSpeed',
        unit: '%',
        values: Object.freeze({
            normal: 0.05,
            epic: 0.07,
            legendary: 0.10
        })
    }),
    Object.freeze({
        key: 'crit_chance',
        label: 'Crit Chance',
        effectType: 'critChance',
        unit: '%',
        values: Object.freeze({
            normal: 0.03,
            epic: 0.05,
            legendary: 0.07
        })
    }),
    Object.freeze({
        key: 'speed',
        label: 'Move Speed',
        effectType: 'speedPercent',
        unit: '%',
        values: Object.freeze({
            normal: 0.03,
            epic: 0.07,
            legendary: 0.10
        })
    }),
    Object.freeze({
        key: 'regen',
        label: 'Regen',
        effectType: 'healthRegenPerSecond',
        unit: '',
        values: Object.freeze({
            normal: 0.3,
            epic: 0.5,
            legendary: 0.7
        })
    }),
    Object.freeze({
        key: 'lifesteal',
        label: 'Lifesteal',
        effectType: 'lifesteal',
        unit: '%',
        values: Object.freeze({
            normal: 0.01,
            epic: 0.02,
            legendary: 0.03
        })
    }),
    Object.freeze({
        key: 'dodge',
        label: 'Dodge',
        effectType: 'dodge',
        unit: '%',
        values: Object.freeze({
            normal: 0.03,
            epic: 0.05,
            legendary: 0.07
        })
    })
]);

export function getUnlockedPreShopCardRarityKeys(waveNumber = 1) {
    const resolvedWave = Math.max(1, Math.round(waveNumber));
    return CARD_RARITY_ORDER.filter((rarityKey) => {
        const config = PRE_SHOP_CARD_RARITIES[rarityKey];
        return config && resolvedWave >= (config.unlockWave ?? 1);
    });
}

export function getWeightedRandomPreShopCardRarity(waveNumber = 1, random = Math.random) {
    const unlockedRarityKeys = getUnlockedPreShopCardRarityKeys(waveNumber);
    if (!unlockedRarityKeys.length) return 'normal';
    const totalWeight = unlockedRarityKeys.reduce((sum, rarityKey) => {
        return sum + Math.max(0, PRE_SHOP_CARD_RARITIES[rarityKey]?.weight ?? 0);
    }, 0);
    if (totalWeight <= 0) {
        return unlockedRarityKeys[0];
    }
    let roll = Math.max(0, random()) * totalWeight;
    for (const rarityKey of unlockedRarityKeys) {
        roll -= Math.max(0, PRE_SHOP_CARD_RARITIES[rarityKey]?.weight ?? 0);
        if (roll <= 0) {
            return rarityKey;
        }
    }
    return unlockedRarityKeys[0];
}

function formatCardValue(rawValue = 0, unit = '') {
    if (unit === '%') {
        return `${Math.round(rawValue * 100)}%`;
    }
    if (Math.abs(rawValue) >= 1 || Number.isInteger(rawValue)) {
        return `${Math.round(rawValue * 10) / 10}`;
    }
    return `${Math.round(rawValue * 10) / 10}`;
}

export function createPreShopCard(definition, rarityKey = 'normal') {
    if (!definition) return null;
    const rarity = PRE_SHOP_CARD_RARITIES[rarityKey] ?? PRE_SHOP_CARD_RARITIES.normal;
    const rawValue = definition.values?.[rarity.key] ?? 0;
    const sign = rawValue >= 0 ? '+' : '';
    const valueText = `${sign}${formatCardValue(rawValue, definition.unit ?? '')}`;
    return Object.freeze({
        id: `${definition.key}_${rarity.key}`,
        baseKey: definition.key,
        label: definition.label,
        rarityKey: rarity.key,
        rarityLabel: rarity.label,
        rarityColor: rarity.color,
        rarityAccentColor: rarity.accentColor,
        value: rawValue,
        valueText,
        shortText: `${definition.label} ${valueText}`,
        description: `${definition.label} ${valueText}`,
        effects: Object.freeze([
            Object.freeze({
                type: definition.effectType,
                value: rawValue
            })
        ])
    });
}

export function getRandomPreShopCards(count = 4, waveNumber = 1, random = Math.random) {
    const resolvedCount = Math.max(1, Math.min(Math.round(count) || 0, PRE_SHOP_CARD_DEFINITIONS.length));
    const shuffledDefinitions = Phaser.Utils.Array.Shuffle([...PRE_SHOP_CARD_DEFINITIONS]);
    return shuffledDefinitions.slice(0, resolvedCount).map((definition) => {
        const rarityKey = getWeightedRandomPreShopCardRarity(waveNumber, random);
        return createPreShopCard(definition, rarityKey);
    }).filter(Boolean);
}
