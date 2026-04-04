export const ITEM_CONFIG = {
    xp_orb: {
        textureKey: 'xp_orb_icon',
        assetPath: 'assets/shopitem/xp.png',
        label: 'XP Orb',
        type: 'xp',
        baseValue: 5,
        outerColor: 0x4fe4ff,
        innerColor: 0xffffff,
        size: 9,
        displayScale: 1,
        pickupTextColor: '#a0f5ff',
        floatAmplitude: 3,
        displaySize: 9
    },
    gold_coin: {
        textureKey: 'item_gold_coin',
        assetPath: 'assets/shopitem/coin.png',
        label: 'Gold Coin',
        type: 'gold',
        baseValue: 1,
        outerColor: 0xf5d350,
        innerColor: 0xc37f08,
        size: 10,
        displayScale: 1,
        pickupTextColor: '#ffe066',
        floatAmplitude: 5,
        displaySize: 10
    },
    health_flask: {
        textureKey: 'item_hp',
        label: 'Health Flask',
        type: 'health',
        baseValue: 18,
        outerColor: 0xff7fa3,
        innerColor: 0xffffff,
        size: 8,
        displayScale: 1,
        pickupTextColor: '#ffb8c9',
        floatAmplitude: 5,
        displaySize: 8
    },
    chest_normal: {
        textureKey: 'item_chest_normal',
        assetPath: 'assets/shopitem/chestnormal.png',
        label: 'Normal Chest',
        type: 'chest',
        chestType: 'normal',
        baseValue: 1,
        pickupDelayMs: 900,
        displayScale: 1,
        pickupTextColor: '#cfd6df',
        floatAmplitude: 5,
        displaySize: 16
    },
    chest_good: {
        textureKey: 'item_chest_good',
        assetPath: 'assets/shopitem/chestgood.png',
        label: 'Good Chest',
        type: 'chest',
        chestType: 'good',
        baseValue: 1,
        pickupDelayMs: 900,
        displayScale: 1,
        pickupTextColor: '#8df7a7',
        floatAmplitude: 5,
        displaySize: 16
    },
    chest_rare: {
        textureKey: 'item_chest_rare',
        assetPath: 'assets/shopitem/chestrare.png',
        label: 'Rare Chest',
        type: 'chest',
        chestType: 'rare',
        baseValue: 1,
        pickupDelayMs: 900,
        displayScale: 1,
        pickupTextColor: '#ffbf69',
        floatAmplitude: 5,
        displaySize: 16
    }
};

const DEFAULT_LOOT_TABLE = [
    { itemKey: 'xp_orb', chance: 0.98, minAmount: 1, maxAmount: 2 },
    { itemKey: 'gold_coin', chance: 1, minAmount: 1, maxAmount: 3 }
];

const ENEMY_LOOT_TABLES = {
    skeleton: [
          { itemKey: 'gold_coin', chance: 1, minAmount: 2, maxAmount: 6 }
    ]
};

const LOOT_TABLES = {
    default: DEFAULT_LOOT_TABLE,
    ...ENEMY_LOOT_TABLES
};

export function getLootTableForEnemy(enemyType) {
    const baseEntries = LOOT_TABLES.default ?? [];
    const enemyEntries = ENEMY_LOOT_TABLES[enemyType] ?? [];
    if (!enemyEntries.length) {
        return baseEntries;
    }
    const organized = new Map();
    baseEntries.forEach(entry => {
        if (entry?.itemKey) {
            organized.set(entry.itemKey, { ...entry });
        }
    });
    enemyEntries.forEach(entry => {
        if (entry?.itemKey) {
            organized.set(entry.itemKey, { ...entry });
        }
    });
    return Array.from(organized.values());
}
