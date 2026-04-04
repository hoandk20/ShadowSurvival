import { STATUS_SYNERGY_RULES } from '../../config/statusSynergies.js';

/**
 * @typedef {object} HitContext
 * @property {'hit' | 'kill'} [trigger]
 * @property {object | null} target
 * @property {object | null} source
 * @property {number | null} ownerPlayerId
 * @property {string[]} [attackTags]
 * @property {boolean} [isCritical]
 * @property {number} [damage]
 * @property {number} [damageTaken]
 * @property {number} [absorbedDamage]
 *
 * @typedef {object} SynergyRule
 * @property {string} key
 * @property {'hit' | 'kill'} [trigger]
 * @property {number} priority
 * @property {string[]} [requiredAttackTags]
 * @property {string[]} [requiredTargetStatuses]
 * @property {Record<string, number>} [requiredStatusStacks]
 * @property {boolean} [requireCrit]
 * @property {string} actionKey
 * @property {string[]} [consumeStatuses]
 */

const ACTION_HANDLERS = {
    frostfireBurst(resolver, context, rule) {
        const freezeEffect = resolver.getRelevantEffect(context, 'freeze');
        const ownerPlayerId = context.ownerPlayerId ?? freezeEffect?.ownerPlayerId ?? null;
        const source = context.source ?? freezeEffect?.source ?? null;
        const baseDamage = Math.max(1, Math.round(context.damageTaken ?? context.damage ?? 10));

        resolver.system.scene?.skillBehaviorPipeline?.effects?.spawnExplosion?.(
            context.target?.x ?? 0,
            context.target?.y ?? 0,
            (context.target?.depth ?? 20) + 4,
            {
                coreColor: 0xe8ffff,
                outerColor: 0x63c8ff,
                ringColor: 0x2f8fd9,
                emberColor: 0xb8f4ff,
                coreRadius: 16,
                outerRadius: 44,
                ringRadius: 12,
                pixelSize: 3
            }
        );

        resolver.system.applyOwnedDamage(context.target, baseDamage, {
            ownerPlayerId,
            source,
            tags: ['fire', 'ice', 'explosion', 'frostfire'],
            showDamageText: true,
            damageTextColor: '#bff3ff'
        });

        resolver.system.explodeAround(context.target, {
            radius: 110,
            damage: Math.max(1, baseDamage),
            ownerPlayerId,
            source,
            tags: ['fire', 'ice', 'explosion', 'frostfire']
        });

        resolver.consumeStatuses(context, rule.consumeStatuses ?? ['freeze']);
    },

    shatterChain(resolver, context, rule) {
        const freezeEffect = resolver.getRelevantEffect(context, 'freeze');
        const ownerPlayerId = freezeEffect?.ownerPlayerId ?? context.ownerPlayerId ?? null;
        const source = freezeEffect?.source ?? context.source ?? null;
        resolver.system.applyOwnedDamage(context.target, Math.max(8, Math.round((context.damageTaken ?? context.damage ?? 8) * 0.9)), {
            ownerPlayerId,
            source,
            tags: ['ice', 'lightning', 'shatter', 'burst'],
            showDamageText: true,
            damageTextColor: '#bff3ff'
        });
        resolver.consumeStatuses(context, rule.consumeStatuses ?? ['freeze']);
        resolver.system.spreadStatusAround(context.target, 'freeze', {
            ownerPlayerId,
            source,
            durationMs: 1000,
            mode: 'stun',
            slowMultiplier: 0,
            tags: ['ice', 'freeze', 'shatter_chain']
        }, {
            radius: 110,
            ownerPlayerId,
            source
        });
    },

    overloadExplosion(resolver, context) {
        const burnEffect = resolver.getRelevantEffect(context, 'burn');
        const ownerPlayerId = burnEffect?.ownerPlayerId ?? context.ownerPlayerId ?? null;
        const source = burnEffect?.source ?? context.source ?? null;
        resolver.system.explodeAround(context.target, {
            radius: 88,
            damage: Math.max(4, Math.round((context.damageTaken ?? context.damage ?? 8) * 0.5)),
            ownerPlayerId,
            source,
            tags: ['lightning', 'fire', 'overload', 'explosion']
        });
        resolver.spreadStatusFromEffect(context, 'burn', burnEffect, {
            radius: 88,
            ownerPlayerId,
            source,
            tags: ['fire', 'burn', 'overload']
        });
    },

    bloodShock(resolver, context) {
        const bleedEffects = resolver.getRelevantEffects(context, 'bleed');
        const bleedEffect = bleedEffects[0] ?? null;
        const remainingBleedDamage = bleedEffects.reduce((total, effect) => {
            const ticksRemaining = Math.max(1, Math.ceil((effect.remainingMs ?? effect.durationMs ?? 0) / Math.max(1, effect.tickIntervalMs ?? 500)));
            return total + ((effect.damagePerTick ?? 0) * Math.max(1, effect.stackCount ?? 1) * ticksRemaining);
        }, 0);
        resolver.system.applyOwnedDamage(context.target, Math.max(4, Math.round(remainingBleedDamage * 1.1)), {
            ownerPlayerId: bleedEffect?.ownerPlayerId ?? context.ownerPlayerId ?? null,
            source: bleedEffect?.source ?? context.source ?? null,
            tags: ['lightning', 'bleed', 'burst'],
            showDamageText: true,
            damageTextColor: '#ff7aa8'
        });
        resolver.consumeStatuses(context, ['bleed']);
    },

    executionChain(resolver, context) {
        const markEffect = resolver.getRelevantEffect(context, 'mark');
        resolver.system.chainLightningFrom(context.target, {
            ownerPlayerId: markEffect?.ownerPlayerId ?? context.ownerPlayerId ?? null,
            source: markEffect?.source ?? context.source ?? null,
            chainCount: 4,
            chainRadius: 150,
            baseDamage: Math.max(4, Math.round((context.damageTaken ?? context.damage ?? 8) * 1.5)),
            damageRatios: [0.85, 0.65, 0.45, 0.3],
            stepDelayMs: 70,
            targetMode: 'enemies'
        });
    },

    corrosionFlame(resolver, context) {
        resolver.getRelevantEffects(context, 'burn').forEach((effect) => {
            effect.damagePerTick = Math.max(1, Math.round(effect.damagePerTick * 1.15));
        });
        resolver.getRelevantEffects(context, 'poison').forEach((effect) => {
            effect.damagePerTick = Math.max(1, Math.round(effect.damagePerTick * 1.15));
            effect.remainingMs = Math.max(effect.remainingMs, effect.durationMs + 800);
        });
    },

    fireBlast(resolver, context) {
        const burnEffect = resolver.getRelevantEffect(context, 'burn');
        const ownerPlayerId = burnEffect?.ownerPlayerId ?? context.ownerPlayerId ?? null;
        const source = burnEffect?.source ?? context.source ?? null;
        resolver.system.explodeAround(context.target, {
            radius: 92,
            damage: Math.max(4, Math.round((context.damageTaken ?? context.damage ?? 8) * 0.55)),
            ownerPlayerId,
            source,
            tags: ['fire', 'explosion', 'fire_blast']
        });
        resolver.spreadStatusFromEffect(context, 'burn', burnEffect, {
            radius: 92,
            ownerPlayerId,
            source,
            tags: ['fire', 'burn', 'blast']
        });
    },

    huntersFlame(resolver, context) {
        resolver.getRelevantEffects(context, 'burn').forEach((effect) => {
            effect.damagePerTick = Math.max(1, Math.round(effect.damagePerTick * 1.5));
        });
    },

    frozenToxin(resolver, context) {
        const timeNow = context.target?.scene?.time?.now ?? resolver.system.scene?.time?.now ?? 0;
        resolver.getRelevantEffects(context, 'poison').forEach((effect) => {
            effect.state.frozenToxinFreezeExtensionMs = 500;
            effect.state.frozenToxinActiveUntilMs = Math.max(
                effect.state.frozenToxinActiveUntilMs ?? 0,
                timeNow + 1500
            );
        });
    },

    sniperWindow(resolver, context) {
        const markEffect = resolver.getRelevantEffect(context, 'mark');
        resolver.system.applyOwnedDamage(context.target, Math.max(4, Math.round((context.damageTaken ?? context.damage ?? 8) * 0.5)), {
            ownerPlayerId: markEffect?.ownerPlayerId ?? context.ownerPlayerId ?? null,
            source: markEffect?.source ?? context.source ?? null,
            tags: ['ice', 'mark', 'sniper', 'burst'],
            showDamageText: true,
            damageTextColor: '#d7f5ff'
        });
    },

    hemotoxin(resolver, context) {
        resolver.getRelevantEffects(context, 'poison').forEach((effect) => {
            effect.tickIntervalMs = Math.max(250, Math.round((effect.tickIntervalMs ?? 500) * 0.8));
        });
    },

    toxicBurst(resolver, context) {
        const poisonEffect = resolver.getRelevantEffect(context, 'poison');
        const ownerPlayerId = poisonEffect?.ownerPlayerId ?? context.ownerPlayerId ?? null;
        const source = poisonEffect?.source ?? context.source ?? null;
        resolver.system.spawnPoisonCloud(context.target, {
            radius: 84,
            durationMs: 3000,
            tickIntervalMs: 500,
            damage: Math.max(1, Math.round((context.damageTaken ?? context.damage ?? 8) * 0.2)),
            ownerPlayerId,
            source,
            tags: ['poison', 'burst', 'cloud']
        });
        resolver.spreadStatusFromEffect(context, 'poison', poisonEffect, {
            radius: 84,
            ownerPlayerId,
            source,
            tags: ['poison', 'cloud']
        });
    },

    lethalDose(resolver, context) {
        resolver.getRelevantEffects(context, 'poison').forEach((effect) => {
            effect.damagePerTick = Math.max(1, Math.round(effect.damagePerTick * 1.5));
        });
    },

    exposeWeakness(resolver, context) {
        resolver.getRelevantEffects(context, 'bleed').forEach((effect) => {
            effect.damagePerTick = Math.max(1, Math.round(effect.damagePerTick * 1.5));
        });
    },

    targetedBlast(resolver, context) {
        const markEffect = resolver.getRelevantEffect(context, 'mark');
        resolver.system.explodeAround(context.target, {
            radius: 180,
            damage: Math.max(5, Math.round((context.damageTaken ?? context.damage ?? 8) * 0.7)),
            ownerPlayerId: markEffect?.ownerPlayerId ?? context.ownerPlayerId ?? null,
            source: markEffect?.source ?? context.source ?? null,
            tags: ['explosion', 'mark', 'targeted_blast']
        });
    },

    bleedBurst(resolver, context) {
        const bleedEffect = resolver.getRelevantEffect(context, 'bleed');
        const bleedStacks = resolver.getStatusStacks(context, 'bleed');
        resolver.system.applyOwnedDamage(context.target, Math.max(4, Math.round((bleedEffect?.burstDamage ?? 10) * bleedStacks)), {
            ownerPlayerId: bleedEffect?.ownerPlayerId ?? context.ownerPlayerId ?? null,
            source: bleedEffect?.source ?? context.source ?? null,
            tags: ['physical', 'bleed', 'burst'],
            statusKey: 'bleed',
            showDamageText: true,
            damageTextColor: '#ff6f8f'
        });
    },

    bloodNova(resolver, context) {
        const bleedEffect = resolver.getRelevantEffect(context, 'bleed');
        if (bleedEffect) {
            resolver.spreadStatusFromEffect(context, 'bleed', bleedEffect, {
                radius: 90,
                ownerPlayerId: bleedEffect.ownerPlayerId ?? context.ownerPlayerId ?? null,
                source: bleedEffect.source ?? context.source ?? null,
                tags: ['bleed', 'blood_nova']
            });
        }
    }
};

