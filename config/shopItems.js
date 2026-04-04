const DEFAULT_COST_BY_TYPE = Object.freeze({
    stat: 90,
    hybrid: 59,
    effect: 53,
    utility: 50
});

const SHOP_ITEM_TYPE_WEIGHTS = Object.freeze({
    stat: 0.5,
    hybrid: 0.35,
    effect: 0.1,
    utility: 0.05,
    unlock_element: 0.1
});

const createShopItem = ({
    id,
    name,
    type = 'stat',
    cost = DEFAULT_COST_BY_TYPE[type] ?? 120,
    assetPath = null,
    shortText = null,
    modifiers = null,
    effectBonuses = null,
    special = null,
    unlockElement = null,
    availability = null
}) => ({
    id,
    name,
    type,
    cost,
    assetPath,
    shortText,
    iconKey: `shop_item_${id}`,
    modifiers: modifiers ? { ...modifiers } : null,
    effectBonuses: effectBonuses ? { ...effectBonuses } : null,
    special: special ? { ...special } : null,
    availability: availability ? { ...availability } : null,
    unlockElement: unlockElement
        ? {
            ...unlockElement,
            tags: Array.isArray(unlockElement.tags) ? [...unlockElement.tags] : [],
            statusEntry: unlockElement.statusEntry ? { ...unlockElement.statusEntry } : null
        }
        : null
});

