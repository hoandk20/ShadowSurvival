const SHARED_STRONG_COSTS = Object.freeze([160, 230, 320, 440, 600]);
const SHARED_STANDARD_COSTS = Object.freeze([120, 180, 260, 360, 500]);

export const META_UPGRADE_GROUPS = Object.freeze([
    Object.freeze({ key: 'survival', label: 'Survival' }),
    Object.freeze({ key: 'economy', label: 'Economy' }),
    Object.freeze({ key: 'combat', label: 'Combat' })
]);

export const META_UPGRADE_CONFIG = Object.freeze([
    Object.freeze({
        key: 'max_hp',
        group: 'survival',
        label: 'Max HP',
        iconKey: 'meta_max_hp',
        iconPath: 'assets/menu/meta/maxhp.png',
        bonusText: '+6 HP',
        maxText: '+30 HP',
        description: 'Increase starting max HP for every run.',
        costs: SHARED_STANDARD_COSTS,
        effectType: 'maxHealth',
        values: Object.freeze([6, 12, 18, 24, 30]),
        formatter: (value) => `+${Math.round(value)} HP`
    }),
    Object.freeze({
        key: 'armor',
        group: 'survival',
        label: 'Armor',
        iconKey: 'meta_armor',
        iconPath: 'assets/menu/meta/armo.png',
        bonusText: '+0.4',
        maxText: '+2',
        description: 'Add flat armor at run start.',
        costs: SHARED_STRONG_COSTS,
        effectType: 'armor',
        values: Object.freeze([0.4, 0.8, 1.2, 1.6, 2]),
        formatter: (value) => `+${trimNumber(value)}`
    }),
    Object.freeze({
        key: 'regen',
        group: 'survival',
        label: 'Regen',
        iconKey: 'meta_regen',
        iconPath: 'assets/menu/meta/regen.png',
        bonusText: '+0.12 HP/s',
        maxText: '+0.6 HP/s',
        description: 'Grant passive health regen each second.',
        costs: SHARED_STANDARD_COSTS,
        effectType: 'healthRegenPerSecond',
        values: Object.freeze([0.12, 0.24, 0.36, 0.48, 0.6]),
        formatter: (value) => `+${trimNumber(value)} HP/s`
    }),
    Object.freeze({
        key: 'pickup_range',
        group: 'survival',
        label: 'Pickup Range',
        iconKey: 'meta_pickup_range',
        iconPath: 'assets/menu/meta/pickuprange.png',
        bonusText: '+6%',
        maxText: '+30%',
        description: 'Increase loot pickup radius.',
        costs: SHARED_STANDARD_COSTS,
        effectType: 'lootMagnetRadiusPercent',
        values: Object.freeze([0.06, 0.12, 0.18, 0.24, 0.3]),
        formatter: (value) => `+${Math.round(value * 100)}%`
    }),
    Object.freeze({
        key: 'gold_gain',
        group: 'economy',
        label: 'Gold Gain',
        iconKey: 'meta_gold_gain',
        iconPath: 'assets/menu/meta/goldGain.png',
        bonusText: '+3%',
        maxText: '+15%',
        description: 'Increase gold earned during runs.',
        costs: SHARED_STRONG_COSTS,
        effectType: 'goldGainMultiplier',
        values: Object.freeze([0.03, 0.06, 0.09, 0.12, 0.15]),
        formatter: (value) => `+${Math.round(value * 100)}%`
    }),
    Object.freeze({
        key: 'xp_gain',
        group: 'economy',
        label: 'XP Gain',
        iconKey: 'meta_xp_gain',
        iconPath: 'assets/menu/meta/xpgain.png',
        bonusText: '+4%',
        maxText: '+20%',
        description: 'Increase XP gained from pickups.',
        costs: SHARED_STRONG_COSTS,
        effectType: 'xpGainPercent',
        values: Object.freeze([0.04, 0.08, 0.12, 0.16, 0.2]),
        formatter: (value) => `+${Math.round(value * 100)}%`
    }),
    Object.freeze({
        key: 'shop_reroll_discount',
        group: 'economy',
        label: 'Shop Reroll Discount',
        iconKey: 'meta_reroll_discount',
        iconPath: 'assets/menu/meta/rerolldiscount.png',
        bonusText: '-1 gold',
        maxText: '-5 gold',
        description: 'Lower normal shop reroll cost. Cost floor is 6 gold.',
        costs: SHARED_STRONG_COSTS,
        metaBonusType: 'shopRerollDiscount',
        values: Object.freeze([1, 2, 3, 4, 5]),
        formatter: (value) => `-${Math.round(value)} gold`
    }),
    Object.freeze({
        key: 'pre_shop_reroll',
        group: 'economy',
        label: 'Pre-shop Reroll',
        iconKey: 'meta_pre_shop_reroll',
        iconPath: 'assets/menu/meta/extrashopreroll.png',
        bonusText: 'Lv1: +1 reroll, Lv2: +1 reroll',
        maxText: '+2 reroll',
        description: 'Add more rerolls to the pre-shop card choice.',
        costs: Object.freeze([420, 680]),
        metaBonusType: 'preShopExtraRerolls',
        values: Object.freeze([1, 2]),
        formatter: (value) => `+${Math.round(value)} reroll`
    }),
    Object.freeze({
        key: 'supporter_reroll',
        group: 'economy',
        label: 'Supporter Reroll',
        iconKey: 'meta_supporter_reroll',
        iconPath: 'assets/menu/meta/extrasupporterreroll.png',
        bonusText: 'Lv1: +1 reroll, Lv2: +1 reroll',
        maxText: '+2 reroll',
        description: 'Add more rerolls to the supporter choice.',
        costs: Object.freeze([500, 780]),
        metaBonusType: 'supporterExtraRerolls',
        values: Object.freeze([1, 2]),
        formatter: (value) => `+${Math.round(value)} reroll`
    }),
    Object.freeze({
        key: 'damage',
        group: 'combat',
        label: 'Damage',
        iconKey: 'meta_damage',
        iconPath: 'assets/menu/meta/damagemultiplier.png',
        bonusText: '+2.5%',
        maxText: '+12.5%',
        description: 'Increase global damage multiplier.',
        costs: SHARED_STRONG_COSTS,
        effectType: 'damage',
        values: Object.freeze([0.025, 0.05, 0.075, 0.1, 0.125]),
        formatter: (value) => `+${trimPercent(value)}%`
    }),
    Object.freeze({
        key: 'attack_speed',
        group: 'combat',
        label: 'Attack Speed',
        iconKey: 'meta_attack_speed',
        iconPath: 'assets/menu/meta/attackspeed.png',
        bonusText: '+2%',
        maxText: '+10%',
        description: 'Make all skills fire more often.',
        costs: SHARED_STRONG_COSTS,
        effectType: 'attackSpeed',
        values: Object.freeze([0.02, 0.04, 0.06, 0.08, 0.1]),
        formatter: (value) => `+${Math.round(value * 100)}%`
    }),
    Object.freeze({
        key: 'crit_chance',
        group: 'combat',
        label: 'Crit Chance',
        iconKey: 'meta_crit_chance',
        iconPath: 'assets/menu/meta/critchance.png',
        bonusText: '+1.5%',
        maxText: '+7.5%',
        description: 'Add flat crit chance to all skills.',
        costs: SHARED_STRONG_COSTS,
        effectType: 'critChance',
        values: Object.freeze([0.015, 0.03, 0.045, 0.06, 0.075]),
        formatter: (value) => `+${trimPercent(value)}%`
    }),
    Object.freeze({
        key: 'effect_chance',
        group: 'combat',
        label: 'Effect Chance',
        iconKey: 'meta_effect_chance',
        iconPath: 'assets/menu/meta/effectchance.png',
        bonusText: '+2%',
        maxText: '+10%',
        description: 'Increase status effect application chance.',
        costs: SHARED_STRONG_COSTS,
        effectType: 'effectChance',
        values: Object.freeze([0.02, 0.04, 0.06, 0.08, 0.1]),
        formatter: (value) => `+${Math.round(value * 100)}%`
    })
]);