export default class StatusSynergyResolver {
    constructor(system, rules = STATUS_SYNERGY_RULES) {
        this.system = system;
        this.rules = Array.isArray(rules) ? [...rules] : [];
    }

    resolveSynergy(context = {}) {
        const targetEffects = context.target?.statusEffects ?? null;
        if (!targetEffects) return null;
        const matchingRules = this.getMatchingRules(context, targetEffects);
        if (!matchingRules.length) return null;
        const selectedRule = this.selectPrimaryRule(matchingRules);
        const action = ACTION_HANDLERS[selectedRule.actionKey];
        if (typeof action !== 'function') return null;
        action(this, context, selectedRule);
        return {
            rule: selectedRule,
            actionKey: selectedRule.actionKey
        };
    }

    getMatchingRules(context = {}, targetEffects) {
        const attackTags = new Set(context.attackTags ?? []);
        const trigger = context.trigger ?? 'hit';
        return this.rules.filter((rule) => {
            if ((rule.trigger ?? 'hit') !== trigger) return false;
            if (rule.requireCrit === true && !context.isCritical) return false;
            const requiredAttackTags = Array.isArray(rule.requiredAttackTags) ? rule.requiredAttackTags : [];
            if (requiredAttackTags.length && !requiredAttackTags.every((tag) => attackTags.has(tag))) {
                return false;
            }
            const requiredTargetStatuses = Array.isArray(rule.requiredTargetStatuses) ? rule.requiredTargetStatuses : [];
            if (requiredTargetStatuses.length && !requiredTargetStatuses.every((statusKey) => targetEffects.hasEffect(statusKey))) {
                return false;
            }
            const requiredStatusStacks = rule.requiredStatusStacks ?? {};
            const hasRequiredStacks = Object.entries(requiredStatusStacks).every(([statusKey, minStacks]) => (
                (targetEffects.getTotalStackCount?.(statusKey) ?? 0) >= minStacks
            ));
            if (!hasRequiredStacks) return false;
            return true;
        });
    }