export const SHOP_ITEM_CONFIG = Object.freeze([
    createShopItem({ id: 'iron_sword', name: 'Iron Sword', type: 'stat', cost: 43, assetPath: 'assets/shopitem/iron_sword.png', modifiers: { damageMultiplier: 0.1, skillRange: -5 } }),
    createShopItem({ id: 'sharpened_blade', name: 'Sharpened Blade', type: 'stat', cost: 43, assetPath: 'assets/shopitem/sharpened_blade.png', modifiers: { critChance: 0.05 } }),
    createShopItem({ id: 'heavy_edge', name: 'Heavy Edge', type: 'stat', cost: 43, assetPath: 'assets/shopitem/heavy_edge.png', modifiers: { critMultiplier: 0.1, skillRange: -10 } }),
    createShopItem({ id: 'quick_gloves', name: 'Quick Gloves', type: 'stat', cost: 45, assetPath: 'assets/shopitem/quick_gloves.png', modifiers: { attackSpeed: 0.18, moveSpeed: -5 } }),
    createShopItem({ id: 'battle_focus', name: 'Battle Focus', type: 'stat', cost: 51, assetPath: 'assets/shopitem/battle_focus.png', modifiers: { damageMultiplier: 0.1, critChance: 0.08, armor: -10 } }),
    createShopItem({ id: 'steel_armor', name: 'Steel Armor', type: 'stat', cost: 42, assetPath: 'assets/shopitem/steel_armor.png', modifiers: { armor: 3, hp: -10 } }),
    createShopItem({ id: 'vital_ring', name: 'Vital Ring', type: 'stat', cost: 42, assetPath: 'assets/shopitem/vital_ring.png', modifiers: { hp: 30, armor: -1 } }),
    createShopItem({ id: 'regeneration_charm', name: 'Regeneration Charm', type: 'stat', cost: 42, assetPath: 'assets/shopitem/regeneration_charm.png', modifiers: { healthRegenPerSecond: 1, hp: -10 } }),
    createShopItem({ id: 'blood_pendant', name: 'Blood Pendant', type: 'stat', cost: 45, assetPath: 'assets/shopitem/blood_pendant.png', modifiers: { lifesteal: 0.05, attackSpeed: -0.1 } }),
    createShopItem({ id: 'guardian_core', name: 'Guardian Core', type: 'stat', cost: 60, assetPath: 'assets/shopitem/guardian_core.png', modifiers: { shield: 25, xpGainMultiplier: 0.2, armor: -1 } }),
    createShopItem({ id: 'swift_boots', name: 'Swift Boots', type: 'stat', cost: 40, assetPath: 'assets/shopitem/swift_boots.png', modifiers: { moveSpeed: 15, attackSpeed: -0.05 } }),
    createShopItem({ id: 'wide_grip', name: 'Wide Grip', type: 'stat', cost: 42, assetPath: 'assets/shopitem/wide_grip.png', modifiers: { effectDamageMultiplier: 0.1, damageMultiplier: -0.05 } }),
    createShopItem({ id: 'extended_core', name: 'Extended Core', type: 'stat', cost: 47, assetPath: 'assets/shopitem/extended_core.png', modifiers: { skillRange: 10, moveSpeed: -5 } }),
    createShopItem({
        id: 'extra_barrel',
        name: 'Extra Barrel',
        type: 'stat',
        cost: 70,
        assetPath: 'assets/shopitem/extra_barrel.png',
        shortText: '+1 projectile, but lowers damage per shot.',
        modifiers: { projectileCount: 1 },
        availability: { excludesCharacterKeys: ['knight'] }
    }),
    createShopItem({ id: 'cooldown_module', name: 'Cooldown Module', type: 'stat', cost: 40, assetPath: 'assets/shopitem/cooldown_module.png', modifiers: { attackSpeed: 0.15, healthRegenPerSecond: -0.5 } }),
    createShopItem({ id: 'combat_injector', name: 'Combat Injector', type: 'stat', cost: 47, assetPath: 'assets/shopitem/combat_injector.png', modifiers: { attackSpeed: 0.08, damageMultiplier: 0.08, effectDamageMultiplier: -0.1 } }),
    createShopItem({ id: 'force_core', name: 'Force Core', type: 'stat', cost: 47, assetPath: 'assets/shopitem/force_core.png', modifiers: { knockbackMultiplier: 0.4, damageMultiplier: 0.05, hp: -10 } }),
    createShopItem({ id: 'glass_cannon', name: 'Glass Cannon', type: 'hybrid', cost: 40, assetPath: 'assets/shopitem/glass_cannon.png', modifiers: { damageMultiplier: 0.2, armor: -10 } }),
    createShopItem({ id: 'berserker_blood', name: 'Berserker Blood', type: 'hybrid', cost: 40, assetPath: 'assets/shopitem/berserker_blood.png', modifiers: { dodge: 0.15, hp: -20 } }),
    createShopItem({ id: 'sniper_scope', name: 'Sniper Scope', type: 'hybrid', cost: 40, assetPath: 'assets/shopitem/sniper_scope.png', modifiers: { critChance: 0.15, attackSpeed: -0.25 } }),
    createShopItem({
        id: 'heavy_core',
        name: 'Heavy Payload',
        type: 'hybrid',
        cost: 40,
        assetPath: 'assets/shopitem/heavy_core.png',
        modifiers: { projectileCount: 1, damageMultiplier: 0.1, attackSpeed: -0.15 },
        availability: { excludesCharacterKeys: ['knight'] }
    }),
    createShopItem({ id: 'overcharged_reactor', name: 'Overcharged Reactor', type: 'hybrid', cost: 39, assetPath: 'assets/shopitem/overcharged_reactor.png', modifiers: { skillRange: 10, attackSpeed: -0.15 } }),
    createShopItem({ id: 'unstable_shield', name: 'Unstable Shield', type: 'hybrid', cost: 33, assetPath: 'assets/shopitem/unstable_shield2.png', modifiers: { shield: 30, armor: -2 } }),
    createShopItem({ id: 'speed_injector', name: 'Speed Injector', type: 'hybrid', cost: 33, assetPath: 'assets/shopitem/speed_injector.png', modifiers: { moveSpeed: 20, damageMultiplier: -0.15 } }),
    createShopItem({ id: 'overgrowth_engine', name: 'Overgrowth Engine', type: 'hybrid', cost: 33, assetPath: 'assets/shopitem/overgrowth_engine.png', modifiers: { areaSizeMultiplier: 0.2, attackSpeed: -0.1 } }),
    createShopItem({ id: 'time_distorter', name: 'Time Distorter', type: 'hybrid', cost: 38, assetPath: 'assets/shopitem/time_distorter.png', modifiers: { armor: -2, dodge: 0.1 } }),
    createShopItem({ id: 'abyssal_catalyst', name: 'Abyssal Catalyst', type: 'hybrid', cost: 33, assetPath: 'assets/shopitem/Abyssal_Catalyst.png', modifiers: { damageMultiplier: 0.35, effectDamageMultiplier: 0.25, healthRegenPerSecond: -4 } }),
    createShopItem({ id: 'singularity_field', name: 'Singularity Field', type: 'hybrid', cost: 32, assetPath: 'assets/shopitem/Singularity_Field.png', modifiers: { areaSizeMultiplier: 0.5, knockbackMultiplier: 0.5, damageMultiplier: -0.15 } }),
    createShopItem({ id: 'phantom_stride', name: 'Phantom Stride', type: 'hybrid', cost: 30, assetPath: 'assets/shopitem/Phantom_Stride.png', modifiers: { moveSpeed: 30, pickupRangeMultiplier: 0.4, armor: -4 } }),
    createShopItem({ id: 'rotheart_sigil', name: 'Rotheart Sigil', type: 'hybrid', cost: 32, assetPath: 'assets/shopitem/Rotheart_Sigil.png', modifiers: { effectChance: 0.25, effectDamageMultiplier: 0.3, damageMultiplier: -0.2 } }),
    createShopItem({ id: 'fractured_tempo', name: 'Fractured Tempo', type: 'hybrid', cost: 33, assetPath: 'assets/shopitem/Fractured_Tempo.png', modifiers: { attackSpeed: 0.4, damageMultiplier: -0.25, knockbackMultiplier: -0.3 } }),
    createShopItem({ id: 'vampire_pact', name: 'Vampire Pact', type: 'hybrid', cost: 32, assetPath: 'assets/shopitem/vampire_pact.png', modifiers: { lifesteal: 0.1, hp: -50 } }),
    createShopItem({ id: 'reckless_core', name: 'Reckless Core', type: 'hybrid', cost: 32, assetPath: 'assets/shopitem/reckless_core.png', modifiers: { critMultiplier: 0.2, hp: -15 } }),
    createShopItem({ id: 'impact_engine', name: 'Impact Engine', type: 'hybrid', cost: 50, assetPath: 'assets/shopitem/impact_engine.png', modifiers: { knockbackMultiplier: 0.3, damageMultiplier: 0.1 } }),
    createShopItem({ id: 'toxic_catalyst', name: 'Toxic Catalyst', type: 'effect', cost: 56, assetPath: 'assets/shopitem/toxic_catalyst.png', modifiers: { effectChance: 0.2, effectDamageMultiplier: 0.15, dodge: -0.07 } }),
    createShopItem({ id: 'lingering_curse', name: 'Lingering Curse', type: 'effect', cost: 73, assetPath: 'assets/shopitem/lingering_curse.png', modifiers: { attackSpeed: 0.2, effectDurationMultiplier: 0.25 } }),
    createShopItem({
        id: 'chain_amplifier',
        name: 'Chain Amplifier',
        type: 'effect',
        cost: 59,
        assetPath: 'assets/shopitem/chain_amplifier.png',
        effectBonuses: { shock: { chainCount: 1 } },
        availability: { requiresActiveEffect: 'shock' }
    }),
    createShopItem({
        id: 'flame',
        name: 'Flame',
        type: 'effect',
        cost: 56,
        assetPath: 'assets/shopitem/flame.png',
        effectBonuses: { burn: { explodeOnMaxStacks: true } },
        availability: { requiresActiveEffect: 'burn' }
    }),
    createShopItem({
        id: 'frozen_edge',
        name: 'Frozen Edge',
        type: 'effect',
        cost: 56,
        assetPath: 'assets/shopitem/frozen_edge.png',
        shortText: 'freeze bonus crite dame',
        effectBonuses: { freeze: { bonusCritDamageToFrozen: 0.35 } },
        availability: { requiresActiveEffect: 'freeze' }
    }),
    createShopItem({
        id: 'venom_trail',
        name: 'Venom Trail',
        type: 'effect',
        cost: 55,
        assetPath: 'assets/shopitem/venom_trail.png',
        modifiers: { hp: -20 },
        effectBonuses: { poison: { spawnTrail: true } }
    }),
    createShopItem({ id: 'elemental_overload', name: 'Elemental Overload', type: 'effect', cost: 58, assetPath: 'assets/shopitem/elemental_overload.png', modifiers: { effectChance: 0.12, effectDamageMultiplier: 0.12, damageMultiplier: -0.12 } }),
    createShopItem({
        id: 'shockwave_core',
        name: 'Shockwave Core',
        type: 'effect',
        cost: 50,
        assetPath: 'assets/shopitem/shockwave_core.png',
        effectBonuses: { shock: { chainDamageBonus: 0.15 } },
        availability: { requiresActiveEffect: 'shock' }
    }),
    createShopItem({ id: 'fire_core', name: 'Fire Core', type: 'unlock_element', cost: 70, assetPath: 'assets/shopitem/fire_core.png', unlockElement: { effectKey: 'burn', chance: 0.3, tags: ['fire'] } }),
    createShopItem({ id: 'ice_core', name: 'Ice Core', type: 'unlock_element', cost: 70, assetPath: 'assets/shopitem/ice_core.png', unlockElement: { effectKey: 'freeze', chance: 0.4, tags: ['ice'] } }),
    createShopItem({ id: 'poison_core', name: 'Poison Core', type: 'unlock_element', cost: 70, assetPath: 'assets/shopitem/poison_core.png', unlockElement: { effectKey: 'poison', chance: 0.3, tags: ['poison'] } }),
    createShopItem({ id: 'shock_core', name: 'Shock Core', type: 'unlock_element', cost: 70, assetPath: 'assets/shopitem/shock_core.png', unlockElement: { effectKey: 'shock', chance: 0.3, tags: ['lightning'] } }),
    createShopItem({ id: 'afang', name: 'Afang', type: 'unlock_element', cost: 70, assetPath: 'assets/shopitem/afang.png', unlockElement: { effectKey: 'bleed', chance: 0.3, tags: ['bleed'] } }),
    createShopItem({
        id: 'explore_core',
        name: 'Explore Core',
        type: 'unlock_element',
        cost: 70,
        assetPath: 'assets/shopitem/explore_core.png',
        availability: { excludesCharacterKeys: ['knight'] },
        unlockElement: {
            effectKey: 'explosion',
            label: 'Explosion',
            mode: 'hit_explosion',
            tags: ['explosion'],
            statusEntry: {
                key: 'explosion',
                trigger: 'onHit',
                target: 'target',
                radius: 45,
                damageRatio: 0.5
            }
        }
    }),
    createShopItem({ id: 'magnet_core', name: 'Magnet Core', type: 'utility', cost: 50, assetPath: 'assets/shopitem/magnet_core.png', modifiers: { pickupRangeMultiplier: 0.5 } }),
    createShopItem({ id: 'golden_idol', name: 'Golden Idol', type: 'utility', cost: 72, assetPath: 'assets/shopitem/golden_idol.png', modifiers: { goldGainMultiplier: 0.25, damageMultiplier: -0.1 } }),
    createShopItem({ id: 'greed_engine', name: 'Greed Engine', type: 'utility', cost: 72, assetPath: 'assets/shopitem/greed_engine.png', modifiers: { goldGainMultiplier: 0.35, hp: -20 } })
]);

