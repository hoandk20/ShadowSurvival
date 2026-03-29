export const ITEM_CONFIG = {
    xp_orb: {
        textureKey: 'xp_orb_icon',
        label: 'XP Orb',
        type: 'xp',
        baseValue: 20,
        outerColor: 0x4fe4ff,
        innerColor: 0xffffff,
        size: 11,
        displayScale: 1,
        pickupTextColor: '#a0f5ff',
        floatAmplitude: 3,
        assetPath: 'assets/items/exp.png',
        displaySize: 11
    },
    gold_coin: {
        textureKey: 'item_gold_coin',
        label: 'Gold Coin',
        type: 'gold',
        baseValue: 3,
        outerColor: 0xf5d350,
        innerColor: 0xc37f08,
        size: 11,
        displayScale: 1,
        pickupTextColor: '#ffe066',
        floatAmplitude: 5
        ,
        displaySize: 11
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
        floatAmplitude: 5
        ,
        assetPath: 'assets/items/hp.png',
        displaySize: 8
    }
};

const DEFAULT_LOOT_TABLE = [
    { itemKey: 'xp_orb', chance: 0.98, minAmount: 1, maxAmount: 2 },
    { itemKey: 'gold_coin', chance: 0.01, minAmount: 1, maxAmount: 4 },
    { itemKey: 'health_flask', chance: 0.03, minAmount: 10, maxAmount: 26 }
];

const ENEMY_LOOT_TABLES = {
    skeleton: [
          { itemKey: 'gold_coin', chance: 0.01, minAmount: 2, maxAmount: 6 },
        { itemKey: 'health_flask', chance: 0.01, minAmount: 14, maxAmount: 28 }
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