    selectPrimaryRule(matchingRules = []) {
        return [...matchingRules].sort((left, right) => {
            if ((right.priority ?? 0) !== (left.priority ?? 0)) {
                return (right.priority ?? 0) - (left.priority ?? 0);
            }
            const rightStatuses = right.requiredTargetStatuses?.length ?? 0;
            const leftStatuses = left.requiredTargetStatuses?.length ?? 0;
            if (rightStatuses !== leftStatuses) {
                return rightStatuses - leftStatuses;
            }
            return (left.key ?? '').localeCompare(right.key ?? '');
        })[0] ?? null;
    }

    getRelevantEffect(context = {}, statusKey) {
        return context.target?.statusEffects?.getPrimaryEffect?.(statusKey) ?? null;
    }

    getRelevantEffects(context = {}, statusKey) {
        return context.target?.statusEffects?.getEffects?.(statusKey) ?? [];
    }

    getStatusStacks(context = {}, statusKey) {
        return context.target?.statusEffects?.getTotalStackCount?.(statusKey) ?? 0;
    }

    consumeStatuses(context = {}, statusKeys = []) {
        statusKeys.forEach((statusKey) => {
            context.target?.statusEffects?.removeEffects?.(statusKey);
        });
    }

    spreadStatusFromEffect(context = {}, statusKey, effect = null, options = {}) {
        if (!effect) return;
        this.system.spreadStatusAround(context.target, statusKey, {
            durationMs: options.durationMs ?? effect.durationMs ?? effect.remainingMs,
            damagePerTick: effect.damagePerTick,
            damageRatioPerTick: effect.damageRatioPerTick,
            antiHealMultiplier: effect.antiHealMultiplier,
            chainCount: effect.chainCount,
            chainRadius: effect.chainRadius,
            chainDamageRatios: effect.chainDamageRatios ? [...effect.chainDamageRatios] : undefined,
            chainStepDelayMs: effect.chainStepDelayMs,
            tags: options.tags ?? [...effect.tags]
        }, {
            radius: options.radius ?? 80,
            ownerPlayerId: options.ownerPlayerId ?? effect.ownerPlayerId ?? context.ownerPlayerId ?? null,
            source: options.source ?? effect.source ?? context.source ?? null
        });
    }
}

export {
    ACTION_HANDLERS
};
