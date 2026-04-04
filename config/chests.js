import { ENEMIES } from './enemies.js';
import { createPreShopCard } from './preShopCards.js';

export const CHEST_DROP_CONFIG = Object.freeze({
    normalEnemyDropChance: 0.03,
    bossDropChance: 1
});

export const CHEST_TYPE_CONFIG = Object.freeze({
    normal: Object.freeze({
        key: 'normal',
        itemKey: 'chest_normal',
        label: 'Normal Chest',
        color: '#cfd6df',
        dropWeight: 80
    }),
    good: Object.freeze({
        key: 'good',
        itemKey: 'chest_good',
        label: 'Good Chest',
        color: '#8df7a7',
        dropWeight: 15
    }),
    rare: Object.freeze({
        key: 'rare',
        itemKey: 'chest_rare',
        label: 'Rare Chest',
        color: '#ffbf69',
        dropWeight: 5
    })
});

export const CHEST_REWARD_CONFIG = Object.freeze({
    normal: Object.freeze([
        Object.freeze({ type: 'gold', min: 5, max: 10, weight: 1 }),
        Object.freeze({ type: 'xp', min: 20, max: 40, weight: 1 }),
        Object.freeze({ type: 'health', min: 20, max: 40, weight: 1 }),
        Object.freeze({
            type: 'enemy_spawn',
            weight: 1,
            enemyTypes: Object.freeze(['worm', 'bat', 'slime', 'rat', 'mummy', 'eyes']),
            maxHealth: 300
        })
    ]),
    good: Object.freeze([
        Object.freeze({ type: 'stat_card', rarityKey: 'normal', weight: 1 })
    ]),
    rare: Object.freeze([
        Object.freeze({ type: 'stat_card', rarityKey: 'epic', weight: 1 })
    ])
});

function getWeightedRandomEntry(entries = [], random = Math.random) {
    const validEntries = (entries ?? []).filter((entry) => (entry?.weight ?? 0) > 0);
    if (!validEntries.length) return null;
    const totalWeight = validEntries.reduce((sum, entry) => sum + Math.max(0, entry.weight ?? 0), 0);
    if (totalWeight <= 0) return validEntries[0];
    let roll = Math.max(0, random()) * totalWeight;
    for (const entry of validEntries) {
        roll -= Math.max(0, entry.weight ?? 0);
        if (roll <= 0) return entry;
    }
    return validEntries[0];
}

export function getChestTypeConfig(chestType) {
    return CHEST_TYPE_CONFIG[chestType] ?? null;
}

export function rollChestType({ isBoss = false } = {}, random = Math.random) {
    const dropChance = isBoss
        ? (CHEST_DROP_CONFIG.bossDropChance ?? 1)
        : (CHEST_DROP_CONFIG.normalEnemyDropChance ?? 0);
    if ((random?.() ?? Math.random()) > dropChance) return null;
    const selectedType = getWeightedRandomEntry(Object.values(CHEST_TYPE_CONFIG), random);
    return selectedType?.key ?? null;
}

export function rollChestReward(chestType, random = Math.random) {
    const chestConfig = getChestTypeConfig(chestType);
    if (!chestConfig) return null;
    const rewardEntry = getWeightedRandomEntry(CHEST_REWARD_CONFIG[chestType] ?? [], random);
    if (!rewardEntry) return null;

    if (rewardEntry.type === 'gold') {
        const amount = Phaser.Math.Between(rewardEntry.min ?? 5, rewardEntry.max ?? rewardEntry.min ?? 5);
        return {
            type: 'gold',
            amount,
            announcementText: `Gold +${amount}`,
            announcementColor: chestConfig.color
        };
    }

    if (rewardEntry.type === 'xp') {
        const amount = Phaser.Math.Between(rewardEntry.min ?? 20, rewardEntry.max ?? rewardEntry.min ?? 20);
        return {
            type: 'xp',
            amount,
            announcementText: `XP +${amount}`,
            announcementColor: chestConfig.color
        };
    }

    if (rewardEntry.type === 'health') {
        const amount = Phaser.Math.Between(rewardEntry.min ?? 20, rewardEntry.max ?? rewardEntry.min ?? 20);
        return {
            type: 'health',
            amount,
            announcementText: `Health +${amount}`,
            announcementColor: chestConfig.color
        };
    }

    if (rewardEntry.type === 'enemy_spawn') {
        const enemyTypes = Array.isArray(rewardEntry.enemyTypes) ? rewardEntry.enemyTypes.filter((enemyType) => ENEMIES[enemyType]) : [];
        const enemyType = enemyTypes.length
            ? enemyTypes[Phaser.Math.Between(0, enemyTypes.length - 1)]
            : 'worm';
        const enemyName = ENEMIES[enemyType]?.name ?? enemyType;
        return {
            type: 'enemy_spawn',
            enemyType,
            statsOverride: {
                maxHealth: rewardEntry.maxHealth ?? 300
            },
            announcementText: `${enemyName} Ambush`,
            announcementColor: chestConfig.color
        };
    }

    if (rewardEntry.type === 'stat_card') {
        const definitions = [
            'hp',
            'armor',
            'damage',
            'effect_damage',
            'attack_speed',
            'crit_chance',
            'speed',
            'regen',
            'lifesteal',
            'dodge'
        ];
        const baseKey = definitions[Phaser.Math.Between(0, definitions.length - 1)];
        const definition = {
            hp: { key: 'hp', label: 'Vitality', effectType: 'maxHealth', unit: '', values: { normal: 10, epic: 20, legendary: 30 } },
            armor: { key: 'armor', label: 'Armor', effectType: 'armor', unit: '', values: { normal: 1, epic: 2, legendary: 3 } },
            damage: { key: 'damage', label: 'Damage', effectType: 'damage', unit: '%', values: { normal: 0.03, epic: 0.07, legendary: 0.10 } },
            effect_damage: { key: 'effect_damage', label: 'Effect Damage', effectType: 'effectDamageMultiplier', unit: '%', values: { normal: 0.05, epic: 0.07, legendary: 0.10 } },
            attack_speed: { key: 'attack_speed', label: 'Attack Speed', effectType: 'attackSpeed', unit: '%', values: { normal: 0.05, epic: 0.07, legendary: 0.10 } },
            crit_chance: { key: 'crit_chance', label: 'Crit Chance', effectType: 'critChance', unit: '%', values: { normal: 0.03, epic: 0.05, legendary: 0.07 } },
            speed: { key: 'speed', label: 'Move Speed', effectType: 'speedPercent', unit: '%', values: { normal: 0.03, epic: 0.07, legendary: 0.10 } },
            regen: { key: 'regen', label: 'Regen', effectType: 'healthRegenPerSecond', unit: '', values: { normal: 0.3, epic: 0.5, legendary: 0.7 } },
            lifesteal: { key: 'lifesteal', label: 'Lifesteal', effectType: 'lifesteal', unit: '%', values: { normal: 0.01, epic: 0.02, legendary: 0.03 } },
            dodge: { key: 'dodge', label: 'Dodge', effectType: 'dodge', unit: '%', values: { normal: 0.03, epic: 0.05, legendary: 0.07 } }
        }[baseKey];
        const card = createPreShopCard(definition, rewardEntry.rarityKey ?? 'normal');
        return {
            type: 'stat_card',
            card,
            announcementText: card?.shortText ?? 'Stat Card',
            announcementColor: chestConfig.color
        };
    }

    return null;
}