export const SHOP_ITEM_MAP = Object.freeze(
    SHOP_ITEM_CONFIG.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
    }, {})
);

export function getShopItemConfig(itemId) {
    return SHOP_ITEM_MAP[itemId] ?? null;
}

export function getConditionalShopExcludeIds(activeEffectKeys = [], characterKey = null) {
    const effectKeySet = new Set(Array.isArray(activeEffectKeys) ? activeEffectKeys.filter(Boolean) : []);
    return SHOP_ITEM_CONFIG
        .filter((item) => {
            const requiredEffect = item.availability?.requiresActiveEffect;
            const excludedCharacterKeys = Array.isArray(item.availability?.excludesCharacterKeys)
                ? item.availability.excludesCharacterKeys
                : [];
            if (requiredEffect && !effectKeySet.has(requiredEffect)) return true;
            if (characterKey && excludedCharacterKeys.includes(characterKey)) return true;
            return false;
        })
        .map((item) => item.id);
}

export function getRandomShopItemStock(count = 3, excludeIds = []) {
    const blockedIds = new Set(excludeIds.filter(Boolean));
    const remainingPool = SHOP_ITEM_CONFIG.filter((item) => !blockedIds.has(item.id));
    const picks = [];
    const desiredCount = Math.max(0, count);

    while (picks.length < desiredCount && remainingPool.length > 0) {
        const availableTypes = Array.from(new Set(remainingPool.map((item) => item.type)));
        const totalWeight = availableTypes.reduce((sum, type) => sum + (SHOP_ITEM_TYPE_WEIGHTS[type] ?? 0), 0);

        let selectedType = availableTypes[0] ?? null;
        if (totalWeight > 0) {
            let roll = Math.random() * totalWeight;
            for (const type of availableTypes) {
                roll -= SHOP_ITEM_TYPE_WEIGHTS[type] ?? 0;
                if (roll <= 0) {
                    selectedType = type;
                    break;
                }
            }
        }

        const typePool = remainingPool.filter((item) => item.type === selectedType);
        const candidatePool = typePool.length > 0 ? typePool : remainingPool;
        const pickedItem = Phaser.Utils.Array.GetRandom(candidatePool);
        if (!pickedItem) break;

        picks.push(pickedItem);
        const pickedIndex = remainingPool.findIndex((item) => item.id === pickedItem.id);
        if (pickedIndex >= 0) {
            remainingPool.splice(pickedIndex, 1);
        }
    }

    return picks;
}
