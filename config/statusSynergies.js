export const STATUS_SYNERGY_RULES = [
    {
        key: 'lightning_freeze_shatter_chain',
        trigger: 'hit',
        priority: 900,
        requiredAttackTags: ['lightning'],
        requiredTargetStatuses: ['freeze'],
        actionKey: 'shatterChain',
        consumeStatuses: ['freeze']
    },
    {
        key: 'ice_mark_sniper_window',
        trigger: 'hit',
        priority: 860,
        requiredAttackTags: ['ice'],
        requiredTargetStatuses: ['freeze', 'mark'],
        actionKey: 'sniperWindow'
    },
    {
        key: 'explosion_mark_targeted_blast',
        trigger: 'hit',
        priority: 840,
        requiredAttackTags: ['explosion'],
        requiredTargetStatuses: ['mark'],
        actionKey: 'targetedBlast'
    },
    {
        key: 'lightning_burn_overload_explosion',
        trigger: 'hit',
        priority: 820,
        requiredAttackTags: ['lightning'],
        requiredTargetStatuses: ['burn'],
        actionKey: 'overloadExplosion'
    },
    {
        key: 'explosion_burn_fire_blast',
        trigger: 'hit',
        priority: 780,
        requiredAttackTags: ['explosion'],
        requiredTargetStatuses: ['burn'],
        actionKey: 'fireBlast'
    },
    {
        key: 'lightning_mark_execution_chain',
        trigger: 'hit',
        priority: 740,
        requiredAttackTags: ['lightning'],
        requiredTargetStatuses: ['mark'],
        actionKey: 'executionChain'
    },
    {
        key: 'lightning_bleed_blood_shock',
        trigger: 'hit',
        priority: 700,
        requiredAttackTags: ['lightning'],
        requiredTargetStatuses: ['bleed'],
        actionKey: 'bloodShock'
    },
    {
        key: 'fire_mark_hunters_flame',
        trigger: 'hit',
        priority: 660,
        requiredAttackTags: ['fire'],
        requiredTargetStatuses: ['burn', 'mark'],
        actionKey: 'huntersFlame'
    },
    {
        key: 'fire_poison_corrosion_flame',
        trigger: 'hit',
        priority: 640,
        requiredAttackTags: ['fire'],
        requiredTargetStatuses: ['poison'],
        actionKey: 'corrosionFlame'
    },
    {
        key: 'ice_poison_frozen_toxin',
        trigger: 'hit',
        priority: 560,
        requiredAttackTags: ['ice'],
        requiredTargetStatuses: ['poison'],
        actionKey: 'frozenToxin'
    },
    {
        key: 'poison_mark_lethal_dose',
        trigger: 'hit',
        priority: 520,
        requiredAttackTags: ['poison'],
        requiredTargetStatuses: ['poison', 'mark'],
        actionKey: 'lethalDose'
    },
    {
        key: 'poison_bleed_hemotoxin',
        trigger: 'hit',
        priority: 500,
        requiredAttackTags: ['poison'],
        requiredTargetStatuses: ['poison', 'bleed'],
        actionKey: 'hemotoxin'
    },
    {
        key: 'bleed_mark_expose_weakness',
        trigger: 'hit',
        priority: 460,
        requiredAttackTags: ['physical'],
        requiredTargetStatuses: ['bleed', 'mark'],
        actionKey: 'exposeWeakness'
    },
    {
        key: 'bleed_crit_burst',
        trigger: 'hit',
        priority: 420,
        requiredTargetStatuses: ['bleed'],
        requireCrit: true,
        actionKey: 'bleedBurst'
    },
    {
        key: 'bleed_blood_nova',
        trigger: 'hit',
        priority: 700,
        requiredAttackTags: ['explosion'],
        requiredTargetStatuses: ['bleed'],
        actionKey: 'bloodNova'
    }
];