export const META_UPGRADE_CONFIG_MAP = Object.freeze(Object.fromEntries(
    META_UPGRADE_CONFIG.map((entry) => [entry.key, entry])
));

export function getMetaUpgradeDefinition(key) {
    return META_UPGRADE_CONFIG_MAP[key] ?? null;
}

export function getMetaUpgradeLevel(levels = {}, key = '') {
    const definition = getMetaUpgradeDefinition(key);
    if (!definition) return 0;
    const rawLevel = Math.floor(Number(levels?.[key] ?? 0));
    return Phaser.Math.Clamp(rawLevel, 0, definition.costs.length);
}

export function getMetaUpgradeMaxLevel(keyOrDefinition) {
    const definition = typeof keyOrDefinition === 'string'
        ? getMetaUpgradeDefinition(keyOrDefinition)
        : keyOrDefinition;
    return Math.max(0, definition?.costs?.length ?? 0);
}

export function getMetaUpgradeNextCost(keyOrDefinition, level = 0) {
    const definition = typeof keyOrDefinition === 'string'
        ? getMetaUpgradeDefinition(keyOrDefinition)
        : keyOrDefinition;
    const safeLevel = Math.max(0, Math.floor(level));
    return definition?.costs?.[safeLevel] ?? null;
}

export function getMetaUpgradeTotalValue(keyOrDefinition, level = 0) {
    const definition = typeof keyOrDefinition === 'string'
        ? getMetaUpgradeDefinition(keyOrDefinition)
        : keyOrDefinition;
    const safeLevel = Math.max(0, Math.floor(level));
    if (!definition || safeLevel <= 0) return 0;
    return definition.values?.[safeLevel - 1] ?? 0;
}

export function formatMetaUpgradeValue(keyOrDefinition, value = 0) {
    const definition = typeof keyOrDefinition === 'string'
        ? getMetaUpgradeDefinition(keyOrDefinition)
        : keyOrDefinition;
    if (!definition) return `${value}`;
    return definition.formatter?.(value) ?? `${value}`;
}

export function getMetaUpgradeBonuses(levels = {}) {
    const bonuses = {
        playerEffects: [],
        shopRerollDiscount: 0,
        preShopExtraRerolls: 0,
        supporterExtraRerolls: 0
    };
    META_UPGRADE_CONFIG.forEach((definition) => {
        const level = getMetaUpgradeLevel(levels, definition.key);
        if (level <= 0) return;
        const value = getMetaUpgradeTotalValue(definition, level);
        if (!value) return;
        if (definition.effectType) {
            bonuses.playerEffects.push({
                type: definition.effectType,
                value
            });
            return;
        }
        if (definition.metaBonusType) {
            bonuses[definition.metaBonusType] = value;
        }
    });
    return bonuses;
}

function trimNumber(value = 0) {
    return `${Math.round(value * 100) / 100}`.replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
}

function trimPercent(value = 0) {
    return trimNumber(value * 100);
}
